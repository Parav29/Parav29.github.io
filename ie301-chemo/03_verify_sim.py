"""Step 3 - verify (is the code right?) and validate (is the model right?) the simulation.

Writes results/verify_sim.md; exits 1 on any verification failure.
"""
import sys
from dataclasses import replace

import numpy as np
import pandas as pd

from chemo.booking import book, ready_buffers
from chemo.datagen import apply_classes, generate
from chemo.params import STAGES, DataConfig, Unit
from chemo.sim import metrics, simulate

rows = []
unit = Unit()
B, _ = ready_buffers(0.8)


def check(name, ok, detail, kind="verification"):
    rows.append(dict(kind=kind, check=name, result="PASS" if ok else "FAIL", detail=detail))


def one_patient(cls):
    """A degenerate day: one patient, every time fixed at its mode."""
    r = {s: STAGES[s].mode for s in STAGES}
    r.update(day=0, pid=0, cls=cls, planned_infusion=120, actual_infusion=120.0, unfit=False, noshow=False,
             deferred_prior_day=False, told=480.0, slot=np.nan, prio=0.0)
    return pd.DataFrame([r])


# 1-2. hand calculation, one patient per class
for cls, pre in [("S", ["registration", "blood_draw", "lab", "doctor", "billing", "pharmacy"]),
                 ("P", ["registration", "billing", "pharmacy"])]:
    d = simulate(one_patient(cls))
    p = d.pats[0]
    exp_inf = 480 + sum(STAGES[s].mode for s in pre) + STAGES["line_premed"].mode
    exp_done = exp_inf + 120 + STAGES["takedown"].mode + STAGES["discharge"].mode
    check(f"hand calculation, class {cls}", abs(p.inf_start - exp_inf) < 1e-9 and abs(p.done - exp_done) < 1e-9,
          f"infusion starts {p.inf_start:.1f} (hand {exp_inf:.1f}), leaves {p.done:.1f} (hand {exp_done:.1f})")

# 3-7. invariants on 20 real days x 4 rules
data = generate(DataConfig(days=20), unit)
viol, cons, order_bad, integ_bad, chair_bad = 0, 0, 0, 0.0, 0.0
for _, g in data.groupby("day"):
    for rule in ["all8", "lpt1h", "spt1h", "buffer"]:
        d = simulate(book(g, rule, unit, buffers=B), unit, check=True)   # asserts inside dispatch
        log = np.array(d.log)
        viol += int(((log[:, 1] < 0) | (log[:, 1] > unit.chairs) | (log[:, 2] < 0) | (log[:, 2] > unit.nurse_units)).sum())
        m = metrics(d)
        cons += int(m["booked"] != m["treated"] + m["unfit"] + m["noshow"])
        tr = [p for p in d.pats if p.outcome == "treated"]
        for p in tr:
            seq = [p.arrive, p.reg_start, p.reg_end, p.bill_end, p.pharm_start, p.ready, p.setup_start, p.inf_start,
                   p.inf_end, p.td_start, p.chair_release, p.done]
            order_bad += int(any(b < a - 1e-9 for a, b in zip(seq, seq[1:])))
        # time integrals of the logged state equal the sums over patients
        t = np.r_[log[1:, 0], log[-1, 0]] - log[:, 0]
        lobby = (t * (log[:, 3] + log[:, 4])).sum()
        lobby_p = sum(p.setup_start - p.arrive for p in tr) + sum(p.done - p.arrive for p in d.pats if p.outcome == "unfit")
        integ_bad = max(integ_bad, abs(lobby - lobby_p))
        chair_bad = max(chair_bad, abs((t * log[:, 1]).sum() - sum(p.chair_release - p.setup_start for p in tr)))
check("capacity never exceeded", viol == 0, f"{viol} log entries outside 0..K chairs or 0..M*N nurse units (80 days)")
check("patients conserved", cons == 0, "booked = treated + unfit + no-show on every day")
check("timestamps in order", order_bad == 0, f"{order_bad} treated patients with a time going backwards")
check("Little's law (lobby)", integ_bad < 1e-6, f"time-integral of patients waiting = sum of their waits (max diff {integ_bad:.2e})")
check("chair-minutes balance", chair_bad < 1e-6, f"time-integral of busy chairs = sum of chair stays (max diff {chair_bad:.2e})")

