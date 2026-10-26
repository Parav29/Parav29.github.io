"""Time-indexed integer programme for the chair slots (docs/FORMULATION.md).

Hesaraki, Dellaert & de Kok (2019) chair and nurse limits, with each patient's
release time set by the ready-time buffer: s_i >= open + B_c(i).
Pharmacy smoothing (Presentation 1: pharmacy wants level demand) caps how many
chair starts fall in any window of one pharmacy preparation time.

Patients with the same class and planned infusion are interchangeable, so the
model is written per group g = (class, planned length):

    y[g,t] = number of group-g patients whose chair slot starts in grid slot t

This is the per-patient model x[i,t] with the symmetry removed; any x gives a
y with the same objective and vice versa (assign the n_g patients of g to the
starts of g in any order).
"""
import math

import numpy as np
import pandas as pd
import pulp

from .booking import SETUP_SLOTS, TAKEDOWN_SLOTS, greedy, slots_needed
from .params import SLOT, STAGES, Unit


class WarmHiGHS(pulp.HiGHS):
    """PuLP's HiGHS interface plus a MIP start taken from each variable's initial value."""

    def actualSolve(self, lp):
        import highspy
        self.createAndConfigureSolver(lp)
        self.buildSolverModel(lp)
        sol = highspy.HighsSolution()
        sol.col_value = [v.varValue if v.varValue is not None else 0.0 for v in lp.variables()]
        sol.value_valid = True
        lp.solverModel.setSolution(sol)
        self.callSolver(lp)
        status, sol_status = self.findSolutionValues(lp)
        lp.assignStatus(status, sol_status)
        return status


