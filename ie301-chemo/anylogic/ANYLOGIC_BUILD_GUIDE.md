# AnyLogic build guide: day-care chemotherapy unit

This guide builds in AnyLogic the same model as `chemo/sim.py`, block for block. It reads the same pre-drawn patient days, so the two models should agree patient for patient. That agreement is your verification of the AnyLogic build (step 9).

**Version:** AnyLogic 8.9 Personal Learning Edition (free) or newer, with the Process Modeling Library only.

> I could not open AnyLogic in the environment this was built in. Nothing below has been clicked through yet. Every setting maps to a line of the Python model, and step 9 is how you confirm the build. Report any field whose name differs in your version.

---

## 0. Files you need

| File | Use |
|---|---|
| `data/anylogic_inputs.xlsx` | sheet `arrivals`: 100 days × 5 booking rules, every stage time pre-drawn; sheet `parameters`; sheet `reference_day0` |
| `data/anylogic_reference_day0.csv` | Python's per-patient timestamps for day 0, to compare against |
| `docs/FORMULATION.md` | where `told` and `slot` come from |

## 1. New model

- **File → New → Model.** Name it `ChemoDayCare`. Set **Model time units: minutes**.
- **Simulation experiment:**
  - Model time → Stop: **at specified time**, `1500`. Time 0 is midnight, 480 is 08:00, and 1500 leaves room for overtime.
  - Randomness → **Fixed seed**. All randomness is already in the table, so this only affects tie-breaks.

## 2. Import the data

- **Projects view → Database → Import from Excel**, then pick `anylogic_inputs.xlsx` and import all three sheets.
- Check the column types: `rule`, `cls` are text; `day`, `pid`, `noshow`, `unfit`, `is_sameday` are integer; everything else is double.

## 3. Parameters on `Main`

| Name | Type | Default | Meaning |
|---|---|---|---|
| `rule` | String | `"mip"` | one of `all8`, `lpt1h`, `spt1h`, `buffer`, `mip` |
| `dayIndex` | int | `0` | 0 to 99 |
| `K` | int | `20` | chairs |
| `N` | int | `8` | nurses |
| `M` | int | `4` | patients one nurse can monitor |
| `nDesks` | int | `2` | registration desks |
| `nDoctors` | int | `2` | doctors |
| `nHoods` | int | `3` | pharmacy hoods |
| `precompound` | boolean | `false` | drugs for pre-cleared patients made before opening |

## 4. Agent type `Patient`

**New → Agent type → `Patient`**, population on `Main` named `patients`, **initially empty**.

**Parameters** (all `double` unless noted):
`pid` (int), `isSameday` (boolean), `told`, `slot`, `noshow` (boolean), `unfit` (boolean), `planned`, `actualInfusion`, `tReg`, `tBlood`, `tLab`, `tDoc`, `tBill`, `tPharm`, `tLine`, `tTakedown`, `tDischarge`.

**Variables** (double, initial `-1`): `tArrive`, `tReady`, `tSetup`, `tInfStart`, `tInfEnd`, `tTdStart`, `tChairEnd`, `tDone`.

**Animation:** drag **3D Objects → People → Patient** (or Person) into the agent's presentation.

## 5. Resource pools on `Main`

| Pool | Capacity | Notes |
|---|---|---|
| `desk` | `nDesks` | static |
| `doctor` | `nDoctors` | 3D: People → Doctor |
| `hood` | `nHoods` | static |
| `chair` | `K` | static; home location = the chair node from step 7 |
| `nurseUnit` | `N * M` | static; **one unit = 1/M of a nurse** |

`nurseUnit` is how the model gets Hesaraki's rule, *M × setups + patients on the drip ≤ M × N*:

- A **setup** or **takedown** seizes M units: one whole nurse.
- An **infusing** patient holds 1 unit.

Report nurses busy as `nurseUnit.busy() / (double) M`.

## 6. The flowchart

Connect the blocks in this order. Every delay reads its time from the patient (`agent.tReg` and so on), so the run uses exactly the drawn values.

```
enter ─► selNoShow ─┬─(noshow)──────────────────────────────────────────► sinkNoShow
                    └─► registration ─► selClass ─┬─(same-day)─► bloodLab ─► review ─► selUnfit ─┬─(unfit)─► sinkUnfit
                                                  │                                              │
                                                  └─(pre-cleared)───────────────────────────────►├─► billing ─► selPrecomp ─┬─► pharmacy ─┐
                                                                                                                         └─────────────┤
  ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
  └─► markReady ─► seizeSetup ─► setup ─► releaseSetup ─► infusion ─► seizeTakedown ─► takedown ─► releaseAll ─► discharge ─► sinkTreated
```

