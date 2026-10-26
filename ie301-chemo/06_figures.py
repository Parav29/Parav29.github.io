"""Step 6 - figures for the report and slides (results/figures/*.png)."""
from dataclasses import replace

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from chemo.booking import ready_buffers
from chemo.datagen import generate_day
from chemo.params import DataConfig, Unit
from chemo.runner import Scenario, _schedule
from chemo.sim import simulate

S = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"]   # fixed slot order
INK, INK2, GRID, SURF = "#0b0b0b", "#52514e", "#e4e3df", "#fcfcfb"
plt.rcParams.update({"figure.facecolor": SURF, "axes.facecolor": SURF, "axes.edgecolor": GRID, "axes.labelcolor": INK2,
                     "xtick.color": INK2, "ytick.color": INK2, "text.color": INK, "font.size": 10,
                     "axes.spines.top": False, "axes.spines.right": False, "axes.grid": True, "grid.color": GRID,
                     "grid.linewidth": 0.6, "axes.axisbelow": True, "axes.titlesize": 11, "axes.titleweight": "bold",
                     "axes.titlelocation": "left", "legend.frameon": False, "savefig.dpi": 160,
                     "savefig.bbox": "tight"})
OUT = "results/figures/"


def hbar(ax, labels, vals, ci, color, unit, highlight=None):
    y = np.arange(len(labels))[::-1]
    cols = [color if highlight is None or i == highlight else "#b9b8b2" for i in range(len(labels))]
    ax.barh(y, vals, xerr=ci, color=cols, height=0.6, error_kw=dict(ecolor=INK2, lw=1, capsize=3))
    ax.set_yticks(y, labels)
    ax.grid(axis="y", visible=False)
    for yi, v in zip(y, vals):
        ax.text(v, yi + 0.36, f"{v:.0f} {unit}", color=INK, fontsize=9, va="bottom", ha="right")


def fig_e1():
    s = pd.read_csv("results/E1_rules_summary.csv")
    fig, axs = plt.subplots(1, 2, figsize=(11, 3.6), sharey=True)
    hbar(axs[0], s.scenario, s.wait_mean, s.wait_mean_ci, S[0], "min", highlight=4)
    axs[0].set_title("Mean wait, arrival to drip (min)")
    hbar(axs[1], s.scenario, s.overtime, s.overtime_ci, S[1], "min", highlight=4)
    axs[1].set_title("Overtime past 18:00 (min)")
    fig.suptitle("E1  Booking rules on 100 identical days (30% pre-cleared; bars = 95% CI)", x=0.01, y=1.06, ha="left",
                 fontsize=12, fontweight="bold")
    fig.savefig(OUT + "E1_rules.png")


def fig_e2():
    s = pd.read_csv("results/E2_buffer_summary.csv")
    q = s.scenario.str.replace("q=", "").astype(float)
    fig, axs = plt.subplots(1, 3, figsize=(12, 3.3))
    for ax, k, c, t in [(axs[0], "wait_mean", S[0], "Mean wait (min)"), (axs[1], "overtime", S[1], "Overtime (min)"),
                        (axs[2], "late_vs_slot", S[2], "Patient late for own slot (min)")]:
        ax.errorbar(q, s[k], yerr=s.get(k + "_ci"), color=c, lw=2, marker="o", ms=8, capsize=3)
        ax.set_title(t)
        ax.set_xlabel("buffer covers this share of patients (q)")
        ax.set_xticks(q)
    fig.suptitle("E2  How big should the buffer be?", x=0.01, y=1.06, ha="left", fontsize=12, fontweight="bold")
    fig.savefig(OUT + "E2_buffer.png")


def fig_e3():
    s = pd.read_csv("results/E3_preclear_summary.csv")
    s["rule"] = s.scenario.str.split(" | ", regex=False).str[0]
    s["share"] = s.scenario.str.split(" | ", regex=False).str[1].str.rstrip("%").astype(float)
    fig, axs = plt.subplots(1, 3, figsize=(12, 3.4))
    for ax, k, t in [(axs[0], "wait_mean", "Mean wait (min)"), (axs[1], "overtime", "Overtime (min)"),
                     (axs[2], "idle_starve", "Chair-minutes idle: patient here, not ready")]:
        for i, (r, lab) in enumerate([("all8", "Everyone at 08:00"), ("mip", "Two times, MIP")]):
            g = s[s.rule == r]
            ax.errorbar(g.share, g[k], yerr=g[k + "_ci"], color=S[i], lw=2, marker="o", ms=7, capsize=3, label=lab)
        ax.set_title(t)
        ax.set_xlabel("patients pre-cleared the day before (%)")
        ax.set_ylim(bottom=0)
    axs[0].legend(loc="lower left")
    fig.suptitle("E3  How much pre-clearance is enough?", x=0.01, y=1.06, ha="left", fontsize=12, fontweight="bold")
    fig.savefig(OUT + "E3_preclear.png")


