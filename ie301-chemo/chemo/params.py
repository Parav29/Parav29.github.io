"""Every model input in one place, each tagged with a source id and a status.

Source ids point to docs/SOURCES.md. Status follows Presentation 3:
  Borrowed    - taken from a published study
  Assumed     - team assumption (Presentation 3) or engineering judgement
  Placeholder - stand-in until Tata Memorial data arrives
  Calibrated  - tuned so the baseline reproduces a published figure

Times are minutes. Clock time is minutes after midnight (480 = 08:00).
A triangular is (low, mode, high).
"""
from dataclasses import dataclass, field, replace

OPEN, CLOSE = 480, 1080          # 08:00-18:00, Presentation 3 base case
SLOT = 15                        # booking grid, minutes


@dataclass(frozen=True)
class Tri:
    low: float
    mode: float
    high: float
    source: str = ""
    status: str = ""

    @property
    def mean(self):
        return (self.low + self.mode + self.high) / 3

    def scaled(self, f):
        """Stretch the spread around the mode by factor f (robustness tests)."""
        lo = max(0.0, self.mode - f * (self.mode - self.low)) if self.low >= 0 else self.mode - f * (self.mode - self.low)
        return replace(self, low=lo, high=self.mode + f * (self.high - self.mode))


# ---- Stage times (Presentation 3, slide 9) -------------------------------
STAGES = {
    "arrival_dev": Tri(-30, 0, 30, "S1,S12,S13", "Placeholder"),
    "registration": Tri(5, 10, 15, "S1,S2", "Assumed"),
    "blood_draw": Tri(5, 7.5, 10, "S1,S2", "Assumed"),
    "lab": Tri(60, 90, 120, "S1,S2,S9", "Assumed"),
    "doctor": Tri(10, 15, 20, "S1,S2,S7", "Assumed"),
    "billing": Tri(30, 45, 60, "S1,S2", "Assumed"),
    "pharmacy": Tri(15, 22.5, 30, "S1,S2,S14,S15", "Assumed"),
    "line_premed": Tri(20, 30, 40, "S1,S2,S4", "Assumed"),
    "takedown": Tri(5, 10, 15, "S6", "Assumed"),
    "discharge": Tri(15, 22.5, 30, "S1", "Assumed"),
}

# Lab scenario for a hospital-wide counter like TMH (hemogram TAT stated as 4 h).
LAB_TMH = Tri(120, 180, 240, "S9", "Borrowed")

# ---- Infusion mix: one real clinic day, n = 55 (S10); Liang 2015 (S4) also
# reports ~45% of appointments at 30 min, which this mix matches (45.5%).
INFUSION_MIX = {30: 25, 60: 3, 120: 10, 180: 10, 240: 6, 360: 1}
INFUSION_MIX_SOURCE = ("S10,S4", "Borrowed")

# Actual / planned infusion ratio. Short infusions run long, long ones finish
# early (S11 Hacettepe: MAPE 16.9%; S16 Bath; S17 Mayo asymmetry).
DURATION_FACTOR = {
    "short": Tri(0.90, 1.00, 1.60, "S11,S16,S17", "Assumed"),   # planned <= 60
    "mid": Tri(0.85, 1.00, 1.20, "S11,S16,S17", "Assumed"),     # 60 < planned < 240
    "long": Tri(0.75, 0.95, 1.10, "S11,S16,S17", "Assumed"),    # planned >= 240
}

# ---- Probabilities --------------------------------------------------------
P_UNFIT = 0.08        # S18, S19: ~8% of cycles delayed; ~1/4 of low-count cycles postponed
P_NOSHOW = 0.05       # S20, S21: neuro clinic 9.5% non-attendance; chemo assumed lower
P_PRECLEARED = 0.30   # base case; varied 0..1 in experiment 3