| Block | Library block | Settings |
|---|---|---|
| `enter` | Enter | — (patients are injected by code, step 8) |
| `selNoShow` | SelectOutput | Condition: `agent.noshow` |
| `registration` | Service | Resource pool: `desk`; Delay: `agent.tReg`; Queue capacity: maximum. On enter: `agent.tArrive = time();` |
| `selClass` | SelectOutput | Condition: `agent.isSameday` |
| `bloodLab` | Delay | Delay: `agent.tBlood + agent.tLab`; Capacity: maximum (shared hospital counter, not modelled) |
| `review` | Service | Pool: `doctor`; Delay: `agent.tDoc` |
| `selUnfit` | SelectOutput | Condition: `agent.unfit` |
| `billing` | Delay | Delay: `agent.tBill`; Capacity: maximum |
| `selPrecomp` | SelectOutput | Condition: `precompound && !agent.isSameday` (true goes straight to `markReady`) |
| `pharmacy` | Service | Pool: `hood`; Delay: `agent.tPharm` |
| `markReady` | Delay | Delay: `0`. On enter: `agent.tReady = time();` |
| `seizeSetup` | Seize | Resource sets: **one set** = `chair`, then `nurseUnit` listed **M times** (four entries). **Seize policy: whole set at once.** Queue: **priority-based**, agent priority `-agent.slot` (earlier slot first; for `all8` slot is -1 for all, so FIFO). Task priority: `0` |
| `setup` | Delay | Delay: `agent.tLine`; Capacity: maximum. On enter: `agent.tSetup = time();` |
| `releaseSetup` | Release | **Specified resources:** `nurseUnit` listed **M − 1 times** (three entries); keep 1 unit for monitoring |
| `infusion` | Delay | Delay: `agent.actualInfusion`; Capacity: maximum. On enter: `agent.tInfStart = time();` On exit: `agent.tInfEnd = time();` |
| `seizeTakedown` | Seize | Resource set: `nurseUnit` listed **M − 1 times**. Seize policy: whole set at once. **Task priority: `10`** (beats new setups). On exit: `agent.tTdStart = time();` |
| `takedown` | Delay | Delay: `agent.tTakedown`; Capacity: maximum |
| `releaseAll` | Release | All seized resources. On exit: `agent.tChairEnd = time();` |
| `discharge` | Delay | Delay: `agent.tDischarge`; Capacity: maximum |
| sinks | Sink | On enter: `agent.tDone = time(); logPatient(agent); remove_patients(agent);` |

**If your version has no "whole set at once":** the Seize may then grab nurse units one at a time while waiting, and the model can deadlock. Set `nurseUnit` to *Customize request choice* and accept a request only when `nurseUnit.idle() >= M`. Or simplest: seize `chair` alone, then a second Seize with `nurseUnit` quantity M, with no queue between them.

## 7. Space and animation

Draw on `Main`, roughly left to right, following the patient's path:

1. **Entrance:** a Point Node, plus a **Rectangular Node** `lobby` as the waiting hall (queue location for registration, billing and pharmacy).
2. **Registration counter:** 2 Point Nodes for the desks; 3D Objects → Office → Desk.
3. **Lab (off-site):** a rectangle labelled "Hospital lab"; agent location of `bloodLab`.
4. **Doctor rooms:** 2 nodes; 3D: Doctor.
5. **Billing / scheme desk:** a node.
6. **Pharmacy:** a rectangle with 3 nodes (hoods). Not visited by the patient; draw it for the dashboard.
7. **Infusion bay:** a Rectangular Node `chairs` with **20 attractors** in 4 rows of 5. Set it as the home location of the `chair` pool, and as the agent location of `setup`, `infusion` and `takedown`. 3D Objects → Hospital → *Chair* or *Bed*.
8. **Nurse station:** a node; a text above it showing `String.format("%.1f nurses busy", nurseUnit.busy()/(double)M)`.

Colour patients by state. In the Patient presentation, set the person's colour to:

```java
tInfStart >= 0 ? new Color(0x2a,0x78,0xd6) : (tReady >= 0 ? new Color(0xeb,0x68,0x34) : new Color(0x9a,0x99,0x93))
```

