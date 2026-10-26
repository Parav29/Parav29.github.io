"""Discrete-event simulation of one day in the unit (SimPy).

Flow (Presentation 3, slide 9):
  arrive -> 1 register (desk) -> [same-day only: 2 blood draw, 3 lab (hospital
  counter, uncontrolled delay), 4 doctor review (unfit go home)] -> 5 billing
  -> 6 pharmacy (hoods) -> 7 wait for chair + nurse -> 8 line/pre-meds (nurse
  exclusive) -> 9 infusion (nurse shared 1:M) -> takedown (nurse exclusive,
  chair still held) -> 10 discharge (chair released).

Nurses are modelled as M*N "units": setup and takedown take M units, an
infusing patient holds 1.  That is Hesaraki's constraint
M * setups + patients on the drip <= M * N.
"""
from dataclasses import dataclass

import numpy as np
import simpy

from .params import Unit


@dataclass
class P:
    pid: int
    cls: str
    told: float
    prio: float
    planned: float
    row: dict
    arrive: float = np.nan
    reg_start: float = np.nan
    reg_end: float = np.nan
    lab_end: float = np.nan
    doc_start: float = np.nan
    doc_end: float = np.nan
    bill_end: float = np.nan
    pharm_start: float = np.nan
    ready: float = np.nan
    setup_start: float = np.nan
    inf_start: float = np.nan
    inf_end: float = np.nan
    td_start: float = np.nan
    chair_release: float = np.nan
    done: float = np.nan
    outcome: str = ""          # treated / unfit / noshow
    ev: object = None


class Day:
    def __init__(self, booked, unit: Unit = Unit(), check=True):
        self.env = simpy.Environment()
        self.u = unit
        self.check = check
        self.desk = simpy.Resource(self.env, unit.registration_desks)
        self.doctor = simpy.Resource(self.env, unit.doctors)
        self.hood = simpy.Resource(self.env, unit.pharmacy_hoods)
        self.chairs_free = unit.chairs
        self.units_free = unit.nurse_units
        self.ready_q, self.td_q = [], []
        self.n_pre = 0
        self.log = []
        self.pats = [P(int(r.pid), r.cls, float(r.told), float(r.prio), float(r.planned_infusion), r._asdict())
                     for r in booked.itertuples()]
        self._log()
        for p in self.pats:
            self.env.process(self.patient(p))

    # ---------------------------------------------------------------- state
    def _log(self):
        self.log.append((self.env.now, self.u.chairs - self.chairs_free,
                         self.u.nurse_units - self.units_free, len(self.ready_q), self.n_pre))

    def dispatch(self):
        M = self.u.monitor_ratio
        while True:
            if self.td_q and self.units_free >= M - 1:        # takedowns first: patient is done
                p = self.td_q.pop(0)
                self.units_free -= M - 1                      # already holds 1 unit
            elif self.ready_q and self.chairs_free > 0 and self.units_free >= M:
                p = min(self.ready_q, key=lambda x: (x.prio, x.ready))
                self.ready_q.remove(p)
                self.chairs_free -= 1
                self.units_free -= M
            else:
                break
            if self.check:
                assert 0 <= self.chairs_free <= self.u.chairs and 0 <= self.units_free <= self.u.nurse_units
            p.ev.succeed()
        self._log()

    # -------------------------------------------------------------- patient
    def patient(self, p: P):
        env, r, M = self.env, p.row, self.u.monitor_ratio
        yield env.timeout(max(0.0, p.told + r["arrival_dev"]))
        p.arrive = env.now
        if r["noshow"]:
            p.outcome = "noshow"
            return
        self.n_pre += 1
        self._log()
        with self.desk.request() as q:
            yield q
            p.reg_start = env.now
            yield env.timeout(r["registration"])
        p.reg_end = env.now
        if p.cls == "S":
            yield env.timeout(r["blood_draw"] + r["lab"])
            p.lab_end = env.now
            with self.doctor.request() as q:
                yield q
                p.doc_start = env.now
                yield env.timeout(r["doctor"])
            p.doc_end = env.now
            if r["unfit"]:
                p.outcome, p.done = "unfit", env.now
                self.n_pre -= 1
                self._log()
                return
        yield env.timeout(r["billing"])
        p.bill_end = env.now
        if self.u.precompound_precleared and p.cls == "P":
            p.pharm_start = env.now                           # drug made before opening
        else:
            with self.hood.request() as q:
                yield q
                p.pharm_start = env.now
                yield env.timeout(r["pharmacy"])
        p.ready = env.now
        self.n_pre -= 1
        p.ev = env.event()
        self.ready_q.append(p)
        self.dispatch()
        yield p.ev
        p.setup_start = env.now
        self._log()
        yield env.timeout(r["line_premed"])
        self.units_free += M - 1                              # keep one unit for monitoring
        self.dispatch()
        p.inf_start = env.now
        yield env.timeout(r["actual_infusion"])
        p.inf_end = env.now
        p.ev = env.event()
        self.td_q.append(p)
        self.dispatch()
        yield p.ev
        p.td_start = env.now
        yield env.timeout(r["takedown"])
        self.units_free += M
        self.chairs_free += 1
        p.chair_release = env.now
        self.dispatch()
        yield env.timeout(r["discharge"])
        p.done = env.now
        p.outcome = "treated"

    def run(self):
        self.env.run()
        return self


