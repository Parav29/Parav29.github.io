"""Step 2 - verify the dataset. Writes results/verify_data.md; exits 1 on any failure."""
import hashlib
import sys

import numpy as np
import pandas as pd
from scipy import stats

from chemo.booking import ready_buffers
from chemo.datagen import generate, generate_day
from chemo.params import (DURATION_FACTOR, INFUSION_MIX, P_NOSHOW, P_PRECLEARED, P_UNFIT, STAGES, DataConfig, Unit,
                          planned_chair_time)

df = pd.read_csv("data/synthetic_patients.csv")
cfg, unit = DataConfig(), Unit()
rows = []


def check(name, ok, detail):
    rows.append(dict(check=name, result="PASS" if ok else "FAIL", detail=detail))


# 1. every stage: inside its bounds, mean on target, shape is the stated triangular (KS)
for s, t in STAGES.items():
    x = df[s].to_numpy()
    lo, hi = t.low, t.high
    in_bounds = (x.min() >= lo - 1e-6) and (x.max() <= hi + 1e-6)
    se = x.std(ddof=1) / np.sqrt(len(x))
    z = (x.mean() - t.mean) / se
    ks = stats.kstest(x, stats.triang((t.mode - lo) / (hi - lo), loc=lo, scale=hi - lo).cdf)
    check(f"stage {s}", in_bounds and abs(z) < 3.5 and ks.pvalue > 0.001,
          f"mean {x.mean():.2f} vs {t.mean:.2f} (z={z:+.2f}); range [{x.min():.1f}, {x.max():.1f}] in [{lo:g}, {hi:g}]; KS p={ks.pvalue:.3f}")

# 2. infusion mix matches the borrowed histogram (chi-square)
obs = df.planned_infusion.value_counts().reindex(list(INFUSION_MIX), fill_value=0)
p = np.array(list(INFUSION_MIX.values()), float)
p /= p.sum()
chi = stats.chisquare(obs.to_numpy(), p * obs.sum())
check("infusion mix", chi.pvalue > 0.001,
      "shares " + ", ".join(f"{d}:{o / obs.sum():.3f}/{q:.3f}" for d, o, q in zip(INFUSION_MIX, obs, p))
      + f"; chi2 p={chi.pvalue:.3f}")

# 3. actual vs planned infusion: direction of error and size (Hacettepe MAPE 16.9%)
ratio = df.actual_infusion / df.planned_infusion
band = np.where(df.planned_infusion <= 60, "short", np.where(df.planned_infusion >= 240, "long", "mid"))
means = pd.Series(ratio).groupby(band).mean()
mape = (abs(df.actual_infusion - df.planned_infusion) / df.actual_infusion).mean()
check("infusion error direction", means["short"] > 1 > means["long"],
      f"mean actual/planned: short {means['short']:.3f}, mid {means['mid']:.3f}, long {means['long']:.3f}")
check("infusion error size", 0.05 < mape < 0.25, f"MAPE {mape:.1%} (Hacettepe S11: 16.9%)")
check("infusion range", df.actual_infusion.between(27, 400).all(),
      f"actual {df.actual_infusion.min():.0f}-{df.actual_infusion.max():.0f} min (planned 30-360)")

# 4. probabilities: 99.9% binomial interval covers the target
for col, target in [("unfit", P_UNFIT), ("noshow", P_NOSHOW)]:
    k, n = int(df[col].sum()), len(df)
    ci = stats.binomtest(k, n).proportion_ci(0.999)
    check(f"P({col})", ci.low <= target <= ci.high, f"{k / n:.4f} (target {target}); 99.9% CI [{ci.low:.4f}, {ci.high:.4f}]")
k = int((df.cls == "P").sum())
ci = stats.binomtest(k, len(df)).proportion_ci(0.999)
check("P(pre-cleared)", ci.low <= P_PRECLEARED <= ci.high, f"{k / len(df):.4f} (target {P_PRECLEARED})")
check("deferred_prior_day only for pre-cleared unfit",
      (df.deferred_prior_day == ((df.cls == "P") & df.unfit)).all(), "consistent")

# 5. bookings fill the target share of chair-hours
target = unit.load * unit.chairs * (unit.close - unit.open)
booked = df.groupby("day").planned_infusion.apply(lambda s: sum(planned_chair_time(v) for v in s))
check("daily booked chair-minutes", (booked >= target).all() and (booked < target + planned_chair_time(360)).all(),
      f"{booked.min():.0f}-{booked.max():.0f} vs target {target:.0f} ({unit.load:.0%} of {unit.chairs} chairs x 10 h)")

# 6. reproducible: regenerating gives byte-identical data
h = lambda d: hashlib.md5(d.round(3).to_csv(index=False).encode()).hexdigest()
regen = generate(cfg, unit)[df.columns]
check("reproducible (same seed, same data)", h(regen) == h(df), f"md5 {h(df)[:12]}")

# 7. common random numbers: changing the pre-cleared share changes classes only
a = generate_day(3, cfg, unit)
b = generate_day(3, DataConfig(p_precleared=0.9), unit)
same = a.drop(columns=["cls", "deferred_prior_day"]).equals(b.drop(columns=["cls", "deferred_prior_day"]))
check("CRN across pre-cleared share", same and (b.cls == "P").sum() > (a.cls == "P").sum(),
      "only cls changes when the share goes 0.3 -> 0.9")

# 8. Presentation 3 numbers reproduce (80th percentile ready delay)
_, raw = ready_buffers(0.8)
check("Presentation 3 buffers", abs(raw["P"] - 89.9) < 0.5 and abs(raw["S"] - 206.2) < 0.5,
      f"q=0.8: pre-cleared {raw['P']:.1f} min (slide: 89.9), same-day {raw['S']:.1f} min (slide: 206.2)")

# 9. external plausibility: minimum possible same-day wait vs Kochi's 3.5 h
lb = sum(STAGES[s].mean for s in ["registration", "blood_draw", "lab", "doctor", "billing", "pharmacy", "line_premed"])
check("same-day no-queue wait vs Kochi (V1)", 180 <= lb <= 260,
      f"arrival-to-drip with zero queues = {lb:.0f} min ({lb / 60:.2f} h); Kochi baseline 210 min (3.5 h)")

out = pd.DataFrame(rows)
with open("results/verify_data.md", "w") as f:
    f.write("# Data verification\n\n")
    f.write(f"{len(df)} booked patients over {df.day.nunique()} days. "
            f"{(out.result == 'PASS').sum()}/{len(out)} checks pass.\n\n")
    f.write(out.to_markdown(index=False))
    f.write("\n")
print(out.to_string(index=False))
sys.exit(0 if (out.result == "PASS").all() else 1)