Blue = on the drip, orange = ready and waiting for a chair, grey = still in the front stages.

## 8. Startup code: inject the chosen day

On `Main`, add a **Dynamic Event** `ArrivalEvent` with one argument `Patient p`. Its action:

```java
enter.take(p);
```

**Main → Agent actions → On startup:**

```java
List<Tuple> rows = selectFrom(arrivals)
    .where(arrivals.rule.eq(rule))
    .where(arrivals.day.eq(dayIndex))
    .list();
for (Tuple r : rows) {
    Patient p = add_patients();
    p.pid = r.get(arrivals.pid);
    p.isSameday = r.get(arrivals.is_sameday) == 1;
    p.told = r.get(arrivals.told);
    p.slot = r.get(arrivals.slot);
    p.noshow = r.get(arrivals.noshow) == 1;
    p.unfit = r.get(arrivals.unfit) == 1;
    p.planned = r.get(arrivals.planned_infusion);
    p.actualInfusion = r.get(arrivals.actual_infusion);
    p.tReg = r.get(arrivals.registration);
    p.tBlood = r.get(arrivals.blood_draw);
    p.tLab = r.get(arrivals.lab);
    p.tDoc = r.get(arrivals.doctor);
    p.tBill = r.get(arrivals.billing);
    p.tPharm = r.get(arrivals.pharmacy);
    p.tLine = r.get(arrivals.line_premed);
    p.tTakedown = r.get(arrivals.takedown);
    p.tDischarge = r.get(arrivals.discharge);
    create_ArrivalEvent(Math.max(0, r.get(arrivals.arrive)), p);
}
```

Pre-cleared patients found unfit the day before are already absent from the table, which matches the Python model.

## 9. Outputs and the verification step

**Logging function** `logPatient(Patient a)`, which inserts a row into a new DB table `results`:

```java
insertInto(results)
  .columns(results.rule, results.day, results.pid, results.arrive, results.drug_ready,
           results.chair_start, results.infusion_start, results.chair_end, results.discharge)
  .values(rule, dayIndex, a.pid, a.tArrive, a.tReady, a.tSetup, a.tInfStart, a.tChairEnd, a.tDone)
  .execute();
```

Create the `results` table first, with those columns.

**Dashboard on `Main`:**

- **Time plots**, 1-minute sampling:
  - `chair.busy()` (chairs in use)
  - `nurseUnit.busy()/(double)M` (nurses busy)
  - `seizeSetup.size()` (ready patients waiting for a chair)
- **Histogram** of `tInfStart - tArrive` over treated patients: the wait to drip.
- **KPI text:**
  - mean wait
  - 90th percentile
  - overtime = `max(0, last tChairEnd − 1080)`
  - chair use = `chair.utilization()` over 480–1080 (use a Statistics object started at 480)

**Verification.** Run `rule = "mip"`, `dayIndex = 0`. Export `results` and compare with `reference_day0.csv`, filtered to `rule == mip`.

- **Arrival, drug-ready and discharge times** for patients who never queue for a resource should match to the minute. They are sums of the same numbers.
- **Chair start times** can differ only where two patients become ready at the same instant. AnyLogic may break that tie differently.
- **Mean wait over the day** should be within about 1 minute of Python's.

If they differ, check four settings first:

1. The seize policy.
2. Task priorities: takedown 10, setup 0.
3. Whether `releaseSetup` releases M − 1 units.
4. The queue priority sign.

## 10. Experiments

**Parameter Variation**, replications 1 (each day is already a random sample):

- `dayIndex`: 0 to 99, step 1
- `rule`: freeform list `all8, lpt1h, spt1h, buffer, mip`

This reproduces E1 of `05_experiments.py`. Collect `results` and compare the mean waits to `results/E1_rules_summary.csv`.

For E5-style what-ifs, vary `N`, `K`, `nHoods`, `nDoctors`, `nDesks` and `precompound`.

**One limit:** the MIP schedule for `rule = mip` was optimised for the base K and N. If you change K or N, re-export from Python first. The `buffer`, `lpt1h` and `spt1h` schedules were also built for the base unit.

## 11. Swapping in real TMH data later

Fit each stage to the hospital's timestamps and update `chemo/params.py`. Then rerun `01_generate_data.py`, `05_experiments.py` and `07_export_anylogic.py`, and re-import the workbook. The AnyLogic model itself does not change.
