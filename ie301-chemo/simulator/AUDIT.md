# Simulator logic audit

All bugs B1-B8 below are fixed in `index.html`; B9 labels are fixed too. `original.html` is the file as received.
Also changed to match Presentation 3 and the Python model: arrival deviation is now Triangular(-30, 0, 30), blood-draw and pharmacy modes are 7.5 and 22.5 min, and the default case is 20 chairs, 8 nurses, 60% booked (the old 6-nurse, 80% case is kept as a preset). With these, the no-queue buffers reproduce 89.9 / 206.2 min exactly.

Agent report follows.

# Audit of simulator/original.html: Engine and metric code

Test scripts are in this folder: load.js (pulls the Engine IIFE out of the HTML without changing it), checks.js, checks2.js, checks3.js, patches.js (applies every engine patch below as an exact string replace and checks the result). Run with `node <file>`.

## 1. Confirmed bugs, most severe first

### B1 (high). Pre-cleared patients are never unfit, so pre-clearance hides unfit patients (line 735, also 632 and 642)
`p.unfit = p.cls === 'same' && p.uUnfit < P.unfit;` makes a pre-cleared patient fit even when uUnfit < P.unfit. The intended behaviour: the patient is found unfit on the phone the day before, is not booked and never arrives. As written, these patients are booked, arrive and are treated. So raising preCleared lowers "unfit" and "not treated", and adds chair load that should not be there.
Test (checks2.js, at8_fcfs, 30 seeds): preCleared 0 / 0.5 / 1 gives unfit per day 3.90 / 2.07 / **0.00** and treated 36.4 / 41.4 / 42.8. Patched: unfit 3.90 / 3.97 / 4.13, treated 36.4 / 40.4 / 40.7. This biases Experiment 3 and the "+10% pre-cleared" row of E5.
Patch:
- old `pts.forEach(p => { p.cls = isPre(p) ? 'pre' : 'same'; p.slot = null;`
  new `pts.forEach(p => { p.cls = isPre(p) ? 'pre' : 'same'; p.priorUnfit = p.cls === 'pre' && p.uUnfit < P.unfit; p.slot = null;`
- old `const order = pts.slice();`
  new `const order = pts.filter(p => !p.priorUnfit);`
- old `      p.unfit = p.cls === 'same' && p.uUnfit < P.unfit;\n` (followed by the p.noShow line)
  new `      p.unfit = p.cls === 'same' && p.uUnfit < P.unfit;\n      if (p.priorUnfit) { p.outcome = 'unfit'; continue; }\n`
Optional UI change: the live counter `'Arrived': \`${arrived}/${R.K.n - R.K.noshow}\`` (line 1393) then also counts patients deferred the day before. Subtract `R.pts.filter(p => p.priorUnfit).length` from that denominator.

### B2 (medium-high). The idle-chair split gives every free chair to one cause (lines 710-711)
If even one ready patient is waiting, the code counts all free chairs as "nurse-bound". If none is waiting and anyone is still in steps 1-6, it counts all free chairs as "starved". The correct split works chair by chair: nurse-bound = min(free, ready), starved = min(free − nurse-bound, in pipeline), and the rest is no demand. On top of that, with allowEarly=false, patients held back for their slot count as "nurse-bound" even with unlimited nurses.
Tests:
- Default settings, 30 seeds, chair-h per day: nurse-bound 27.1 → 20.9 after the patch, starved 54.0 → 59.9, no demand 0.4 → 1.3.
- checks3.js: 200 nurses with allowEarly=false shows **42 chair-h/day nurse-bound** and nurseSat = 0. After the patch it is 0.
This feeds the bottleneck verdict (`K.nurseBound > 0.25 * K.idleChair`) and renderIdle.
Patch:
old
```
        if (fc > 0 && readyQ.length === 0 && pipeline > 0) starveMin += fc * dt;
        if (fc > 0 && readyQ.length > 0) nurseBoundMin += fc * dt;
```
new
```
        const elig = (P.allowEarly || P.rule === 'buckets' || P.rule.startsWith('at8')) ? readyQ.length : readyQ.filter(p => p.slot === null || p.slot <= a).length;
        const nb = Math.min(fc, elig), sv = Math.min(fc - nb, pipeline);
        nurseBoundMin += nb * dt; starveMin += sv * dt;
```
(After this patch, patients held for their slot fall into the "no demand" remainder. If you want them shown, add a fourth category.)