def fig_e4():
    s = pd.read_csv("results/E4_robust_summary.csv")
    s["rule"] = s.scenario.str.split(" | ", regex=False).str[0]
    s["case"] = s.scenario.str.split(" | ", regex=False).str[1]
    cases = list(dict.fromkeys(s.case))
    fig, axs = plt.subplots(1, 2, figsize=(12, 3.8))
    y = np.arange(len(cases))[::-1]
    for ax, k, t in [(axs[0], "wait_mean", "Mean wait (min)"), (axs[1], "overtime", "Overtime (min)")]:
        for i, (r, lab) in enumerate([("all8", "Everyone at 08:00"), ("mip", "Two times, MIP")]):
            g = s[s.rule == r].set_index("case").loc[cases]
            ax.barh(y + (0.2 if i == 0 else -0.2), g[k], height=0.36, color=S[i], label=lab,
                    xerr=g[k + "_ci"], error_kw=dict(ecolor=INK2, lw=1, capsize=2))
        ax.set_yticks(y, cases)
        ax.grid(axis="y", visible=False)
        ax.set_title(t)
    axs[0].legend(loc="lower right")
    fig.suptitle("E4  Inputs wrong? The plan was made with the base inputs; reality differs",
                 x=0.01, y=1.06, ha="left", fontsize=12, fontweight="bold")
    fig.savefig(OUT + "E4_robust.png")


def fig_bottleneck():
    s = pd.read_csv("results/E1_rules_summary.csv")
    fig, axs = plt.subplots(1, 2, figsize=(12, 3.6), gridspec_kw=dict(width_ratios=[1.2, 1]))
    ax = axs[0]
    y = np.arange(len(s))[::-1]
    left = np.zeros(len(s))
    for (k, lab), c in zip([("idle_starve", "patient here, not ready yet"), ("idle_nurse", "patient ready, no nurse free"),
                            ("idle_empty", "nobody to treat")], [S[1], S[0], "#b9b8b2"]):
        ax.barh(y, s[k] / 60, left=left, color=c, height=0.6, label=lab, edgecolor=SURF, linewidth=2)
        left += s[k] / 60
    ax.set_yticks(y, s.scenario)
    ax.grid(axis="y", visible=False)
    ax.set_xlabel("idle chair-hours between 08:00 and 18:00 (of 200)")
    ax.set_title("Why are chairs idle?")
    ax.legend(loc="upper center", bbox_to_anchor=(0.5, -0.2), ncol=3, fontsize=8)
    ax = axs[1]
    qs = [("q_reg", "registration"), ("q_doctor", "doctor review"), ("q_pharm", "pharmacy"), ("q_chair", "chair + nurse")]
    w = 0.18
    for j, (k, lab) in enumerate(qs):
        ax.barh(y + (1.5 - j) * w, s[k], height=w, color=S[j], label=lab)
    ax.set_yticks(y, [""] * len(s))
    ax.grid(axis="y", visible=False)
    ax.set_xlabel("mean queue time per patient (min)")
    ax.set_title("Where do patients queue?")
    ax.legend(loc="upper center", bbox_to_anchor=(0.5, -0.2), ncol=4, fontsize=8)
    fig.suptitle("Bottlenecks  (E1, mean of 100 days)", x=0.01, y=1.06, ha="left", fontsize=12, fontweight="bold")
    fig.savefig(OUT + "bottlenecks.png")


def fig_e5():
    s = pd.read_csv("results/E5_fixes_summary.csv")
    base = s.iloc[0]
    fig, axs = plt.subplots(1, 2, figsize=(12, 4.6), sharey=True)
    for ax, k, c, t in [(axs[0], "overtime", S[1], "Overtime (min)"), (axs[1], "wait_p90", S[0], "90th-percentile wait (min)")]:
        hbar(ax, s.scenario, s[k], s[k + "_ci"], c, "min")
        ax.axvline(base[k], color=INK2, lw=1, ls="--")
        ax.set_title(t)
    fig.suptitle("E5  Which fix buys the most?  (dashed line = base case)", x=0.01, y=1.06, ha="left", fontsize=12,
                 fontweight="bold")
    fig.savefig(OUT + "E5_fixes.png")


