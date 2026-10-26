# Simulation verification and validation

| kind         | check                                                          | result   | detail                                                                                                           |
|:-------------|:---------------------------------------------------------------|:---------|:-----------------------------------------------------------------------------------------------------------------|
| verification | hand calculation, class S                                      | PASS     | infusion starts 700.0 (hand 700.0), leaves 852.5 (hand 852.5)                                                    |
| verification | hand calculation, class P                                      | PASS     | infusion starts 587.5 (hand 587.5), leaves 740.0 (hand 740.0)                                                    |
| verification | capacity never exceeded                                        | PASS     | 0 log entries outside 0..K chairs or 0..M*N nurse units (80 days)                                                |
| verification | patients conserved                                             | PASS     | booked = treated + unfit + no-show on every day                                                                  |
| verification | timestamps in order                                            | PASS     | 0 treated patients with a time going backwards                                                                   |
| verification | Little's law (lobby)                                           | PASS     | time-integral of patients waiting = sum of their waits (max diff 3.64e-12)                                       |
| verification | chair-minutes balance                                          | PASS     | time-integral of busy chairs = sum of chair stays (max diff 1.82e-12)                                            |
| verification | Hesaraki nurse constraint (N=2)                                | PASS     | max M*setups + drips = 8 <= M*N = 8                                                                              |
| verification | infinite capacity reproduces slide 7                           | PASS     | 80th pct ready delay: P 90.2 (89.9), S 206.4 (206.2); n = 10010, 10010                                           |
| verification | same input, same output                                        | PASS     | two runs of day 5 identical                                                                                      |
| validation   | Kochi wait 3.5 h (V1), all told 08:00                          | ABOVE    | 0% pre-cleared: mean wait to drip 6.28 h (registration queue 90 min, doctor queue 56 min); no-queue floor 3.67 h |
| validation   | time in unit 5 h 40 (V2), all told 08:00                       | ABOVE    | mean time in unit 8.66 h (V2 SD 3 h 42, so the band is wide)                                                     |
| validation   | Kochi wait 3.5 h (V1), appointments, told 1 h early (Liang)    | MATCH    | 0% pre-cleared: mean wait to drip 4.11 h (registration queue 10 min, doctor queue 12 min); no-queue floor 3.67 h |
| validation   | time in unit 5 h 40 (V2), appointments, told 1 h early (Liang) | MATCH    | mean time in unit 6.47 h (V2 SD 3 h 42, so the band is wide)                                                     |
| validation   | morning starvation (slide 11: 35%)                             | MATCH    | 30% pre-cleared, all told 08:00: chair-hours lost to 'patient here, not ready' = 37%                             |
