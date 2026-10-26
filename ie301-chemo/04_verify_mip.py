"""Step 4 - verify the optimisation formulation. Writes results/verify_mip.md; exits 1 on failure.

1. Every MIP schedule is re-checked against the constraints by independent code.
2. On small instances the MIP optimum equals a brute-force enumeration.
3. On real days the MIP is never worse than the greedy heuristic on its own objective.
"""
import itertools
import math
import sys
import time
from dataclasses import replace

import numpy as np
import pandas as pd

from chemo.booking import SETUP_SLOTS, TAKEDOWN_SLOTS, greedy, ready_buffers, slots_needed
from chemo.datagen import generate
from chemo.mip import solve_template
from chemo.params import SLOT, DataConfig, Unit

rows = []


def check(name, ok, detail):
    rows.append(dict(check=name, result="PASS" if ok else "FAIL", detail=detail))


def profile(L, M):
    return np.r_[np.full(SETUP_SLOTS, M), np.ones(L - SETUP_SLOTS - TAKEDOWN_SLOTS, int), np.full(TAKEDOWN_SLOTS, M)]


def evaluate(pats, slot, unit, release, horizon_extra=240):
    """Independent constraint check + objective of the MIP (in grid slots)."""
    M, U, K = unit.monitor_ratio, unit.nurse_units, unit.chairs
    T = (unit.close - unit.open + horizon_extra) // SLOT
    Tc = (unit.close - unit.open) // SLOT
    chairs, units = np.zeros(T + 60, int), np.zeros(T + 60, int)
    C, ok_rel = [], True
    for i in pats.index:
        L = slots_needed(int(pats.loc[i, "planned_infusion"]))
        t = int((slot[i] - unit.open) // SLOT)
        ok_rel &= slot[i] >= release[i] - 1e-9 and t + L <= T
        chairs[t:t + L] += 1
        units[t:t + L] += profile(L, M)
        C.append(t + L)
    n = len(pats)
    obj = sum(C) + (n / 4) * max(C) + 10 * n * max(0, max(C) - Tc)
    return dict(ok=bool(ok_rel and chairs.max() <= K and units.max() <= U), obj=obj,
                chair_max=int(chairs.max()), unit_max=int(units.max()), overtime=SLOT * max(0, max(C) - Tc))


# 1 + 3. real days: feasibility and MIP <= greedy
unit = Unit()
B, _ = ready_buffers(0.8)
data = generate(DataConfig(days=20), unit)
feas_ok, better, gaps, times, ot = 0, 0, [], [], []
for _, g in data.groupby("day"):
    pats = g[~g.deferred_prior_day]
    rel = {i: unit.open + B[c] for i, c in pats.cls.items()}
    t0 = time.time()
    res = solve_template(pats, unit, rel, time_limit=15, gap=0.01)
    times.append(time.time() - t0)
    e_mip = evaluate(pats, res["slot"], unit, rel)
    order = sorted(pats.index, key=lambda i: (rel[i], -pats.loc[i, "planned_infusion"]))
    e_gr = evaluate(pats, greedy(pats, unit, rel, order), unit, rel)
    feas_ok += e_mip["ok"]
    better += e_mip["obj"] <= e_gr["obj"] + 1e-6
    gaps.append((e_gr["obj"] - e_mip["obj"]) / e_gr["obj"])
    ot.append((e_mip["overtime"], e_gr["overtime"]))
check("MIP schedules satisfy every constraint (independent check)", feas_ok == 20,
      f"{feas_ok}/20 days: one slot each, s_i >= release, chairs <= {unit.chairs}, nurse units <= {unit.nurse_units}")
check("MIP objective <= greedy objective", better == 20,
      f"{better}/20 days; greedy is {np.mean(gaps):.1%} worse on average (max {np.max(gaps):.1%})")
ot = np.array(ot)
check("planned overtime, MIP vs greedy", ot[:, 0].mean() <= ot[:, 1].mean(),
      f"mean planned overtime {ot[:, 0].mean():.0f} min (MIP) vs {ot[:, 1].mean():.0f} min (greedy)")
check("solve time", np.max(times) < 30, f"mean {np.mean(times):.1f} s, max {np.max(times):.1f} s per day (limit 15 s, gap 1%)")

# 2. brute force on small instances
rng = np.random.default_rng(11)
small = replace(unit, chairs=2, nurses=2, open=480, close=600)       # 2 h day, 2 chairs, 2 nurses
matches = 0
for k in range(6):
    n = 4
    pats = pd.DataFrame(dict(cls=rng.choice(["P", "S"], n), planned_infusion=rng.choice([30, 60, 120], n)))
    rel = {i: small.open + (0 if c == "P" else 30) for i, c in pats.cls.items()}
    extra = 120
    T = (small.close - small.open + extra) // SLOT
    choices = [range(math.ceil((rel[i] - small.open) / SLOT), T - slots_needed(int(pats.planned_infusion[i])) + 1)
               for i in pats.index]
    best = math.inf
    for combo in itertools.product(*choices):
        s = {i: small.open + SLOT * t for i, t in zip(pats.index, combo)}
        e = evaluate(pats, s, small, rel, horizon_extra=extra)
        if e["ok"]:
            best = min(best, e["obj"])
    try:
        res = solve_template(pats, small, rel, horizon_extra=extra, time_limit=30, gap=0.0)
    except RuntimeError:                       # MIP proves infeasible: brute force must agree
        matches += best == math.inf
        continue
    got = evaluate(pats, res["slot"], small, rel, horizon_extra=extra)
    matches += got["ok"] and abs(got["obj"] - best) < 1e-6
check("MIP optimum = brute force (6 random 4-patient instances)", matches == 6,
      f"{matches}/6 match exactly (2 chairs, 2 nurses, M = 4, mixed releases)")

out = pd.DataFrame(rows)
with open("results/verify_mip.md", "w") as f:
    f.write("# Optimisation verification\n\n" + out.to_markdown(index=False) + "\n")
print(out.to_string(index=False))
sys.exit(0 if (out.result == "PASS").all() else 1)