def fig_e6():
    s = pd.read_csv("results/E6_capacity_summary.csv")
    s["K"] = s.scenario.str.extract(r"K=(\d+)").astype(int)
    s["N"] = s.scenario.str.extract(r"N=(\d+)").astype(int)
    fig, axs = plt.subplots(1, 2, figsize=(11, 3.4))
    for ax, k, t in [(axs[0], "overtime", "Overtime (min)"), (axs[1], "wait_p90", "90th-percentile wait (min)")]:
        for i, K in enumerate(sorted(s.K.unique())):
            g = s[s.K == K].sort_values("N")
            ax.errorbar(g.N, g[k], yerr=g[k + "_ci"], color=S[i], lw=2, marker="o", ms=7, capsize=3, label=f"{K} chairs")
        ax.set_xlabel("nurses")
        ax.set_xticks(sorted(s.N.unique()))
        ax.set_title(t)
        ax.set_ylim(bottom=0)
    axs[0].legend()
    fig.suptitle("E6  Capacity: chairs x nurses (MIP schedules, 40 days each)", x=0.01, y=1.06, ha="left", fontsize=12,
                 fontweight="bold")
    fig.savefig(OUT + "E6_capacity.png")


def fig_day_curves(day=0):
    B, _ = ready_buffers(0.8)
    unit = Unit()
    d = generate_day(day, DataConfig(), unit)
    fig, axs = plt.subplots(1, 3, figsize=(13, 3.3), sharex=True)
    for i, (rule, lab) in enumerate([("all8", "Everyone at 08:00"), ("mip", "Two times, MIP")]):
        log = np.array(simulate(_schedule(d, Scenario(rule, rule), B), unit).log)
        t = log[:, 0] / 60
        for ax, col, scale in [(axs[0], 1, 1), (axs[1], 2, 1 / unit.monitor_ratio), (axs[2], 3, 1)]:
            ax.step(t, log[:, col] * scale, where="post", color=S[i], lw=2, label=lab)
    axs[0].axhline(unit.chairs, color=INK2, ls="--", lw=1)
    axs[1].axhline(unit.nurses, color=INK2, ls="--", lw=1)
    for ax, ttl in zip(axs, ["Chairs in use (limit 20)", "Nurses busy (limit 8)", "Ready, waiting for chair + nurse"]):
        ax.set_title(ttl)
        ax.set_xlim(7.5, 21)
        ax.set_xticks(range(8, 22, 2), [f"{h:02d}:00" for h in range(8, 22, 2)])
        ax.axvspan(18, 21, color=GRID, alpha=0.5, lw=0)
    axs[0].legend(loc="upper left", fontsize=8)
    fig.suptitle(f"One simulated day (day {day}): load through the day", x=0.01, y=1.06, ha="left", fontsize=12,
                 fontweight="bold")
    fig.savefig(OUT + "day_curves.png")


def fig_gantt(day=0):
    B, _ = ready_buffers(0.8)
    unit = Unit()
    d = generate_day(day, DataConfig(), unit)
    b = _schedule(d, Scenario("mip", "mip"), B).sort_values(["slot", "planned_infusion"])
    fig, ax = plt.subplots(figsize=(11, 6.5))
    for k, (_, r) in enumerate(b.iterrows()):
        c = S[0] if r.cls == "P" else S[1]
        ax.plot([r.told / 60, r.slot / 60], [k, k], color=c, lw=1, ls=":")
        ax.barh(k, (30 + r.planned_infusion + 15) / 60, left=r.slot / 60, color=c, height=0.7)
    ax.axvline(18, color=INK2, lw=1, ls="--")
    ax.set_yticks([])
    ax.set_xticks(range(8, 21), [f"{h:02d}:00" for h in range(8, 21)])
    ax.set_xlabel("dotted = told arrival to chair slot (buffer);  bar = chair time")
    ax.plot([], [], color=S[0], lw=6, label=f"pre-cleared (buffer {B['P']} min)")
    ax.plot([], [], color=S[1], lw=6, label=f"same-day (buffer {B['S']} min)")
    ax.legend(loc="lower right")
    ax.grid(axis="y", visible=False)
    ax.set_title(f"MIP schedule for day {day}: two times per patient")
    fig.savefig(OUT + "mip_gantt.png")


if __name__ == "__main__":
    import os
    import sys
    want = sys.argv[1:]
    for name, f, need in [("E1", fig_e1, "E1_rules"), ("E2", fig_e2, "E2_buffer"), ("E3", fig_e3, "E3_preclear"),
                          ("E4", fig_e4, "E4_robust"), ("BN", fig_bottleneck, "E1_rules"), ("E5", fig_e5, "E5_fixes"),
                          ("E6", fig_e6, "E6_capacity"), ("DAY", fig_day_curves, None), ("GANTT", fig_gantt, None)]:
        if (not want or name in want) and (need is None or os.path.exists(f"results/{need}_summary.csv")):
            f()
            print("wrote", name)