# ---- Unit ----------------------------------------------------------------
@dataclass(frozen=True)
class Unit:
    chairs: int = 20              # Presentation 3 base case
    nurses: int = 8               # ~6 patients per nurse-shift; see docs/SOURCES.md S5,S22
    monitor_ratio: int = 4        # one nurse sets up 1 or monitors up to 4 (S5, Hesaraki 2019)
    registration_desks: int = 2
    doctors: int = 2
    pharmacy_hoods: int = 3
    load: float = 0.60            # base case; Presentation 3 used 0.80, which is infeasible (see REPORT)
    open: int = OPEN
    close: int = CLOSE
    precompound_precleared: bool = False   # intervention: drugs for pre-cleared made before opening (S3 Kochi phase 2)
    lab_tmh: bool = False

    @property
    def nurse_units(self):
        return self.nurses * self.monitor_ratio


@dataclass(frozen=True)
class DataConfig:
    days: int = 100
    seed: int = 301
    p_precleared: float = P_PRECLEARED
    p_unfit: float = P_UNFIT
    p_noshow: float = P_NOSHOW
    stage_spread: float = 1.0     # experiment 4: 0.5 / 2.0
    lateness_spread: float = 1.0
    lab_tmh: bool = False
    stages: dict = field(default_factory=lambda: dict(STAGES))

    def stage(self, name):
        t = self.stages[name]
        if name == "lab" and self.lab_tmh:
            t = LAB_TMH
        f = self.lateness_spread if name == "arrival_dev" else self.stage_spread
        return t.scaled(f) if f != 1.0 else t


def planned_chair_time(planned_infusion):
    """Chair minutes the scheduler books: setup + infusion + takedown (means)."""
    return STAGES["line_premed"].mean + planned_infusion + STAGES["takedown"].mean


def parameter_table():
    rows = []
    for k, t in STAGES.items():
        rows.append(dict(parameter=k, distribution=f"Triangular({t.low:g}, {t.mode:g}, {t.high:g})",
                         mean=round(t.mean, 2), source=t.source, status=t.status))
    t = LAB_TMH
    rows.append(dict(parameter="lab (TMH scenario)", distribution=f"Triangular({t.low:g}, {t.mode:g}, {t.high:g})",
                     mean=t.mean, source=t.source, status=t.status))
    n = sum(INFUSION_MIX.values())
    rows.append(dict(parameter="planned infusion mix",
                     distribution="; ".join(f"{d} min: {c}/{n}" for d, c in INFUSION_MIX.items()),
                     mean=round(sum(d * c for d, c in INFUSION_MIX.items()) / n, 2),
                     source=INFUSION_MIX_SOURCE[0], status=INFUSION_MIX_SOURCE[1]))
    for k, t in DURATION_FACTOR.items():
        rows.append(dict(parameter=f"actual/planned infusion ({k})",
                         distribution=f"Triangular({t.low:g}, {t.mode:g}, {t.high:g})",
                         mean=round(t.mean, 3), source=t.source, status=t.status))
    for name, p, src, st in [("P(unfit at review)", P_UNFIT, "S18,S19", "Borrowed"),
                             ("P(no-show)", P_NOSHOW, "S20,S21", "Assumed"),
                             ("P(pre-cleared) base", P_PRECLEARED, "S3,S2", "Assumed")]:
        rows.append(dict(parameter=name, distribution=f"Bernoulli({p})", mean=p, source=src, status=st))
    u = Unit()
    for name, v, src, st in [("chairs K", u.chairs, "S2", "Assumed"), ("nurses N", u.nurses, "S5,S22", "Assumed"),
                             ("monitor ratio M", u.monitor_ratio, "S5,S6", "Borrowed"),
                             ("registration desks", u.registration_desks, "S2", "Assumed"),
                             ("doctors", u.doctors, "S2", "Assumed"), ("pharmacy hoods", u.pharmacy_hoods, "S14,S15", "Assumed"),
                             ("opening hours", "08:00-18:00", "S2", "Assumed"), ("booking load", u.load, "S2", "Assumed")]:
        rows.append(dict(parameter=name, distribution=str(v), mean=v if isinstance(v, (int, float)) else "",
                         source=src, status=st))
    return rows
