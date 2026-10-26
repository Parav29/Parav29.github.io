"""Step 7 - export everything AnyLogic needs into data/anylogic_inputs.xlsx.

Sheets
  arrivals        one row per (rule, day, patient): told time, chair slot, actual
                  arrival, every pre-drawn stage time. AnyLogic reads this table,
                  so it plays out exactly the same days as the Python model.
  parameters      unit settings
  reference_day0  Python's per-patient timestamps for day 0 under every rule:
                  the AnyLogic build is right when it reproduces these
Also writes data/synthetic_event_log.csv: the simulated timestamps of every
patient, 100 days x 5 rules, in the schema requested from TMH.
Run after 05_experiments.py (it reuses the cached MIP schedules).
"""
from dataclasses import asdict

import pandas as pd

from chemo.booking import ready_buffers
from chemo.datagen import generate_day
from chemo.params import DataConfig, Unit
from chemo.runner import Scenario, _schedule
from chemo.sim import patient_log, simulate

DAYS = 100
RULES = ["all8", "lpt1h", "spt1h", "buffer", "mip"]
cfg, unit = DataConfig(), Unit()
B, _ = ready_buffers(0.8)

rows, ref, log = [], [], []
for day in range(DAYS):
    d = generate_day(day, cfg, unit)
    for rule in RULES:
        b = _schedule(d, Scenario(rule, rule), B)
        out = b.assign(rule=rule, arrive=b.told + b.arrival_dev,
                       slot=b.slot.fillna(-1), priority=-b.slot.fillna(0))
        rows.append(out)
        day_log = [dict(r, rule=rule) for r in patient_log(simulate(b, unit), day)]
        log += day_log
        if day == 0:
            ref += day_log

cols = ["rule", "day", "pid", "cls", "told", "slot", "priority", "arrive", "noshow", "unfit", "planned_infusion",
        "actual_infusion", "arrival_dev", "registration", "blood_draw", "lab", "doctor", "billing", "pharmacy",
        "line_premed", "takedown", "discharge"]
arr = pd.concat(rows, ignore_index=True)[cols]
arr["noshow"] = arr.noshow.astype(int)
arr["unfit"] = arr.unfit.astype(int)
arr["is_sameday"] = (arr.cls == "S").astype(int)
arr = arr.round(3)

params = pd.DataFrame([dict(name=k, value=v) for k, v in asdict(unit).items()] +
                      [dict(name="nurse_units", value=unit.nurse_units), dict(name="buffer_P", value=B["P"]),
                       dict(name="buffer_S", value=B["S"])])
reference = pd.DataFrame(ref).round(2)

with pd.ExcelWriter("data/anylogic_inputs.xlsx") as xw:
    arr.to_excel(xw, sheet_name="arrivals", index=False)
    params.to_excel(xw, sheet_name="parameters", index=False)
    reference.to_excel(xw, sheet_name="reference_day0", index=False)
reference.to_csv("data/anylogic_reference_day0.csv", index=False)
# synthetic event log in the TMH request schema (Presentation 3 slide 5), clock times in minutes after midnight
pd.DataFrame(log).round(2).to_csv("data/synthetic_event_log.csv", index=False)
print(f"arrivals: {len(arr)} rows ({DAYS} days x {len(RULES)} rules); reference_day0: {len(reference)} rows")