# 8. nurse rule: M*setups + drips <= M*N at every instant, from patient intervals
u1 = replace(unit, nurses=2)
d = simulate(book(data[data.day == 0], "all8", u1, buffers=B), u1)
worst = 0
for t in np.arange(480, 1500, 1.0):
    setups = sum((p.setup_start <= t < p.inf_start) or (p.td_start <= t < p.chair_release) for p in d.pats if p.outcome == "treated")
    drips = sum(p.inf_start <= t < p.td_start for p in d.pats if p.outcome == "treated")
    worst = max(worst, u1.monitor_ratio * setups + drips)
check("Hesaraki nurse constraint (N=2)", worst <= u1.nurse_units, f"max M*setups + drips = {worst} <= M*N = {u1.nurse_units}")

# 9. infinite capacity: simulated ready delay = the delay-only calculation of Presentation 3
big = replace(unit, chairs=999, nurses=999, registration_desks=999, doctors=999, pharmacy_hoods=999)
D = {"P": [], "S": []}
for cls in ["P", "S"]:
    days = DataConfig(days=200, p_precleared=1.0 if cls == "P" else 0.0, p_unfit=0, p_noshow=0)
    for _, g in generate(days, unit).groupby("day"):           # normal-size days, unlimited resources
        d = simulate(book(g, "all8", big), big)
        D[cls] += [p.ready - p.told for p in d.pats]
q = {c: np.percentile(v, 80) for c, v in D.items()}
check("infinite capacity reproduces slide 7", abs(q["P"] - 89.9) < 2 and abs(q["S"] - 206.2) < 2,
      f"80th pct ready delay: P {q['P']:.1f} (89.9), S {q['S']:.1f} (206.2); n = {len(D['P'])}, {len(D['S'])}")

# 10. deterministic replay
g = data[data.day == 5]
a, b = metrics(simulate(book(g, "buffer", unit, buffers=B), unit)), metrics(simulate(book(g, "buffer", unit, buffers=B), unit))
check("same input, same output", a == b, "two runs of day 5 identical")

# ---- validation against Indian figures -----------------------------------
def vcheck(name, value, target, tol, detail):
    """Validation: MATCH within tol (relative), else ABOVE / BELOW. Reported, never fails the script."""
    res = "MATCH" if abs(value - target) <= tol * target else ("ABOVE" if value > target else "BELOW")
    rows.append(dict(kind="validation", check=name, result=res, detail=detail))


v0 = generate(DataConfig(days=100, p_precleared=0.0), unit)
for rule, label in [("all8", "all told 08:00"), ("lpt1h", "appointments, told 1 h early (Liang)")]:
    v = pd.DataFrame([metrics(simulate(book(g, rule, unit), unit)) for _, g in v0.groupby("day")])
    w = v.wait_mean.mean()
    vcheck(f"Kochi wait 3.5 h (V1), {label}", w, 210, 0.20,
           f"0% pre-cleared: mean wait to drip {w / 60:.2f} h (registration queue {v.q_reg.mean():.0f} min, "
           f"doctor queue {v.q_doctor.mean():.0f} min); no-queue floor 3.67 h")
    vcheck(f"time in unit 5 h 40 (V2), {label}", v.los_mean.mean(), 340, 0.20,
           f"mean time in unit {v.los_mean.mean() / 60:.2f} h (V2 SD 3 h 42, so the band is wide)")
vb = pd.DataFrame([metrics(simulate(book(g, "all8", unit), unit)) for _, g in data.groupby("day")])
vcheck("morning starvation (slide 11: 35%)", vb.idle_starve.mean() / (unit.chairs * 600), 0.35, 0.20,
       f"30% pre-cleared, all told 08:00: chair-hours lost to 'patient here, not ready' = "
       f"{vb.idle_starve.mean() / (unit.chairs * 600):.0%}")

out = pd.DataFrame(rows)
with open("results/verify_sim.md", "w") as f:
    f.write("# Simulation verification and validation\n\n")
    f.write(out.to_markdown(index=False) + "\n")
print(out.to_string(index=False))
sys.exit(0 if (out[out.kind == "verification"].result == "PASS").all() else 1)