### B3 (medium). Stage-spread above 2 gives negative durations, and events then run backwards in time (line 520)
`tri()` stretches the lower end without a floor. The UI slider goes up to 3, and `tri(0, 5, 10, 15, 3) = -5`. Registration can then take a negative time: `H.push(now + d)` schedules an event in the past and the clock goes back (checks2.js: 1 negative duration and 1 backwards timeline step at spread 3, seed 1). The Python `Tri.scaled` clamps the low end at 0.
Patch: old `const a = mode - (mode - lo) * f, b = mode + (hi - mode) * f;`
new `const a = lo >= 0 ? Math.max(0, mode - (mode - lo) * f) : mode - (mode - lo) * f, b = mode + (hi - mode) * f;`
The same failure can happen with "Lab 30 min faster" (line 1448) if a user sets lab low below 30. Use `s.lo = Math.max(0, s.lo - 30); s.mode = Math.max(s.lo, s.mode - 30); s.hi = Math.max(s.mode, s.hi - 30);`.

### B4 (medium). E5 "+1 chair" is scored on a different, larger patient day (line 1446)
genDay sets its target as `P.fill * P.chairs * hours`, so one extra chair also books about 5% more patients (seed 5: 54 → 58). That breaks common random numbers and mixes "more capacity" with "more demand", so the extra chair looks less useful than it is. The Python E6 keeps demand fixed. Every other E5 move keeps the same day (checked).
Patch: old `J('e5c', '+1 chair', { chairs: base.chairs + 1 });`
new `J('e5c', '+1 chair', { chairs: base.chairs + 1, fill: base.fill * base.chairs / (base.chairs + 1) });`
Verified: this produces the same patient list as the base case.

### B5 (low). The no-queue delay D clamps early arrival to 0 (line 596)
`const devP = Math.max(dev, 0);` is only right for patients told to come at opening time. A patient told to come later who arrives early starts registration early, so D can be shorter. The clamp pushes B up. With Presentation 3 stage values and the Tri(-30,0,30) deviation, the unclamped code gives **89.9 / 206.2** (exact match to Python, n=200k), and the clamped code gives 90.6 / 208.7. The effect is small: this function only seeds the first pilot iteration and supplies the B label for the 8 am and bucket rules.
Patch: old `const devP = Math.max(dev, 0);` → new `const devP = dev;`

### B6 (low). The empirical quantile takes one rank too high (lines 601, 610)
`arr[floor(q*n)]` returns order statistic floor(qn)+1, but the q-quantile is the ceil(qn)-th value. On pilot samples of about 300-700 values the difference is about one rank.
Patch (each line occurs once):
- old `const qf = (arr, q) => arr[Math.min(arr.length - 1, Math.floor(q * arr.length))];`
  new `const qf = (arr, q) => arr[Math.max(0, Math.min(arr.length - 1, Math.ceil(q * arr.length) - 1))];`
- old `const qf = (arr, q) => arr.length ? arr[Math.min(arr.length - 1, Math.floor(q * arr.length))] : 0;`
  new `const qf = (arr, q) => arr.length ? arr[Math.max(0, Math.min(arr.length - 1, Math.ceil(q * arr.length) - 1))] : 0;`

### B7 (low). The confidence interval always uses z = 1.96 (line 874)
With "30 days per scenario" the right t value is 2.045, so the intervals are about 4% too narrow.
Patch: old `S[f] = { m, hw: v.length > 1 ? 1.96 * sd / Math.sqrt(v.length) : 0 };`
new `S[f] = { m, hw: v.length > 1 ? (1.96 + 2.4 / (v.length - 1) + 2.8 / (v.length - 1) ** 2) * sd / Math.sqrt(v.length) : 0 };`
This approximation of t_{0.975,df} is within 0.01 for df ≥ 5. Related: the "Buffer wins / 8 am wins" pills in E4 and the "Δ cost" column in E5 compare means only. With common random numbers, a paired CI of the per-day difference would be the proper test.

### B8 (low). Empty sets report 0 instead of "no data" (lines 847, 858-859)
`mean([])` returns 0. A day with no treated patients therefore shows wait 0 and P90 0 (checks3.js, 1 chair over a 2-hour day), and with preCleared = 0 the verdict text says "pre-cleared patients 0 min".
Patch: old `waitMean: mean(waits), waitP90: p90(waits),` → new `waitMean: waits.length ? mean(waits) : null, waitP90: waits.length ? p90(waits) : null,`
For readyPre and readySame, return null when the class is empty. The UI already prints '—' for null, and summarise already drops null.

