# IE301 · Team INFUCINQ · Day-care chemotherapy unit

Dataset, simulation, optimisation and results for Topic 1, continuing from Presentation 3. Everything reruns from the scripts, and every number traces to a source or a stated assumption.

## The five deliverables

| # | Deliverable | Where | Verified by |
|---|---|---|---|
| 1 | **Dataset** (synthetic, calibrated) | `data/synthetic_patients.csv`, `data/parameters.csv`, `data/infusion_mix.csv` | `02_verify_data.py` → `results/verify_data.md` (23/23 pass) |
| 2 | **Sources of the dataset** | `docs/SOURCES.md` (22 inputs, 6 validation targets, datasets checked) | — |
| 3 | **Simulation** (Python, SimPy) | `chemo/sim.py` | `03_verify_sim.py` → `results/verify_sim.md` (10/10 pass + validation) |
| 4 | **AnyLogic simulation** | `anylogic/ANYLOGIC_BUILD_GUIDE.md` + `data/anylogic_inputs.xlsx` | step 9 of the guide: match `data/anylogic_reference_day0.csv` |
| 5 | **Optimisation formulation** | `docs/FORMULATION.md`, `chemo/mip.py` | `04_verify_mip.py` → `results/verify_mip.md` (5/5 pass) |
| — | **Results, bottlenecks, fixes** | `REPORT.html`, `results/*.csv`, `results/figures/` | 100 seeded days per scenario, 95% CIs |

## Run it

```bash
pip install -r requirements.txt
python 01_generate_data.py     # dataset
python 02_verify_data.py       # data checks
python 03_verify_sim.py        # simulation checks + validation vs Indian studies
python 04_verify_mip.py        # optimisation checks (about 3 min)
python 05_experiments.py       # E1-E6 (about 1.5 h on 4 cores; MIP schedules are cached)
python 06_figures.py           # figures
python 07_export_anylogic.py   # AnyLogic workbook
```

## Layout

```
chemo/params.py     every input with its source id and status   <- change numbers here
chemo/datagen.py    synthetic patient days (seeded, common random numbers)
chemo/booking.py    booking rules: all8, lpt1h, spt1h, buffer (greedy); buffer B_c = F_c^-1(q)
chemo/mip.py        time-indexed integer programme (Hesaraki 2019 + random ready time)
chemo/sim.py        discrete-event simulation of the 10-step flow
chemo/runner.py     parallel scenarios, MIP cache, confidence intervals
```

## Replacing the synthetic data with Tata Memorial data

The event log `data/synthetic_event_log.csv` (written by `07_export_anylogic.py`) has the same columns as the data request on Presentation 3 slide 5. When the real log arrives:

1. Fit each stage, then edit `chemo/params.py`.
2. Rerun steps 1–7.
