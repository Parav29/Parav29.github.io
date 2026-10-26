"""Step 5 - run the experiments of Presentation 3 slide 10, plus bottleneck and capacity studies.

E1 does the rule beat simple practice?       all8 / lpt1h / spt1h / buffer (greedy) / mip
E2 how big should the buffer be?             q = 0.50, 0.65, 0.80, 0.95
E3 how much pre-clearance is enough?         share 0..100%, all8 vs mip
E4 does it survive wrong inputs?             spreads x0.5 / x2, lateness x0.5 / x2, TMH lab
E5 bottlenecks: which fix buys the most?     +nurses, +chairs, +hood, +doctor, +desk, pre-compounding, pharmacy cap
E6 capacity (Presentation 1 problem):        chairs x nurses grid, cost subject to a P90-wait limit

Every scenario runs on the same seeded days. Results land in results/*.csv.
Usage: python 05_experiments.py [E1 E2 ...]   (default: all)
"""
import sys
import time
from dataclasses import replace

import pandas as pd

from chemo.params import DataConfig, Unit
from chemo.runner import Scenario, run, summarise

DAYS = 100
base_d, base_u = DataConfig(), Unit()
todo = sys.argv[1:] or ["E1", "E2", "E3", "E4", "E5", "E6"]


def go(tag, scenarios, days=DAYS):
    t = time.time()
    m, _ = run(scenarios, days)
    m.to_csv(f"results/{tag}_days.csv", index=False)
    s = summarise(m)
    s.to_csv(f"results/{tag}_summary.csv", index=False)
    print(f"\n== {tag} ({time.time() - t:.0f} s)")
    print(s[["scenario", "wait_mean", "wait_mean_ci", "wait_p90", "overtime", "overtime_ci", "chair_util",
             "idle_starve", "q_chair", "late_vs_slot"]].round(1).to_string(index=False))
    return m


if "E1" in todo:
    go("E1_rules", [Scenario("Everyone at 08:00", "all8"), Scenario("Longest first, told 1 h early", "lpt1h"),
                    Scenario("Shortest first, told 1 h early", "spt1h"), Scenario("Two times, greedy", "buffer"),
                    Scenario("Two times, MIP", "mip")])

if "E2" in todo:
    go("E2_buffer", [Scenario(f"q={q:.2f}", "mip", q=q) for q in [0.5, 0.65, 0.8, 0.95]])

if "E3" in todo:
    sc = []
    for s in [0.0, 0.2, 0.4, 0.6, 0.8, 1.0]:
        d = replace(base_d, p_precleared=s)
        sc += [Scenario(f"all8 | {s:.0%}", "all8", data=d), Scenario(f"mip | {s:.0%}", "mip", data=d)]
    go("E3_preclear", sc)

if "E4" in todo:
    sc = []
    for label, d in [("as planned", base_d), ("stage spread x0.5", replace(base_d, stage_spread=0.5)),
                     ("stage spread x2", replace(base_d, stage_spread=2.0)),
                     ("lateness x0.5", replace(base_d, lateness_spread=0.5)),
                     ("lateness x2", replace(base_d, lateness_spread=2.0)),
                     ("lab like TMH (2-4 h)", replace(base_d, lab_tmh=True))]:
        # the planner keeps believing the base inputs: buffer_cfg stays DataConfig()
        sc += [Scenario(f"all8 | {label}", "all8", data=d), Scenario(f"mip | {label}", "mip", data=d)]
    go("E4_robust", sc)

if "E5" in todo:
    go("E5_fixes", [
        Scenario("base (MIP, 30% pre-cleared)"),
        Scenario("+2 nurses", unit=replace(base_u, nurses=10)),
        Scenario("+4 chairs", unit=replace(base_u, chairs=24)),
        Scenario("+1 pharmacy hood", unit=replace(base_u, pharmacy_hoods=4)),
        Scenario("+1 doctor", unit=replace(base_u, doctors=3)),
        Scenario("+1 registration desk", unit=replace(base_u, registration_desks=3)),
        Scenario("pre-compound for pre-cleared", unit=replace(base_u, precompound_precleared=True)),
        Scenario("pharmacy smoothing cap in MIP", pharmacy_cap=True),
        Scenario("pre-clear 60%", data=replace(base_d, p_precleared=0.6)),
        Scenario("pre-clear 60% + pre-compound", data=replace(base_d, p_precleared=0.6),
                 unit=replace(base_u, precompound_precleared=True)),
        Scenario("Presentation 3 load (80%)", data_unit=replace(base_u, load=0.8)),
        Scenario("80% load, pre-clear 60%, +2 nurses", data=replace(base_d, p_precleared=0.6),
                 data_unit=replace(base_u, load=0.8), unit=replace(base_u, nurses=10)),
    ])

if "E6" in todo:
    sc = [Scenario(f"K={k} N={n}", unit=replace(base_u, chairs=k, nurses=n))
          for k in [16, 20, 24] for n in [6, 8, 10, 12]]
    go("E6_capacity", sc, days=40)
