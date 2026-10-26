"""Synthetic patient days.

Draw the patient list, then every stage time for every patient. Each day has
its own seed, so every booking rule is tested on identical days (common random
numbers). Every patient gets all draws, whatever the class: the class is set by
comparing one stored uniform with the pre-cleared share, so changing the share
changes classes and nothing else.
"""
import numpy as np
import pandas as pd

from .params import DURATION_FACTOR, INFUSION_MIX, DataConfig, Unit, planned_chair_time


def _tri(rng, t, n=None):
    return rng.triangular(t.low, t.mode, t.high, n)


def duration_band(planned):
    return "short" if planned <= 60 else ("long" if planned >= 240 else "mid")


def generate_day(day, cfg: DataConfig, unit: Unit = Unit()):
    rng = np.random.default_rng([cfg.seed, day])
    lengths = np.array(list(INFUSION_MIX))
    probs = np.array(list(INFUSION_MIX.values()), float)
    probs /= probs.sum()
    target = unit.load * unit.chairs * (unit.close - unit.open)

    rows, booked = [], 0.0
    while booked < target:
        planned = int(rng.choice(lengths, p=probs))
        f = DURATION_FACTOR[duration_band(planned)]
        r = dict(day=day, pid=len(rows), planned_infusion=planned,
                 actual_infusion=planned * _tri(rng, f),
                 u_class=rng.random(), u_unfit=rng.random(), u_noshow=rng.random())
        for s in ["arrival_dev", "registration", "blood_draw", "lab", "doctor",
                  "billing", "pharmacy", "line_premed", "takedown", "discharge"]:
            r[s] = _tri(rng, cfg.stage(s))
        rows.append(r)
        booked += planned_chair_time(planned)
    df = pd.DataFrame(rows)
    return apply_classes(df, cfg)


def apply_classes(df, cfg: DataConfig):
    df = df.copy()
    df["cls"] = np.where(df.u_class < cfg.p_precleared, "P", "S")
    df["unfit"] = df.u_unfit < cfg.p_unfit
    df["noshow"] = df.u_noshow < cfg.p_noshow
    # A pre-cleared patient found unfit on the phone the day before never
    # enters the day: the slot is released a day early.
    df["deferred_prior_day"] = (df.cls == "P") & df.unfit
    return df


def generate(cfg: DataConfig = DataConfig(), unit: Unit = Unit()):
    return pd.concat([generate_day(d, cfg, unit) for d in range(cfg.days)], ignore_index=True)
