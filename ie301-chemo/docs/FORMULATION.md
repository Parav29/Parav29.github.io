# Optimisation formulation

The problem has three levels, in the order the decisions are made. Each level is either solved or tuned, and the simulation scores the result.

```
 Level 1  Capacity       chairs K, nurses N             grid search, scored by simulation (E6)
 Level 2  Booking rule   buffer B_c = F_c^-1(q)          chance constraint / newsvendor (E2, E3)
 Level 3  Daily slots    s_i for every patient           integer programme, solved each day (chemo/mip.py)
          ----------------------------------------------------------------------------------
          Evaluation     the simulated day (chemo/sim.py), 100 seeded days, 95% confidence intervals
```

This is the "generate, then stress-test" architecture of Liang et al. (2015). The integer programme is Hesaraki et al. (2019) with one change: their fixed ready time (Hesaraki 2020) becomes random, and the chance constraint in Level 2 handles it.

---

## Level 0: the problem statement (Presentation 1)

> Hold the 90th-percentile patient wait and the required throughput as constraints; minimise the cost of capacity plus expected session overtime.

$$
\min_{K,\,N,\,q,\,\text{schedule}} \; c_K K + c_N N + c_O\,\mathbb{E}[\text{overtime}]
\quad\text{s.t.}\quad
P_{90}(\text{wait}) \le W,\qquad \text{patients treated per day} \ge \lambda
$$

The expectation and the percentile are over random arrivals and stage times, so no closed form exists. The levels below break this into pieces we can solve.

---

## Level 2: the booking rule (two times per patient)

**Symbols**

| symbol | meaning |
|---|---|
| $a_i$ | arrival time told to patient $i$ |
| $s_i$ | chair slot planned for patient $i$ |
| $D_i$ | random delay from told arrival to drug ready: lateness, plus every stage before the chair |
| $c(i)\in\{P,S\}$ | class: pre-cleared (bloods done the day before) or same-day |
| $F_c$ | distribution of $D$ for class $c$ (from the stage-time data) |
| $q$ | share of patients who must be ready by their slot |

For a pre-cleared patient, $D = \text{lateness} + \text{registration} + \text{billing} + \text{pharmacy}$. For a same-day patient, add blood draw, lab and doctor review.

**Chance constraint.** Patient $i$ should be ready for the chair with probability at least $q$:

$$
\Pr(a_i + D_i \le s_i) \ge q \;\Longleftrightarrow\; s_i - a_i \ge F_{c(i)}^{-1}(q) =: B_{c(i)}
$$

Every minute of gap beyond $B_c$ is a minute the patient waits after becoming ready, so the best choice is equality:

$$
\boxed{a_i = s_i - B_{c(i)}}
$$

With the Presentation 3 inputs and $q = 0.8$: $B_P = 89.9 \to 90$ min and $B_S = 206.2 \to 210$ min, rounded up to the 15-minute grid.

**Why $q$ is a newsvendor quantile.** If the buffer is $B$:

- The chair idles by $(D-B)^+$ when the patient is late.
- The patient waits $(B-D)^+$ when they are early.

Minimising $c_\text{idle}\,\mathbb{E}(D-B)^+ + c_\text{wait}\,\mathbb{E}(B-D)^+$ gives the critical fractile:

$$
q^* = \frac{c_\text{idle}}{c_\text{idle} + c_\text{wait}}
$$

So choosing $q$ amounts to stating how much one idle chair-minute is worth against one patient-minute. Experiment E2 maps that trade-off.

**What this ignores.** $F_c$ here contains no queues. The simulation adds them, and that is why the simulated wait is longer than the buffer alone predicts.

---

## Level 3: the daily slot integer programme (`chemo/mip.py`)

Time is a 15-minute grid $t = 0..T-1$ from 08:00. $T_c$ is closing time (18:00). The horizon runs 4 h past closing so overtime is possible but paid for.

**Sets and data**

| | |
|---|---|
| $g \in G$ | patient groups = (class, planned infusion, release). Patients in a group are interchangeable |
| $n_g$ | patients in group $g$ |
| $L_g$ | chair slots needed: setup (2) + infusion + takedown (1) |
| $r_g$ | earliest slot $= \lceil B_c / 15 \rceil$ (the buffer rule) |
| $K$ | chairs (20) |
| $M$ | patients one nurse can monitor (4) |
| $N$ | nurses (8) |
| $\omega_{g,k}$ | nurse load of a group-$g$ patient in their $k$-th chair slot: $M$ during setup and takedown, 1 during infusion |

**Variables**

- $y_{g,t} \in \mathbb{Z}_{\ge 0}$: number of group-$g$ patients whose chair slot starts at $t$, for $t \in [r_g,\,T-L_g]$.
- $z_\tau \in \{0,1\}$: 1 while the unit is still open at slot $\tau$.

