"""Step 1 - create the dataset.

Writes
  data/parameters.csv          every input, its distribution, source and status
  data/infusion_mix.csv        the borrowed planned-infusion histogram
  data/synthetic_patients.csv  100 patient days, every stage time pre-drawn
"""
import pandas as pd

from chemo.datagen import generate
from chemo.params import INFUSION_MIX, DataConfig, Unit, parameter_table

cfg, unit = DataConfig(), Unit()

pd.DataFrame(parameter_table()).to_csv("data/parameters.csv", index=False)
n = sum(INFUSION_MIX.values())
pd.DataFrame([dict(planned_infusion_min=d, count=c, share=round(c / n, 4)) for d, c in INFUSION_MIX.items()]) \
    .to_csv("data/infusion_mix.csv", index=False)

df = generate(cfg, unit)
cols = ["day", "pid", "cls", "planned_infusion", "actual_infusion", "arrival_dev", "registration", "blood_draw",
        "lab", "doctor", "billing", "pharmacy", "line_premed", "takedown", "discharge", "unfit", "noshow",
        "deferred_prior_day", "u_class", "u_unfit", "u_noshow"]
df[cols].round(3).to_csv("data/synthetic_patients.csv", index=False)

per_day = df.groupby("day").size()
print(f"{cfg.days} days, {len(df)} booked patients, {per_day.mean():.1f} per day (min {per_day.min()}, max {per_day.max()})")
print(df.cls.value_counts(normalize=True).round(3).to_dict())