# ------------------------------------------------------------------ metrics
def _integrals(log, t0, t1, K):
    """Time-integrate the state log over [t0, t1]."""
    a = np.array(log, float)
    out = dict(chair_busy=0.0, starve=0.0, nurse_bound=0.0, empty=0.0)
    for (t, cb, ub, nr, npre), tn in zip(a, np.r_[a[1:, 0], max(a[-1, 0], t1)]):
        lo, hi = max(t, t0), min(tn, t1)
        if hi <= lo:
            continue
        dt, free = hi - lo, K - cb
        out["chair_busy"] += cb * dt
        nb = min(free, nr)                    # patient ready, chair free, no nurse
        st = min(free - nb, npre)             # chair free, patient in unit, not ready
        out["nurse_bound"] += nb * dt
        out["starve"] += st * dt
        out["empty"] += (free - nb - st) * dt
    return out


def metrics(day: Day):
    u = day.u
    ps = day.pats
    tr = [p for p in ps if p.outcome == "treated"]
    wait = np.array([p.inf_start - p.arrive for p in tr])
    last_release = max([p.chair_release for p in tr], default=u.close)
    ig = _integrals(day.log, u.open, u.close, u.chairs)
    a = np.array(day.log, float)
    stage = lambda f: float(np.nanmean([f(p) for p in tr])) if tr else np.nan
    m = dict(
        booked=len(ps), treated=len(tr),
        unfit=sum(p.outcome == "unfit" for p in ps), noshow=sum(p.outcome == "noshow" for p in ps),
        wait_mean=wait.mean(), wait_p90=np.percentile(wait, 90),
        wait_mean_P=np.mean([w for w, p in zip(wait, tr) if p.cls == "P"]) if any(p.cls == "P" for p in tr) else np.nan,
        wait_mean_S=np.mean([w for w, p in zip(wait, tr) if p.cls == "S"]) if any(p.cls == "S" for p in tr) else np.nan,
        los_mean=float(np.mean([p.done - p.arrive for p in tr])),
        overtime=max(0.0, last_release - u.close),
        chair_util=ig["chair_busy"] / (u.chairs * (u.close - u.open)),
        idle_starve=ig["starve"], idle_nurse=ig["nurse_bound"], idle_empty=ig["empty"],
        blocking=float(sum(p.td_start - p.inf_end for p in tr)),
        q_reg=stage(lambda p: p.reg_start - p.arrive),
        q_doctor=float(np.nanmean([p.doc_start - p.lab_end for p in ps if p.doc_start == p.doc_start] or [np.nan])),
        q_pharm=stage(lambda p: p.pharm_start - p.bill_end),
        q_chair=stage(lambda p: p.setup_start - p.ready),
        late_vs_slot=stage(lambda p: max(0.0, p.ready - p.row["slot"])),
        nurse_peak=a[:, 2].max() / u.nurse_units,
        ready_peak=a[:, 3].max(),
        lobby_peak=(a[:, 3] + a[:, 4]).max(),
    )
    return m


def patient_log(day: Day, day_id):
    """Event log in the exact schema requested from TMH (Presentation 3, slide 5)."""
    rows = []
    for p in day.pats:
        rows.append(dict(day=day_id, pid=p.pid, cls=p.cls, outcome=p.outcome, told=p.told, slot=p.prio,
                         planned_infusion=p.planned, arrive=p.arrive, registration_start=p.reg_start,
                         registration_end=p.reg_end, lab_result=p.lab_end, review_start=p.doc_start,
                         clearance=p.doc_end, billing_end=p.bill_end, pharmacy_start=p.pharm_start,
                         drug_ready=p.ready, chair_start=p.setup_start, infusion_start=p.inf_start,
                         infusion_end=p.inf_end, takedown_start=p.td_start, chair_end=p.chair_release,
                         discharge=p.done))
    return rows


def simulate(booked, unit: Unit = Unit(), check=True):
    return Day(booked, unit, check).run()
