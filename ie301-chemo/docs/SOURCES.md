# Sources of the dataset

Every number in `chemo/params.py` carries one or more ids from this page.

**What the search found:** no public dataset has per-patient timestamps for a day-care infusion unit, on Kaggle or anywhere else. The nearest datasets are listed in section D. So the dataset is **synthetic, calibrated to published figures**, as Presentation 3 planned. Each input can be swapped once Tata Memorial data arrives.

> **Before these go on a slide, check them against the full text.** The sandbox used to build this could reach search results but not the paper pages themselves. Every figure below comes from the abstract or excerpt the search returned. The papers marked ★ are open access; reading their tables is worth a short check.

## A. Inputs used in the model

| id | Source | What we take | Used for |
|---|---|---|---|
| S1 | Team INFUCINQ, Presentations 2 & 3; TMH visit, 1 Oct 2026 | 10-step flow confirmed by TMH oncologists; stage ranges | all stage times |
| S2 | Presentation 3, slide 5 (base case) | 20 chairs, 08:00–18:00, 2 desks, 2 doctors | unit size |
| S3 | ★ Pavithran K. et al. (2025), *Reducing chemotherapy waiting times at a comprehensive cancer centre through telephonic triaging*, Int J Community Med Public Health 12(4). Amrita, Kochi; n = 1,029. [link](https://www.ijcmph.com/index.php/ijcmph/article/view/13546) | Baseline wait **3.5 h**, then 2.4 h with phone triage + pre-prepared orders, then 1.6 h with early slots for long infusions | validation target V1; pre-clearance and pre-compounding interventions |
| S4 | ★ Liang B., Turkcan A., Ceyhan M.E., Stuart K. (2015), *Improvement of chemotherapy patient flow and scheduling in an outpatient oncology clinic*, IJPR 53(24):7177–7190. [pdf](http://www1.coe.neu.edu/~aturkcan/Publications_files/Liangetal_IJPR_2014_OncologyCenterSimulation.pdf) | Treatments 30–360 min; ~45% booked at 30 min; lab patients told to come **1 h early** | infusion mix cross-check; `lpt1h`/`spt1h` baselines |
| S5 | Hesaraki A.F., Dellaert N.P., de Kok T. (2019), *Generating outpatient chemotherapy appointment templates with balanced flowtime and makespan*, EJOR 275(1):304–318. [link](https://ideas.repec.org/a/eee/ejores/v275y2019i1p304-318.html) | A nurse is fully assigned to one patient during setup and monitors several patients during infusion; integer programme with flowtime/makespan weights | nurse constraint; MIP objective |
| S6 | Athawale S. (2015), PhD thesis, University of Akron (shared by mentor) | Nurse workload peaks at setup and takedown | takedown modelled as exclusive nurse time |
| S7 | ★ Hadid M. et al. (2022), *Clustering and Stochastic Simulation Optimization for Outpatient Chemotherapy Appointment Planning and Scheduling*, IJERPH 19(23):15539. [link](https://www.mdpi.com/1660-4601/19/23/15539) | All stages random, unpunctual arrivals, baseline heuristics; full search ~13 h for 246 appointments | design of the experiments; why we tune a rule |
| S8 | Hesaraki A.F. et al. (2020), OR Spectrum 42(4). [link](https://link.springer.com/doi/10.1007/s00291-020-00596-8) | Each patient has a (known) ready time | our ready time is random |
| S9 | Tata Memorial Hospital, Hemato-pathology patient information. [link](https://tmc.gov.in/tmh/index.php/en/188-hemato-pathology/765-information-for-patients-hemato-pathology) | Hemogram (CBC) turnaround **4 h** | `LAB_TMH` scenario, Triangular(120, 180, 240) |
| S10 | ★ *Alternative Outpatient Chemotherapy Scheduling Method to Improve Patient Service Quality and Nurse Satisfaction*, J Oncol Pract / PMC6550030. [link](https://pmc.ncbi.nlm.nih.gov/articles/PMC6550030/) | One real clinic day, 55 patients: 25×30 min, 3×1 h, 10×2 h, 10×3 h, 6×4 h, 1×6 h | **infusion mix** |
| S11 | ★ *A Stochastic Programming Approach for Chemotherapy Appointment Scheduling* (Hacettepe unit), arXiv:2001.06806. [link](https://arxiv.org/pdf/2001.06806) | 204 patients; actual infusion 16–217 min, mean 112.5; MAPE 16.9%; short ones under-estimated, long ones over-estimated | actual/planned duration factor |
| S12 | ★ Cerruti et al. (2023), outpatient punctuality, BMC Health Serv Res. [link](https://bmchealthservres.biomedcentral.com/articles/10.1186/s12913-023-10379-w) | 84.4% check in early; distribution not normal | arrival deviation (sensitivity) |
| S13 | Johns Hopkins clinic, 1,500 visits (reported by FiveThirtyEight). [link](https://fivethirtyeight.com/features/dear-mona-how-often-do-people-arrive-late-to-appointments) | 90.7% early; mean 24.1 min early, 20.5 min late | arrival deviation (sensitivity) |
| S14 | Dose-banding lead-time study, Eur J Hosp Pharm (2017). [link](https://ejhp.bmj.com/content/ejhpharm/early/2017/03/04/ejhpharm-2016-001093.full.pdf) | Prescription-to-transfer **17.1 min** (pre-made) vs **26.5 min** (just in time) | pharmacy time; pre-compounding intervention |
| S15 | Robotic vs manual compounding time study, Leiden. [link](https://scholarlypublications.universiteitleiden.nl/access/item%3A4198894/view) | 6:44 min robotic, 6:48–9:48 manual per preparation | pharmacy time (lower bound) |
| S16 | University of Bath time study. [link](https://www.bath.ac.uk/announcements/university-of-bath-study-shows-how-to-radically-improve-the-delivery-of-chemotherapy-treatment/) | 39 patients booked at 150 min actually took 61–196 min | spread of the duration factor |
| S17 | *Distributionally Robust Optimization for Chemotherapy Scheduling under Asymmetric and Multi-Modal Uncertainty*, arXiv:2510.10953 (Mayo data). [link](https://arxiv.org/pdf/2510.10953) | 30-min infusions right-skewed, 360-min infusions left-skewed | shape of the duration factor |
| S18 | ClinicalTrials.gov NCT00883181. [link](https://clinicaltrials.gov/study/NCT00883181) | ~8% of cycles delayed > 3 days | P(unfit) = 0.08 |
| S19 | ★ Postponement in breast-cancer chemotherapy, PMC2360274. [link](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2360274/) | About a quarter of cycles that start below the neutrophil threshold are postponed | P(unfit) cross-check |
| S20 | ★ Faiz & Kristoffersen (2018), neurology outpatient attendance, PMC5879733. [link](https://pmc.ncbi.nlm.nih.gov/articles/PMC5879733) | 9.5% non-attendance, 5.1% late | P(no-show) upper reference |
| S21 | Kaggle *Medical Appointment No Shows* (110,527 appointments, Brazil). [link](https://www.kaggle.com/datasets/joniarroba/noshowappointments) | ~20% no-show in general outpatients | upper bound only; chemo assumed 5% |
| S22 | Oncology Nursing Society staffing review, CJON. [link](https://cjon.ons.org/pubs/article/240201/preview); SIOP LMIC baseline standards. [link](https://siop-online.org/baseline-nursing-standards/) | No ONS fixed ratio; 3–20 patients per nurse per shift seen; Cleveland Clinic target 1:6; SIOP 1:5 | N = 8 nurses for ~50 patients (≈ 6 per nurse) |

## B. Validation targets (not inputs)

| id | Source | Figure | How it is used |
|---|---|---|---|
| V1 | S3, Kochi | Mean wait **3.5 h** at baseline | Presentation 3 sanity check |
| V2 | ★ *Predictors of dissatisfaction with day care chemotherapy services*, Cancer Res Stat Treat (2023), single Indian centre. [link](https://www.ovid.com/jnls/crst/fulltext/10.4103/crst.crst_150_22~predictors-of-dissatisfaction-with-day-care-chemotherapy) | Time in unit **5 h 40 min (SD 3 h 42)**; oncologist wait 30 min; bed allotment 58.5 min; 6.8 chairs | length-of-stay check |
| V3 | Mamballikalam et al. (2024), *Process reengineering using DMAIC… daycare infusion therapy*, Int J Qual Health Care 36(1). Kerala. [link](https://academic.oup.com/intqhc/article/36/1/mzad111/7503514) | Average wait 108 min; 32% within the 1-h target, later 89% | waiting-time range for Indian units |
| V4 | Radheshyam et al. (2024), Health Science Reports, DOI 10.1002/hsr2.70224. [link](https://onlinelibrary.wiley.com/doi/full/10.1002/hsr2.70224) | Wait 75.7 → 61.8 min after lean changes | waiting-time range |
| V5 | ★ Kim et al. (2020), *Evaluating waiting time with real-world health information in a high-volume cancer center*, Medicine 99(39), PMC7523863. [link](https://pmc.ncbi.nlm.nih.gov/articles/PMC7523863/) | Registration to chemo start 92.6 ± 88.0 min (Korea) | shows the spread is wide (CV ≈ 1) |
| V6 | ESMO Asia 2023 abstract 466P. [link](https://oncologypro.esmo.org/meeting-resources/esmo-asia-congress-2023/identification-of-patient-satisfaction-predictors-among-women-attending-oncology-daycare-unit-using-validated-survey-questionnaire-pss-tool-an-i?page=13) | Median wait 3 h | waiting-time range |

## C. Read, not used for numbers

- Halder et al. (2025), *Access to timely cancer treatment initiation in India*, Lancet Reg Health SE Asia 32:100514, PMC11722993. 6,695 patients at 7 facilities; median 20 days from diagnosis to treatment. The scale is days, not minutes within a day. The only use is context: government insurance matters, which supports keeping billing and scheme approval as a separate stage.
- Dayeh et al. (2025), Lean Six Sigma in a GI day-care unit (Oman), APJCP 26(6). Share of cases outside spec fell from 60.6% to 7.3%.
- Kwong Wah Hospital (Hong Kong), lean chemotherapy flow: drug preparation 74 → 24 min.
- Chemo SmartBook, BC Cancer: 75 patients, 43 chairs, 10 nurses, 08:00–18:00. A real-world scale reference.

## D. Datasets checked (none fits; why the data is synthetic)

| Dataset | What it is | Why not used directly |
|---|---|---|
| Kaggle *Medical Appointment No Shows* (S21) | 110k general outpatient appointments, show/no-show | not infusion; no stage times |
| Kaggle *healthcare_analytics_patient_flow_data* | ~9,200 hospital encounters with arrival and wait times | not oncology |
| Kaggle *Medical Facility Operational Data* | arrival, scheduled and begin times at 4 facilities; dates altered | not oncology; one stage only |
| Kaggle *Cancer Treatment Performance Dashboard* | treatment start/end dates, cycles | no within-day flow |
| RMIT dataset, DOI 10.25439/rmt.26325706.v2 | home chemotherapy routing instances | different problem |
| Dana-Farber RTLS + EHR study | ~90 appointments/day, 25+ chairs | not public |

## Status key

- **Borrowed:** from a published study.
- **Assumed:** a team assumption from Presentation 3.
- **Placeholder:** to be replaced by TMH data.

The TMH data request on Presentation 3 slide 5 maps one-to-one onto the columns of `data/synthetic_event_log.csv`. When the hospital's data arrives, fit each stage to it, then replace the matching `Tri(...)` in `params.py`.