**Model**

$$
\min\; \underbrace{\sum_{g,t} (t+L_g)\,y_{g,t}}_{\text{flowtime}} \;+\; w_m \underbrace{\sum_\tau z_\tau}_{\text{makespan}} \;+\; w_o \underbrace{\sum_{\tau \ge T_c} z_\tau}_{\text{overtime}}
$$

subject to

$$
\begin{aligned}
&(1)\ \text{everyone booked} && \textstyle\sum_t y_{g,t} = n_g && \forall g\\
&(2)\ \text{chairs} && \textstyle\sum_{g}\sum_{t:\,t\le\tau<t+L_g} y_{g,t} \le K\,z_\tau && \forall \tau\\
&(3)\ \text{nurses (Hesaraki)} && \textstyle\sum_{g}\sum_{t:\,t\le\tau<t+L_g} \omega_{g,\tau-t}\,y_{g,t} \le M N && \forall \tau\\
&(4)\ \text{open is a prefix} && z_\tau \ge z_{\tau+1} && \forall \tau\\
&(5)\ \text{release (buffer rule)} && y_{g,t} = 0 \ \text{ for } t < r_g\\
&(6)\ \text{pharmacy smoothing (optional)} && \textstyle\sum_{g}\sum_{t=\tau}^{\tau+1} y_{g,t} \le \Big\lfloor \tfrac{H \cdot 30}{\bar p} \Big\rfloor && \forall \tau\\
&(7)\ \text{arrival smoothing (optional)} && \textstyle\sum_{g} y_{g,a+r_g} \le \big\lfloor \tfrac{D \cdot 15}{\overline{reg}} \big\rfloor,\ \sum_{g \in S} y_{g,a+r_g} \le \big\lfloor \tfrac{Dr \cdot 15}{\overline{doc}} \big\rfloor && \forall a
\end{aligned}
$$

Constraint (7) was added after E5. Without it, extra nurses let the MIP tell many patients to arrive at the same time, and the queue moved to registration and the doctors. $a$ is the told-arrival slot $t - r_g$; $D$ and $Dr$ are desks and doctors. E7 shows that with (7), 10 nurses cut overtime instead of raising it.

Weights: $w_m = n/4$ and $w_o = 10n$ (Hesaraki's flowtime/makespan balance, plus a heavy overtime penalty). In (6), $H$ is the number of pharmacy hoods and $\bar p$ the mean preparation time.

Constraint (3) is Presentation 3's *M × setups + patients on the drip ≤ M × N*. Setup and takedown use $M$ units, so a nurse who is setting up is fully busy. Takedown is counted as exclusive too, because nurse load peaks at the start and end of an infusion (Athawale 2015).

**How it is solved**

- **Aggregation.** Writing the model over groups instead of patients removes symmetry: about 560 variables and 950 constraints for a 50-patient day. Any per-patient solution maps to a group solution with the same objective, and back again.
- **Tight overtime.** $z_\tau$ multiplies the chair capacity in (2), so the LP bound on overtime is strong. A first version that used a separate binary for each (group, start) pair, linked to makespan, took more than 60 s and did not converge.
- **Warm start.** HiGHS starts from the best of 42 greedy list schedules (longest first within each release time, plus randomised orders).
- **Limits.** 15 s per day, 1% gap. Mean solve time is 6.9 s.

**Verification (`04_verify_mip.py`)**

| check | result |
|---|---|
| Independent re-check of every constraint on 20 days | 20/20 feasible |
| Optimum = brute-force enumeration (6 random small instances) | 6/6 exact |
| MIP vs greedy on its own objective | MIP never worse; greedy 48% worse on average |
| Planned overtime | 11 min (MIP) vs 76 min (greedy) |

---

## Level 1: capacity (E6)

A $3\times4$ grid: $K \in \{16, 20, 24\}$ and $N \in \{6, 8, 10, 12\}$. Daily demand stays the same across the grid. For each cell, the MIP books every day, the simulation scores it, and the cheapest cell that meets the P90-wait and overtime limits is chosen.

The costs are **assumptions to replace**:

- Nurse: ₹2,000 per day.
- Chair: ₹150 per day, a recliner amortised over 5 years plus space.
- Overtime: ₹375 per nurse-hour.

The capacity choice is what Presentation 1 asked for; the cost numbers are placeholders.

---

## Why not one big stochastic programme

Hadid et al. (2022) put every appointment time inside a simulation-optimisation loop: 246 appointments took about 13 hours. Here, Level 3 is deterministic and takes seconds. All the randomness sits in two numbers, $B_P$ and $B_S$, which Level 2 sets from a distribution and the simulation checks.

What this gives up: the MIP plans with mean durations. The robustness experiment (E4) checks what that costs when the real spreads are halved or doubled.
