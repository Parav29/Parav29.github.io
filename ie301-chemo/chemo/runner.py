"""Run a scenario over many days in parallel, with cached MIP schedules.

A scenario = (data config, unit, booking rule, buffer coverage q).
All scenarios use the same seeded days (common random numbers), so the
difference between two rules on day d is a paired comparison.
"""
import hashlib
import json
import os
from dataclasses import asdict, dataclass, field, replace
from multiprocessing import Pool

import numpy as np
import pandas as pd
from scipy import stats

from .booking import book, ready_buffers
from .datagen import generate_day
from .params import DataConfig, Unit
from .sim import metrics, patient_log, simulate

CACHE = os.path.join(os.path.dirname(__file__), "..", "results", "cache")
MIP_ARGS = dict(time_limit=15, gap=0.01, pharmacy_cap=False)


@dataclass(frozen=True)
class Scenario:
    name: str
    rule: str = "mip"
    q: float = 0.8
    data: DataConfig = field(default_factory=DataConfig)
    unit: Unit = field(default_factory=Unit)
    data_unit: Unit = field(default_factory=Unit)   # unit used to size the patient list (fixed demand)
    buffer_cfg: DataConfig = field(default_factory=DataConfig)  # what the planner believes (robustness tests)
    pharmacy_cap: bool = False


def _schedule(day_df, sc: Scenario, B):
    if sc.rule != "mip":
        return book(day_df, sc.rule, sc.unit, buffers=B)
    u = sc.unit
    key = dict(day=int(day_df.day.iloc[0]), seed=sc.data.seed, share=sc.data.p_precleared, B=B, K=u.chairs, N=u.nurses,
               M=u.monitor_ratio, H=u.pharmacy_hoods if sc.pharmacy_cap else 0, cap=sc.pharmacy_cap,
               load=sc.data_unit.load, unfit=sc.data.p_unfit)
    h = hashlib.md5(json.dumps(key, sort_keys=True).encode()).hexdigest()[:16]
    path = os.path.join(CACHE, f"{h}.csv")
    pats = day_df[~day_df.deferred_prior_day]
    if os.path.exists(path):
        s = pd.read_csv(path, index_col=0)
        out = pats.copy()
        out["slot"] = s.slot.reindex(out.pid.values).to_numpy()
    else:
        out = book(day_df, "mip", u, buffers=B, mip_kwargs={**MIP_ARGS, "pharmacy_cap": sc.pharmacy_cap})
        os.makedirs(CACHE, exist_ok=True)
        out.set_index("pid")[["slot"]].to_csv(path)
    out["told"] = out.slot - out.cls.map(B)
    out["prio"] = out.slot
    return out


def run_day(args):
    sc, day, want_log = args
    B, _ = ready_buffers(sc.q, sc.buffer_cfg)
    d = generate_day(day, sc.data, sc.data_unit)
    booked = _schedule(d, sc, B)
    sim = simulate(booked, sc.unit, check=False)
    m = metrics(sim)
    m.update(day=day, scenario=sc.name, B_P=B["P"], B_S=B["S"])
    return m, (patient_log(sim, day) if want_log else None), sim.log if want_log else None


def run(scenarios, days=100, procs=4, want_log=False):
    jobs = [(sc, d, want_log) for sc in scenarios for d in range(days)]
    with Pool(procs) as pool:
        res = pool.map(run_day, jobs, chunksize=1)
    m = pd.DataFrame([r[0] for r in res])
    logs = [x for r in res if r[1] for x in r[1]]
    return m, logs


KEYS = ["wait_mean", "wait_p90", "wait_mean_P", "wait_mean_S", "los_mean", "overtime", "chair_util", "idle_starve",
        "idle_nurse", "idle_empty", "blocking", "q_reg", "q_doctor", "q_pharm", "q_chair", "late_vs_slot",
        "nurse_peak", "lobby_peak", "treated", "unfit", "noshow"]


def summarise(m, keys=KEYS):
    """Mean and 95% CI half-width per scenario."""
    out = []
    for name, g in m.groupby("scenario", sort=False):
        r = dict(scenario=name, days=len(g))
        for k in keys:
            x = g[k].dropna().to_numpy(float)
            r[k] = x.mean() if len(x) else np.nan
            r[k + "_ci"] = stats.t.ppf(0.975, len(x) - 1) * x.std(ddof=1) / np.sqrt(len(x)) if len(x) > 1 else np.nan
        out.append(r)
    return pd.DataFrame(out)


def paired(m, a, b, key):
    """Paired difference b - a over common days, with 95% CI."""
    x = m[m.scenario == a].set_index("day")[key]
    y = m[m.scenario == b].set_index("day")[key]
    d = (y - x).dropna()
    hw = stats.t.ppf(0.975, len(d) - 1) * d.std(ddof=1) / np.sqrt(len(d))
    return d.mean(), hw