### B9 (low, UI and labels)
- The stage table offers a "Cap" input for Lab result and Billing, but the engine never queues those stages. Setting cap = 1 changes nothing (checks3.js: identical wait). Show "∞" there instead of an input.
- The Model tab says "Not treated on booked day: … and standby patients the template could not fit", but `K.notTreated = unfit + deferred + noshow`. Standby (overflow) patients are counted only if they are later sent home.
- The cost term is `wIdle * idleChair / P.chairs` (idle hours per chair), while the formula on the page reads "idle chair time". When chairs change, as in E5, the scale of this term changes too.

## 2. Design differences vs the Python model (not bugs; they affect interpretation)
- Arrival deviation is Uniform(−30, 30), not Tri(−30, 0, 30). Blood draw mode is 7 and pharmacy mode 22 (Python: 7.5 and 22.5). As a result the no-queue B is 95 / 211 instead of 90 / 206.
- The calibrated B comes from pilot days and includes queues: default 153 / 292 min, against the no-queue 95 / 211. Told time is rounded **down** to 15 minutes (up to 14 extra minutes of wait). Python rounds B up to 15.
- Discharge and observation (10-15-20) keep the chair. Overtime and "last patient out" therefore include it, so JS overtime is about 15 min longer than Python's chair-release definition. Takedown is 5-7-10 (Python 5-10-15).
- A blocked patient (drip finished, waiting for takedown) holds no nurse unit in JS, but 1 unit in Python. So JS is slightly looser on nurses.
- Infusion mix is uniform within 4 bins (mean about 145 min). The Python mix is mostly 30 min and has an actual/planned duration factor, which JS lacks.
- Blood counter is limited to 4. Patients who cannot finish by close + maxOT are sent home. The template uses a 5-min grid, LPT order, and books in overtime before falling back to standby.
- **At the default preset (80% booked, 6 nurses) about 20 of 51 patients do not fit the template** (overflow → told 08:00, lowest priority). The "buffer rule" at defaults is therefore about 40% "everyone at 8". Python treats 80% as infeasible and uses 60% with 8 nurses.
- The template order is LPT over all patients. Python orders by release time, then LPT.

## 3. Checks that passed
- (1) Conservation: every patient ends exactly once as treated, unfit, noshow or deferred. Tested on 6 rules × {default, takedownFirst off, allowEarly off, fill 1.1} × 30 seeds on the original code, and on the patched code for buffer and at8 at preCleared 0.6 over 10 seeds.
- (2) Chairs: never more than K, never below 0, and no two patients on one chair at once (same sweep).
- (3) Nurse rule M·(setups + takedowns) + on drip ≤ M·N holds at every event time. The peak reaches exactly 24/24 and never goes over.
- (4) Deterministic one-patient day (degenerate triangulars) matches the hand calculation exactly for at8 and buffer, pre-cleared and same-day (e.g. same-day: ready 669, drip 699, out 781, wait 219).
- (5) The no-queue D with P3 values and Tri deviation reproduces 89.9 / 206.2 once the clamp is removed. The realised D at infinite capacity (95.9 / 212.4) matches the code's own no-queue MC (95.3 / 211.5).
- (6) Common random numbers: identical patient draws across all 6 rules, q, preCleared, precompound, takedownFirst and allowEarly (10/10 seeds). Only +1 chair (B4), fill, opening hours, the mix and the setup/takedown/obs means change the day.
- (7) Wait mean and overtime recomputed from the timeline match K exactly. Idle total = capacity − occupied (consistent). The split is wrong as described in B2.
- (8) Magnitudes over 30 seeds, at 8 nurses and 60% booked (closest to Python): buffer wait 198 ± 4 min, OT 35. at8 FCFS wait 259 ± 7, OT 73. Python: MIP 213 / 37, all-8 316 / 127. The rough agreement is in line with the design differences. At defaults: buffer 272 min / OT 110, at8 324 / 107.
- Heap ordering, integration bookkeeping (integrate runs before every state change), station release and queue hand-off, and takedown-first dispatch all checked: no leaks and no double releases. E2 and E3 key handling is fine (the lexicographic sort happens to be correct for the q values used).