def solve_template(pats, unit: Unit, release, horizon_extra=240, w_flow=1.0, w_makespan=None,
                   w_overtime=None, pharmacy_cap=False, arrival_cap=False, time_limit=60, gap=0.0, msg=False, n_starts=40):
    M, U, K = unit.monitor_ratio, unit.nurse_units, unit.chairs
    T = (unit.close - unit.open + horizon_extra) // SLOT
    T_close = (unit.close - unit.open) // SLOT
    n = len(pats)
    w_makespan = n / 4 if w_makespan is None else w_makespan
    w_overtime = 10 * n if w_overtime is None else w_overtime

    key = {i: (pats.loc[i, "cls"], int(pats.loc[i, "planned_infusion"]), release[i]) for i in pats.index}
    groups = sorted(set(key.values()))
    members = {g: [i for i in pats.index if key[i] == g] for g in groups}
    L = {g: slots_needed(g[1]) for g in groups}
    r = {g: max(0, math.ceil((g[2] - unit.open) / SLOT)) for g in groups}
    feas = {g: range(r[g], T - L[g] + 1) for g in groups}

    prob = pulp.LpProblem("chair_slots", pulp.LpMinimize)
    y = {(g, t): pulp.LpVariable(f"y_{gi}_{t}", lowBound=0, upBound=len(members[g]), cat="Integer")
         for gi, g in enumerate(groups) for t in feas[g]}
    # z[tau] = 1 while the unit is still open at slot tau (some chair busy now or later)
    z = {tau: pulp.LpVariable(f"z_{tau}", cat="Binary") for tau in range(T)}
    cmax = pulp.lpSum(z.values())                                             # (5) makespan, in slots
    over = pulp.lpSum(z[tau] for tau in range(T_close, T))                    # (6) overtime, in slots

    flow = pulp.lpSum((t + L[g]) * y[g, t] for g in groups for t in feas[g])
    prob += w_flow * flow + w_makespan * cmax + w_overtime * over

    for g in groups:
        prob += pulp.lpSum(y[g, t] for t in feas[g]) == len(members[g])      # (1) everyone gets a slot

    for tau in range(T):
        if tau + 1 < T:
            prob += z[tau] >= z[tau + 1]                                      # open is a prefix of the day
        chair, nurse = [], []
        for g in groups:
            for t in feas[g]:
                k = tau - t
                if 0 <= k < L[g]:
                    chair.append(y[g, t])
                    nurse.append((M if (k < SETUP_SLOTS or k >= L[g] - TAKEDOWN_SLOTS) else 1) * y[g, t])
        if chair:
            prob += pulp.lpSum(chair) <= K * z[tau]                           # (2) chairs, only while open
            prob += pulp.lpSum(nurse) <= U                                    # (3) nurses

    cap, arr_caps = None, None
    if pharmacy_cap:                                                           # (4) pharmacy smoothing
        win = max(1, math.ceil(STAGES["pharmacy"].mean / SLOT))
        cap = math.floor(unit.pharmacy_hoods * win * SLOT / STAGES["pharmacy"].mean)
        for tau in range(T):
            starts = [y[g, t] for g in groups for t in feas[g] if tau <= t < tau + win]
            if starts:
                prob += pulp.lpSum(starts) <= cap

    if arrival_cap:                                                            # (7) arrival smoothing
        # told arrival slot = chair slot - buffer = t - r_g. Cap arrivals per 15 min at what the
        # registration desks (everyone) and the doctors (same-day patients only) can serve.
        cap_all = math.floor(unit.registration_desks * SLOT / STAGES["registration"].mean)
        cap_s = math.floor(unit.doctors * SLOT / STAGES["doctor"].mean)
        arr_caps = (cap_all, cap_s)
        for a in range(T):
            told_all = [y[g, t] for g in groups for t in feas[g] if t - r[g] == a]
            told_s = [y[g, t] for g in groups for t in feas[g] if t - r[g] == a and g[0] == "S"]
            if told_all:
                prob += pulp.lpSum(told_all) <= cap_all
            if told_s:
                prob += pulp.lpSum(told_s) <= cap_s

    # MIP start: best of several greedy list schedules (longest-first within release, plus random tie-breaks)
    def score(sched):
        C = [int((sched[i] - unit.open) // SLOT) + L[key[i]] for i in pats.index]
        return w_flow * sum(C) + w_makespan * max(C) + w_overtime * max(0, max(C) - T_close)

    rng = np.random.default_rng(0)
    plen = pats.planned_infusion.to_dict()
    orders = [sorted(pats.index, key=lambda i: (release[i], -plen[i])), sorted(pats.index, key=lambda i: -plen[i])]
    for _ in range(n_starts):
        noise = {i: rng.normal(0, 60) for i in pats.index}
        orders.append(sorted(pats.index, key=lambda i: release[i] - plen[i] + noise[i]))
    g0 = min((greedy(pats, unit, release, o, horizon_extra, arr_caps) for o in orders), key=score)
    for v in y.values():
        v.setInitialValue(0)
    last = 0
    for i, s0 in g0.items():
        t = int((s0 - unit.open) // SLOT)
        y[key[i], t].setInitialValue(y[key[i], t].varValue + 1)
        last = max(last, t + L[key[i]])
    for tau in range(T):
        z[tau].setInitialValue(1 if tau < last else 0)

    status = prob.solve(WarmHiGHS(msg=msg, timeLimit=time_limit, gapRel=gap, threads=1))
    if pulp.LpStatus[status] not in ("Optimal", "Not Solved"):
        raise RuntimeError(f"MIP status {pulp.LpStatus[status]}")
    slot = {}
    for g in groups:
        starts = [t for t in feas[g] for _ in range(int(round(y[g, t].value() or 0)))]
        # longest-waiting-first is irrelevant inside a group: members are identical
        for i, t in zip(members[g], starts):
            slot[i] = unit.open + SLOT * t
    status_txt = pulp.LpStatus[status]
    if len(slot) != n:          # time limit hit before any integer solution: keep the greedy start
        slot, status_txt = g0.to_dict(), "greedy-fallback"
    return dict(slot=pd.Series(slot), status=status_txt, objective=pulp.value(prob.objective),
                cmax=unit.open + SLOT * pulp.value(cmax), overtime=SLOT * pulp.value(over), n_vars=len(y) + len(z),
                n_cons=len(prob.constraints), pharmacy_cap=cap)
