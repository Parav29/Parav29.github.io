"""Booking rules: give every patient a told arrival a_i and a planned chair slot s_i.

Rules
  all8      everyone told 08:00, chairs first-come-first-served (current practice)
  lpt1h     longest treatment first, packed on chairs and nurses; told one hour
            before the slot (Liang 2015: lab patients asked to come 1 h early)
  spt1h     shortest first, otherwise as lpt1h
  buffer    two times per patient: s_i >= open + B_c, a_i = s_i - B_c, where B_c
            is the q-quantile of the ready delay D of class c (Presentation 3)
  mip       as buffer, but the slots come from the integer programme in mip.py
"""
import math

import numpy as np
import pandas as pd

from .params import SLOT, STAGES, DataConfig, Unit

SETUP_SLOTS = math.ceil(STAGES["line_premed"].mean / SLOT)      # 2
TAKEDOWN_SLOTS = math.ceil(STAGES["takedown"].mean / SLOT)      # 1


def ready_buffers(q, cfg: DataConfig = DataConfig(), n=400_000, seed=7, slot=SLOT):
    """B_c = q-quantile of D (told arrival -> drug ready), queues ignored."""
    rng = np.random.default_rng(seed)
    d = lambda s: rng.triangular(cfg.stage(s).low, cfg.stage(s).mode, cfg.stage(s).high, n)
    pre = d("arrival_dev") + d("registration") + d("billing") + d("pharmacy")
    same = (d("arrival_dev") + d("registration") + d("blood_draw") + d("lab")
            + d("doctor") + d("billing") + d("pharmacy"))
    raw = {"P": float(np.quantile(pre, q)), "S": float(np.quantile(same, q))}
    return {c: math.ceil(v / slot) * slot for c, v in raw.items()}, raw


def slots_needed(planned_infusion):
    return SETUP_SLOTS + planned_infusion // SLOT + TAKEDOWN_SLOTS


def greedy(pats, unit: Unit, release, order, horizon_extra=240):
    """List scheduling on a 15-min grid, Hesaraki chair and nurse limits.

    Nurse units: a setup or takedown slot uses M units, an infusion slot 1;
    the total in any slot is at most M*N.  Returns slot start (minutes).
    """
    M, U, K = unit.monitor_ratio, unit.nurse_units, unit.chairs
    T = (unit.close - unit.open + horizon_extra) // SLOT
    chairs = np.zeros(T, int)
    units = np.zeros(T, int)
    start = {}
    for i in order:
        L = slots_needed(int(pats.loc[i, "planned_infusion"]))
        prof = np.r_[np.full(SETUP_SLOTS, M), np.ones(L - SETUP_SLOTS - TAKEDOWN_SLOTS, int), np.full(TAKEDOWN_SLOTS, M)]
        t0 = max(0, math.ceil((release[i] - unit.open) / SLOT))
        for t in range(t0, T - L + 1):
            if (chairs[t:t + L] < K).all() and (units[t:t + L] + prof <= U).all():
                chairs[t:t + L] += 1
                units[t:t + L] += prof
                start[i] = unit.open + t * SLOT
                break
        else:   # no room even in overtime: put at the end of the horizon
            start[i] = unit.open + (T - L) * SLOT
    return pd.Series(start)


def book(day, rule, unit: Unit = Unit(), buffers=None, mip_kwargs=None):
    """Return the day's schedulable patients with columns told, slot, prio."""
    pats = day[~day.deferred_prior_day].copy()
    if rule == "all8":
        pats["told"] = float(unit.open)
        pats["slot"] = np.nan
    elif rule in ("lpt1h", "spt1h"):
        asc = rule == "spt1h"
        order = pats.sort_values("planned_infusion", ascending=asc, kind="stable").index
        pats["slot"] = greedy(pats, unit, {i: unit.open for i in pats.index}, order)
        pats["told"] = np.maximum(unit.open, pats.slot - 60)
    elif rule in ("buffer", "mip"):
        B = buffers
        rel = {i: unit.open + B[c] for i, c in pats.cls.items()}
        if rule == "buffer":
            # earliest release first, longest first within a release
            order = sorted(pats.index, key=lambda i: (rel[i], -pats.loc[i, "planned_infusion"]))
            pats["slot"] = greedy(pats, unit, rel, order)
        else:
            from .mip import solve_template
            pats["slot"] = solve_template(pats, unit, rel, **(mip_kwargs or {}))["slot"]
        pats["told"] = pats.slot - pats.cls.map(B)
    else:
        raise ValueError(rule)
    # priority at the chair: planned slot; FCFS (ready time) breaks ties / all8
    pats["prio"] = pats.slot.fillna(0)
    return pats
