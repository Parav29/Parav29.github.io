# Optimisation verification

| check                                                      | result   | detail                                                                     |
|:-----------------------------------------------------------|:---------|:---------------------------------------------------------------------------|
| MIP schedules satisfy every constraint (independent check) | PASS     | 20/20 days: one slot each, s_i >= release, chairs <= 20, nurse units <= 32 |
| MIP objective <= greedy objective                          | PASS     | 20/20 days; greedy is 48.3% worse on average (max 70.0%)                   |
| planned overtime, MIP vs greedy                            | PASS     | mean planned overtime 11 min (MIP) vs 76 min (greedy)                      |
| solve time                                                 | PASS     | mean 7.1 s, max 15.6 s per day (limit 15 s, gap 1%)                        |
| MIP optimum = brute force (6 random 4-patient instances)   | PASS     | 6/6 match exactly (2 chairs, 2 nurses, M = 4, mixed releases)              |
