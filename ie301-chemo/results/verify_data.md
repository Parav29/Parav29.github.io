# Data verification

5007 booked patients over 100 days. 23/23 checks pass.

| check                                         | result   | detail                                                                                                                  |
|:----------------------------------------------|:---------|:------------------------------------------------------------------------------------------------------------------------|
| stage arrival_dev                             | PASS     | mean 0.06 vs 0.00 (z=+0.33); range [-29.0, 29.7] in [-30, 30]; KS p=0.454                                               |
| stage registration                            | PASS     | mean 9.97 vs 10.00 (z=-1.03); range [5.0, 14.9] in [5, 15]; KS p=0.340                                                  |
| stage blood_draw                              | PASS     | mean 7.52 vs 7.50 (z=+1.52); range [5.0, 10.0] in [5, 10]; KS p=0.362                                                   |
| stage lab                                     | PASS     | mean 90.06 vs 90.00 (z=+0.37); range [60.2, 119.1] in [60, 120]; KS p=0.337                                             |
| stage doctor                                  | PASS     | mean 15.05 vs 15.00 (z=+1.66); range [10.1, 20.0] in [10, 20]; KS p=0.093                                               |
| stage billing                                 | PASS     | mean 44.89 vs 45.00 (z=-1.27); range [30.3, 59.5] in [30, 60]; KS p=0.594                                               |
| stage pharmacy                                | PASS     | mean 22.51 vs 22.50 (z=+0.33); range [15.1, 29.9] in [15, 30]; KS p=0.657                                               |
| stage line_premed                             | PASS     | mean 29.98 vs 30.00 (z=-0.33); range [20.3, 39.6] in [20, 40]; KS p=0.908                                               |
| stage takedown                                | PASS     | mean 10.03 vs 10.00 (z=+0.88); range [5.1, 14.9] in [5, 15]; KS p=0.854                                                 |
| stage discharge                               | PASS     | mean 22.49 vs 22.50 (z=-0.24); range [15.3, 29.7] in [15, 30]; KS p=0.924                                               |
| infusion mix                                  | PASS     | shares 30:0.449/0.455, 60:0.053/0.055, 120:0.179/0.182, 180:0.185/0.182, 240:0.117/0.109, 360:0.017/0.018; chi2 p=0.489 |
| infusion error direction                      | PASS     | mean actual/planned: short 1.169, mid 1.015, long 0.939                                                                 |
| infusion error size                           | PASS     | MAPE 10.3% (Hacettepe S11: 16.9%)                                                                                       |
| infusion range                                | PASS     | actual 27-385 min (planned 30-360)                                                                                      |
| P(unfit)                                      | PASS     | 0.0767 (target 0.08); 99.9% CI [0.0649, 0.0898]                                                                         |
| P(noshow)                                     | PASS     | 0.0537 (target 0.05); 99.9% CI [0.0438, 0.0650]                                                                         |
| P(pre-cleared)                                | PASS     | 0.2824 (target 0.3)                                                                                                     |
| deferred_prior_day only for pre-cleared unfit | PASS     | consistent                                                                                                              |
| daily booked chair-minutes                    | PASS     | 7200-7590 vs target 7200 (60% of 20 chairs x 10 h)                                                                      |
| reproducible (same seed, same data)           | PASS     | md5 044a890777c9                                                                                                        |
| CRN across pre-cleared share                  | PASS     | only cls changes when the share goes 0.3 -> 0.9                                                                         |
| Presentation 3 buffers                        | PASS     | q=0.8: pre-cleared 89.8 min (slide: 89.9), same-day 206.2 min (slide: 206.2)                                            |
| same-day no-queue wait vs Kochi (V1)          | PASS     | arrival-to-drip with zero queues = 220 min (3.67 h); Kochi baseline 210 min (3.5 h)                                     |
