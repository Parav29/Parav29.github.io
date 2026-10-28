// Redesign of Team INFUCINQ's final presentation (content and numbers unchanged)
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const md = require("react-icons/md");
const { applyTheme } = require("/root/.claude/skills/synced/40e305a6-4612-4756-b9a2-5a1a1573d8bc_b6812a72-6a19-4f8a-81fd-e2023f3fdbf0/pptx/scripts/apply_theme.js");

const THEME = {
  name: "INFUCINQ Final",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1C2A30", lt1: "FFFFFF", dk2: "12302D", lt2: "EEF3F1",
    accent1: "0F766E", accent2: "EB6834", accent3: "2A78D6", accent4: "E3A008", accent5: "C2649A", accent6: "1BAF7A",
    hlink: "0F766E", folHlink: "6250D6",
  },
};
const H = { ink: "1C2A30", muted: "5E6E73", teal: "0F766E", dark: "12302D", chip: "1C4541", mint: "7FD1C7", peach: "F6A57F",
  orange: "EB6834", orangeSoft: "FDEBE2", blue: "2A78D6", pink: "C2649A", amber: "E3A008", grey: "8C9A97", panel: "EEF3F1",
  line: "D6DEDB", white: "FFFFFF", onDark: "D7EAE6", onDark2: "9FC9C3" };
const OUT = process.argv[2] || "deck.pptx";

async function icon(Comp, color = "FFFFFF") {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: "#" + color, size: 256 }));
  return "image/png;base64," + (await sharp(Buffer.from(svg)).png().toBuffer()).toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.title = "Operational analysis of a day-care chemotherapy unit";
  pres.author = "Team INFUCINQ";
  pres.company = "IE301 Operations Analysis";
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;

  const foot = (c) => ({ text: { text: "Team INFUCINQ · IE301 Operations Analysis · Final presentation", options: { x: 0.6, y: 7.0, w: 7, h: 0.3, fontSize: 10, color: c, margin: 0 } } });
  pres.defineSlideMaster({
    title: "Cover", background: { color: THEME.colors.dk2 },
    objects: [
      { placeholder: { options: { name: "kicker", type: "body", x: 0.8, y: 1.3, w: 8, h: 0.4, fontSize: 14, bold: true, color: H.onDark2, charSpacing: 2, margin: 0 }, text: "" } },
      { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 1.85, w: 8.6, h: 2.3, fontFace: "Cambria", fontSize: 48, bold: true, color: "FFFFFF", valign: "top", align: "left", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "subtitle", type: "body", x: 0.8, y: 4.3, w: 8.4, h: 0.6, fontSize: 20, color: H.onDark, valign: "top", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "team", type: "body", x: 0.8, y: 5.75, w: 8.4, h: 0.8, fontSize: 14, color: H.onDark2, valign: "top", margin: 0 }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "Content", background: { color: "FFFFFF" },
    objects: [
      { placeholder: { options: { name: "kicker", type: "body", x: 0.6, y: 0.38, w: 9, h: 0.3, fontSize: 12, bold: true, color: THEME.colors.accent1, charSpacing: 2, margin: 0 }, text: "" } },
      { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.7, w: 12.1, h: 0.75, fontFace: "Cambria", fontSize: 32, bold: true, color: THEME.colors.dk1, valign: "top", align: "left", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "sub", type: "body", x: 0.6, y: 1.42, w: 12.1, h: 0.4, fontSize: 15, color: H.muted, valign: "top", margin: 0 }, text: "" } },
      foot(H.muted),
    ],
    slideNumber: { x: 12.2, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: H.muted, align: "right" },
  });
  pres.defineSlideMaster({
    title: "Dark", background: { color: THEME.colors.dk2 },
    objects: [
      { placeholder: { options: { name: "kicker", type: "body", x: 0.6, y: 0.38, w: 9, h: 0.3, fontSize: 12, bold: true, color: H.onDark2, charSpacing: 2, margin: 0 }, text: "" } },
      { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.7, w: 12.1, h: 0.75, fontFace: "Cambria", fontSize: 32, bold: true, color: "FFFFFF", valign: "top", align: "left", margin: 0 }, text: "" } },
      foot(H.onDark2),
    ],
    slideNumber: { x: 12.2, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: H.onDark2, align: "right" },
  });

  const I = {};
  for (const [k, comp] of [["users", md.MdPeopleAlt], ["chair", md.MdEventSeat], ["calendar", md.MdEventRepeat], ["sim", md.MdTimeline],
    ["moon", md.MdNightsStay], ["play", md.MdPlayCircle], ["chart", md.MdInsights], ["web", md.MdLanguage], ["urgent", md.MdPriorityHigh],
    ["standby", md.MdHourglassTop], ["syringe", md.MdVaccines], ["score", md.MdScoreboard], ["check", md.MdCheckCircle], ["pharm", md.MdScience],
    ["nurse", md.MdMedicalServices], ["clock", md.MdAccessTime], ["tune", md.MdTune], ["rule", md.MdRule], ["target", md.MdTrackChanges], ["flask", md.MdBiotech]]) I[k] = await icon(comp);

  let n = 0;
  const T = (o) => Object.assign({ isTextBox: true, margin: 0, fontFace: "Calibri", color: H.ink, valign: "top" }, o);
  const shape = (s, kind, o, name) => { n++; s.addShape(kind, Object.assign({ line: { type: "none" }, objectName: (name || "shape") + n }, o)); };
  const card = (s, x, y, w, h, fill = H.panel, name = "card") => shape(s, pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: fill } }, name);
  const dot = (s, key, x, y, d, fill = C.accent1) => { shape(s, pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill } }, "iconbg"); s.addImage({ data: I[key], x: x + d * 0.22, y: y + d * 0.22, w: d * 0.56, h: d * 0.56, objectName: "icon" + n }); };
  const take = (s, text, y = 6.15, dark = false) => {
    card(s, 0.6, y, 12.1, 0.68, dark ? H.chip : H.dark, "takeaway");
    s.addText(text, T({ x: 0.9, y, w: 11.6, h: 0.68, fontSize: 16, bold: true, color: "FFFFFF", valign: "middle" }));
  };
  const slide = (layout, section, kicker, title, sub) => {
    const s = pres.addSlide({ masterName: layout, sectionTitle: section });
    if (kicker) s.addText(kicker, { placeholder: "kicker" });
    if (title) s.addText(title, { placeholder: "title" });
    if (sub) s.addText(sub, { placeholder: "sub" });
    return s;
  };
  const AX = { catAxisLabelColor: H.muted, valAxisLabelColor: H.muted, catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt",
    catAxisLabelFontSize: 12, valAxisLabelFontSize: 11, valGridLine: { color: "E3E8E6", size: 0.75 }, catGridLine: { style: "none" },
    catAxisLineShow: false, valAxisLineShow: false, dataLabelFontFace: "+mn-lt", dataLabelFontSize: 12, titleFontFace: "+mn-lt",
    titleFontSize: 14, titleColor: H.ink, legendFontFace: "+mn-lt", legendFontSize: 12, legendColor: H.ink,
    valAxisTitleFontFace: "+mn-lt", catAxisTitleFontFace: "+mn-lt", valAxisTitleColor: H.muted, catAxisTitleColor: H.muted, valAxisTitleFontSize: 12, catAxisTitleFontSize: 12 };

  // ============================================================ 1 COVER
  pres.addSection({ title: "Opening" });
  {
    const s = slide("Cover", "Opening");
    s.addText("IE301 · TOPIC 1 · FINAL PRESENTATION", { placeholder: "kicker" });
    s.addText("Operational analysis of a day-care chemotherapy unit", { placeholder: "title" });
    s.addText("Simulation, evening optimiser and results", { placeholder: "subtitle" });
    s.addText("Team INFUCINQ\nParav · Sahasra · Siddhesh · Vaibhav · Kartikya", { placeholder: "team" });
    const chips = [["sim", "Simulation", "many linked days of the unit"], ["moon", "Evening optimiser", "books tomorrow's chairs and doctors"], ["chart", "Six experiments", "120 days each, same patients"]];
    chips.forEach(([ic, a, b], i) => {
      const y = 1.5 + i * 1.6;
      card(s, 9.55, y, 3.15, 1.35, H.chip, "chip");
      dot(s, ic, 9.8, y + 0.28, 0.6, C.accent1);
      s.addText(a, T({ x: 10.55, y: y + 0.28, w: 2.05, h: 0.35, fontSize: 16, bold: true, color: "FFFFFF" }));
      s.addText(b, T({ x: 10.55, y: y + 0.65, w: 2.05, h: 0.6, fontSize: 12.5, color: H.onDark }));
    });
  }

  // ============================================================ 2 WHERE WE ARE
  pres.addSection({ title: "The model" });
  {
    const s = slide("Content", "The model", "WHERE WE ARE", "From the Tata Memorial visit to a working model");
    const st = [["300–400", "patients a day at TMH"], ["70–80", "chairs, slots booked by hand"], ["2–3 days", "lost when a slot is missed"]];
    st.forEach(([b, l], i) => {
      const x = 0.6 + i * 2.55;
      card(s, x, 1.75, 2.35, 1.65);
      s.addText(b, T({ x: x + 0.25, y: 1.95, w: 2.0, h: 0.65, fontFace: "Cambria", fontSize: 30, bold: true, color: i === 2 ? H.orange : H.teal }));
      s.addText(l, T({ x: x + 0.25, y: 2.65, w: 1.95, h: 0.65, fontSize: 13.5, color: H.muted }));
    });
    s.addText("What we built", T({ x: 8.4, y: 1.75, w: 4.3, h: 0.4, fontFace: "Cambria", fontSize: 19, bold: true }));
    const built = [["sim", "A simulation of the unit over many linked days: cycles, unfit patients, rebooking"], ["moon", "An evening optimiser that books tomorrow's chairs and doctors"],
      ["chart", "Six experiments: booking rules, pre-clearance, reserved chairs, nurses, robustness, 24/7; 120 days each"], ["web", "A website that plays any day minute by minute"]];
    built.forEach(([ic, t], i) => {
      const yy = [2.25, 2.75, 3.25, 3.9][i];
      dot(s, ic, 8.4, yy, 0.38);
      s.addText(t, T({ x: 8.9, y: yy, w: 3.8, h: 0.62, fontSize: 12.5 }));
    });
    // pipeline
    const steps = [["Demand", "8 new patients a day, 5–8 cycles each"], ["Optimiser", "arrival times, chair slots, doctors"], ["Simulated day", "random stage times, queues, unfit"], ["Scorecard", "chairs, doctors, sent home, limits"]];
    steps.forEach(([a, b], i) => {
      const x = 0.6 + i * 3.08, last = i === 3;
      card(s, x, 4.45, 2.75, 1.05, last ? "D9EEEA" : H.panel, "pipe");
      s.addText(a, T({ x: x + 0.22, y: 4.58, w: 2.35, h: 0.35, fontSize: 15.5, bold: true, color: last ? H.teal : H.ink }));
      s.addText(b, T({ x: x + 0.22, y: 4.95, w: 2.35, h: 0.5, fontSize: 12.5, color: H.muted }));
      if (i < 3) shape(s, pres.shapes.RIGHT_ARROW, { x: x + 2.8, y: 4.85, w: 0.22, h: 0.26, fill: { color: "B8C5C1" } }, "arrow");
    });
    s.addText("Repeated every evening, for 30 warm-up + 120 reported days", T({ x: 0.6, y: 5.6, w: 12.1, h: 0.35, fontSize: 13, italic: true, color: H.teal, align: "center" }));
    take(s, "The model is a generic Indian public unit (20 chairs). TMH is where we observe; every input is a placeholder until TMH data.");
  }

  // ============================================================ 3 WHO COMES
  {
    const s = slide("Content", "The model", "PATIENT FLOW", "Who comes, and what they are told", "Patients are never told a chair time, only when to arrive");
    const rows = [
      ["Pre-clearance visit", "day −1", H.pink, [["Register", ""], ["Blood", ""], ["Lab", "100–200 min", 1], ["Doctor", "fit or unfit"], ["Leave", "chemo tomorrow"]]],
      ["Same-day patient", "far + some local", H.amber, [["Register", ""], ["Blood + lab", "100–200 min", 1], ["Doctor", "fit or unfit"], ["Billing + drug", "40–75 min"], ["Chair", "30 min – 10 h"]]],
      ["Pre-cleared patient", "local only", H.blue, [["Register", ""], ["Billing", "10–20 min"], ["Drug", "25–60 min"], ["Chair", "30 min – 10 h", 1]]],
    ];
    rows.forEach(([name, sub, col, steps], r) => {
      const y = 2.0 + r * 1.0;
      shape(s, pres.shapes.OVAL, { x: 0.6, y: y + 0.12, w: 0.2, h: 0.2, fill: { color: col } }, "cls");
      s.addText(name, T({ x: 0.92, y: y + 0.03, w: 2.2, h: 0.35, fontSize: 14.5, bold: true }));
      s.addText(sub, T({ x: 0.92, y: y + 0.38, w: 2.2, h: 0.3, fontSize: 12, color: H.muted }));
      steps.forEach(([a, b, hot], i) => {
        const x = 3.25 + i * 1.9;
        shape(s, pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 1.68, h: 0.78, rectRadius: 0.08, fill: { color: hot ? H.orangeSoft : H.panel }, line: hot ? { color: H.orange, width: 1 } : { type: "none" } }, "step");
        s.addText(a, T({ x: x + 0.12, y: y + 0.1, w: 1.48, h: 0.3, fontSize: 13.5, bold: true }));
        if (b) s.addText(b, T({ x: x + 0.12, y: y + 0.42, w: 1.5, h: 0.3, fontSize: 11.5, color: hot ? H.orange : H.muted, bold: !!hot }));
        if (i < steps.length - 1) shape(s, pres.shapes.RIGHT_ARROW, { x: x + 1.71, y: y + 0.29, w: 0.16, h: 0.2, fill: { color: "B8C5C1" } }, "arrow");
      });
    });
    const cards = [["urgent", "Urgent rebook", "Missed a cycle (unfit, then fit; or sent home). Skips the long chair queue. Uses reserved chairs."],
      ["standby", "Standby", "Called extra to fill chairs left by no-shows. Seated only after every planned patient."],
      ["syringe", "No-chair (10%)", "Injection only: nurse setup, no chair. Known after the doctor review."]];
    cards.forEach(([ic, a, b], i) => {
      const x = 0.6 + i * 4.1;
      card(s, x, 4.98, 3.85, 1.1);
      dot(s, ic, x + 0.2, 5.15, 0.48, i === 0 ? C.accent2 : C.accent1);
      s.addText(a, T({ x: x + 0.82, y: 5.06, w: 2.9, h: 0.3, fontSize: 14, bold: true }));
      s.addText(b, T({ x: x + 0.82, y: 5.37, w: 2.95, h: 0.68, fontSize: 11, color: H.muted }));
    });
    take(s, "Pre-clearance lets the unit know, the evening before, who is fit and how long their drip is.", 6.2);
  }

  // ============================================================ 4 INPUTS
  {
    const s = slide("Content", "The model", "INPUTS", "Inputs and distributions", "Stage ranges from Presentation 3 · all placeholders until TMH data");
    const hd = ["Stage", "Range", "Distribution", "Mean"].map(t => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: H.dark } } }));
    const data = [["Arrival vs told time", "±30 min", "Triangular", "0 min"], ["Registration", "5–15 min", "Triangular", "10 min"], ["Blood draw", "5–10 min", "Triangular", "7.5 min"],
      ["Lab result", "100–200 min", "Triangular", "163 min"], ["Doctor review", "15–40 min", "Lognormal (median 24.5)", "25 min"], ["Billing / insurance", "10–20 min", "Normal (15 ± 2.5)", "15 min"],
      ["Drug preparation", "25–60 min", "Lognormal (median 38.7)", "40 min"], ["Line + pre-meds", "20–40 min", "Triangular", "30 min"], ["Infusion", "30 min – 10 h", "Drug mix × lognormal drift", "Drug mix"]];
    const rows = data.map((r, i) => r.map((t, j) => ({ text: t, options: { fill: { color: i === 3 ? H.orangeSoft : i % 2 ? "FFFFFF" : "F5F8F7" }, bold: i === 3 && j !== 2, color: i === 3 && j === 3 ? H.orange : H.ink } })));
    s.addTable([hd, ...rows], { x: 0.6, y: 1.95, w: 7.6, colW: [2.2, 1.55, 2.6, 1.25], fontFace: "Calibri", fontSize: 13, border: { type: "solid", color: "E3E8E6", pt: 0.75 }, rowH: 0.39, valign: "middle", margin: [0.03, 0.1, 0.03, 0.1] });
    card(s, 8.55, 1.95, 4.15, 1.85);
    dot(s, "users", 8.8, 2.15, 0.45);
    s.addText("Demand", T({ x: 9.4, y: 2.2, w: 3.0, h: 0.35, fontSize: 15.5, bold: true }));
    s.addText([
      { text: "8 new patients a day, 5–8 cycles, 2/3/4 weeks apart", options: { bullet: true, breakLine: true } },
      { text: "≈ 52 cycles reach their day", options: { bullet: true, breakLine: true } },
      { text: "40% far · 10% no-chair · 5% no-show", options: { bullet: true, breakLine: true } },
      { text: "8% unfit · 2% pass away per cycle", options: { bullet: true } },
    ], T({ x: 8.8, y: 2.68, w: 3.8, h: 1.1, fontSize: 12.5 }));
    card(s, 8.55, 3.95, 4.15, 1.95, H.dark);
    s.addText("Why lognormal", T({ x: 8.8, y: 4.12, w: 3.7, h: 0.35, fontSize: 15.5, bold: true, color: "FFFFFF" }));
    s.addText("Most reviews and preparations are quick, a few run long. Median = √(low × high); the range covers 9 in 10 patients.", T({ x: 8.8, y: 4.5, w: 3.7, h: 0.75, fontSize: 12.5, color: H.onDark }));
    s.addText("Doctor: √(15 × 40) = 24.5 min\nDrug: √(25 × 60) = 38.7 min", T({ x: 8.8, y: 5.28, w: 3.7, h: 0.55, fontFace: "Cambria", fontSize: 13.5, color: H.mint }));
    take(s, "Same random numbers for every policy: each rule is tested on exactly the same patients.", 6.15);
  }

  // ============================================================ 5 GOOD DAY
  pres.addSection({ title: "Formulation" });
  {
    const s = slide("Content", "Formulation", "OBJECTIVE", "What a good day means", "Team decision: use chairs and doctors fully; patient waiting is not the goal");
    card(s, 0.6, 1.95, 12.1, 1.45, H.dark);
    s.addText([
      { text: "Score  =  ", options: { color: "FFFFFF" } }, { text: "0.60", options: { color: "FFFFFF" } }, { text: " × chair use  ", options: { color: H.mint } },
      { text: "+  0.30", options: { color: "FFFFFF" } }, { text: " × doctor use  ", options: { color: H.mint } }, { text: "−  0.10", options: { color: "FFFFFF" } }, { text: " × share sent home", options: { color: H.peach } },
    ], T({ x: 0.8, y: 2.1, w: 11.7, h: 0.65, fontFace: "Cambria", fontSize: 24, bold: true, align: "center", valign: "middle" }));
    s.addText("All three on a 0–1 scale. Chairs and doctors carry 90% of the weight, chairs twice as much as doctors.", T({ x: 0.9, y: 2.82, w: 11.5, h: 0.4, fontSize: 13.5, color: H.onDark, align: "center" }));
    s.addText("Hard limits: a plan that breaks one is out", T({ x: 0.6, y: 3.6, w: 7, h: 0.35, fontSize: 15, bold: true }));
    const lim = [["clock", "Overtime", "≤ 30 min past the effective close"], ["target", "90th-percentile wait", "≤ 6 h, arrival to drip"], ["calendar", "Cycle rule", "every missed cycle given within 3 days"]];
    lim.forEach(([ic, a, b], i) => {
      const x = 0.6 + i * 4.1;
      card(s, x, 4.05, 3.85, 0.85);
      dot(s, ic, x + 0.2, 4.22, 0.5);
      s.addText(a, T({ x: x + 0.85, y: 4.14, w: 2.9, h: 0.3, fontSize: 14, bold: true }));
      s.addText(b, T({ x: x + 0.85, y: 4.45, w: 2.9, h: 0.35, fontSize: 12.5, color: H.muted }));
    });
    // closing rule mini timeline
    s.addText("Closing rule", T({ x: 0.6, y: 5.1, w: 3, h: 0.3, fontSize: 15, bold: true }));
    const X = (m) => 0.6 + (m - 1020) * (5.2 / 90); // 17:00 .. 18:30
    shape(s, pres.shapes.ROUNDED_RECTANGLE, { x: X(1020), y: 5.5, w: X(1100) - X(1020), h: 0.3, rectRadius: 0.05, fill: { color: H.pink } }, "far");
    s.addText("Far patient: may run to 18:20", T({ x: X(1020) + 0.1, y: 5.5, w: 3.5, h: 0.3, fontSize: 11.5, bold: true, color: "FFFFFF", valign: "middle" }));
    shape(s, pres.shapes.ROUNDED_RECTANGLE, { x: X(1045), y: 5.85, w: X(1100) - X(1045), h: 0.3, rectRadius: 0.05, fill: { color: H.amber } }, "local");
    s.addText("Local: seated, ends by 18:20", T({ x: X(1045) + 0.1, y: 5.85, w: 3.0, h: 0.3, fontSize: 11.5, bold: true, color: "FFFFFF", valign: "middle" }));
    shape(s, pres.shapes.LINE, { x: X(1080), y: 5.42, w: 0, h: 0.8, line: { color: H.ink, width: 1.25 } }, "close");
    shape(s, pres.shapes.LINE, { x: X(1110), y: 5.42, w: 0, h: 0.8, line: { color: H.orange, width: 1.25, dashType: "dash" } }, "max");
    s.addText("18:00", T({ x: X(1080) - 0.3, y: 6.25, w: 0.6, h: 0.25, fontSize: 11, align: "center" }));
    s.addText("18:30 max", T({ x: X(1110) - 0.45, y: 6.25, w: 0.9, h: 0.25, fontSize: 11, color: H.orange, align: "center" }));
    s.addText("A seated patient always finishes. 18:00 stretches only for far patients; a local patient may use a free chair if they finish before the far patient does. Otherwise: sent home, urgent rebook.", T({ x: 6.3, y: 5.15, w: 6.4, h: 0.85, fontSize: 13, color: H.ink }));
    s.addText("Also: at most 5 patients told the same time; nurses are a variable, the model reports how many are needed.", T({ x: 6.3, y: 6.05, w: 6.4, h: 0.5, fontSize: 13, bold: true, color: H.teal }));
  }

  // ============================================================ 6 OPTIMISER
  {
    const s = slide("Content", "Formulation", "FORMULATION", "The optimiser", "Integer programme, solved every evening for tomorrow (HiGHS, 15-min slots)");
    const cols = [
      ["tune", "Decides", ["Each patient's chair slot (internal)", "Who is left out of the plan", "Doctor slots for same-day reviews and tomorrow's pre-clearance visits", "Told arrival = slot − buffer"], H.panel, H.ink],
      ["rule", "Constraints", ["Chairs ≤ 20; reserved chairs kept for urgent", "Nurses: 4 × setups + drips ≤ 4 × N", "Doctors: reviews ≤ what 2 doctors can finish", "Ends by the close; ≤ 5 told the same time", "Never leave out more urgent patients than greedy"], H.panel, H.ink],
      ["score", "Maximises", ["0.60 × chair-minutes used", "+ 0.30 × doctor minutes used", "− 0.10 × patients left out", "tiny tie-break: earlier finishes"], H.dark, "FFFFFF"],
    ];
    cols.forEach(([ic, h, items, fill, col], i) => {
      const x = 0.6 + i * 4.1;
      card(s, x, 1.95, 3.85, 2.95, fill);
      dot(s, ic, x + 0.25, 2.15, 0.5, i === 2 ? "1C4541" : C.accent1);
      s.addText(h, T({ x: x + 0.9, y: 2.25, w: 2.8, h: 0.35, fontFace: "Cambria", fontSize: 18, bold: true, color: col }));
      s.addText(items.map((t, j) => ({ text: t, options: { bullet: true, breakLine: j < items.length - 1 } })), T({ x: x + 0.25, y: 2.85, w: 3.4, h: 2.0, fontSize: 13, color: i === 2 ? H.onDark : H.ink, paraSpaceAfter: 4 }));
    });
    card(s, 0.6, 5.05, 5.95, 0.95);
    s.addText([{ text: "The buffer  ", options: { bold: true, color: H.teal } }, { text: "Time a patient needs to become ready, set so 8 in 10 are ready by their slot: pre-cleared and urgent 1 h 30 m · same-day 5 h", options: {} }],
      T({ x: 0.85, y: 5.12, w: 5.55, h: 0.82, fontSize: 12.5, valign: "middle" }));
    card(s, 6.75, 5.05, 5.95, 0.95);
    dot(s, "check", 6.95, 5.27, 0.5);
    s.addText([{ text: "Checked  ", options: { bold: true, color: H.teal } }, { text: "every constraint re-verified on 20 days (20/20) · equals brute force on 6 small cases (6/6) · never below greedy on its own plan (20/20)", options: {} }],
      T({ x: 7.6, y: 5.12, w: 4.95, h: 0.82, fontSize: 12.5, valign: "middle" }));
    take(s, "Example: chair slot 11:30, same-day buffer 5 h → patient told to come at 06:30.", 6.2);
  }

  // ============================================================ 7 BOOKING RULES
  pres.addSection({ title: "Results" });
  {
    const s = slide("Content", "Results", "RESULT 1 · BOOKING RULES", "Does a better rule beat today's practice?", "Five ways to tell patients when to come · 120 days each, same patients for every rule");
    const cats = ["1  Everyone at 08:00", "2  Longest first", "3  Shortest first", "4  Optimiser", "5  Buffer rule"];
    const use = [42.4, 47.8, 36.8, 51.5, 51.0], home = [28.7, 29.4, 27.8, 4.2, 7.1];
    const hl = (v) => [{ name: "Other", labels: cats, values: v.map((x, i) => (i >= 3 ? 0 : x)) }, { name: "Readiness-based", labels: cats, values: v.map((x, i) => (i >= 3 ? x : 0)) }];
    s.addChart(pres.charts.BAR, hl(use), Object.assign({}, AX, { x: 0.6, y: 1.95, w: 6.0, h: 3.35, barDir: "bar", barGrouping: "stacked", chartColors: [H.grey, H.teal],
      showTitle: true, title: "Chair use, % of 08:00–18:00 (higher is better)", showLegend: false, showValue: true, dataLabelPosition: "inEnd", dataLabelColor: "FFFFFF",
      dataLabelFormatCode: "0.0;-0.0;", catAxisOrientation: "maxMin", valAxisHidden: true, valGridLine: { style: "none" }, barGapWidthPct: 45, valAxisMaxVal: 60, valAxisMinVal: 0 }));
    s.addChart(pres.charts.BAR, hl(home), Object.assign({}, AX, { x: 6.85, y: 1.95, w: 5.85, h: 3.35, barDir: "bar", barGrouping: "stacked", chartColors: [H.grey, H.teal],
      showTitle: true, title: "Sent home per day, no chair in time (lower is better)", showLegend: false, showValue: true, dataLabelPosition: "inEnd", dataLabelColor: "FFFFFF",
      dataLabelFormatCode: "0.0;-0.0;", catAxisOrientation: "maxMin", catAxisHidden: true, valAxisHidden: true, valGridLine: { style: "none" }, barGapWidthPct: 45, valAxisMaxVal: 35, valAxisMinVal: 0 }));
    const legend = [["1  Everyone at 08:00", "today's practice: all told 08:00, first come first served"], ["2–3  Longest / shortest first", "longest (or shortest) drips go first; told 1 h before"],
      ["4  Optimiser", "same rule, but the evening optimiser picks the best slots"], ["5  Buffer rule", "told time = chair slot − time needed to get ready"]];
    legend.forEach(([a, b], i) => s.addText([{ text: a + "   ", options: { bold: true, color: i >= 2 ? H.teal : H.ink } }, { text: b, options: { color: H.muted } }],
      T({ x: 0.6 + (i % 2) * 6.15, y: 5.38 + Math.floor(i / 2) * 0.34, w: 6.0, h: 0.32, fontSize: 12 })));
    take(s, "Telling each patient a time based on their own readiness: +9 points chair use and ~22 fewer sent home a day. The simple buffer rule does as well as the optimiser.", 6.15);
  }

  // ============================================================ 8 PRE-CLEARANCE & NURSES
  {
    const s = slide("Content", "Results", "RESULT 2 · WHAT THE UNIT CAN CHANGE", "Pre-clearance and nurses", "Each point = mean of 120 days, buffer rule + optimiser");
    s.addChart(pres.charts.LINE, [{ name: "Sent home / day", labels: ["0%", "10%", "20%", "30%", "40%", "50%", "60%"], values: [15.6, 12.9, 8.8, 7.1, 5.8, 5.8, 6.0] }],
      Object.assign({}, AX, { x: 0.6, y: 1.95, w: 6.0, h: 3.3, chartColors: [H.teal], lineSize: 3, lineDataSymbol: "circle", lineDataSymbolSize: 9, showLegend: false,
        showTitle: true, title: "More patients pre-cleared → fewer sent home", showCatAxisTitle: true, catAxisTitle: "% of patients who did blood + doctor the day before",
        showValAxisTitle: true, valAxisTitle: "sent home / day", valAxisMinVal: 0, valAxisMaxVal: 20, valAxisMajorUnit: 5 }));
    s.addChart(pres.charts.LINE, [{ name: "Sent home / day", labels: ["4", "5", "6", "7", "8", "9", "10", "11", "12"], values: [28.1, 24.7, 7.1, 4.5, 4.3, 3.9, 4.3, 3.6, 4.2] }],
      Object.assign({}, AX, { x: 6.85, y: 1.95, w: 5.85, h: 3.3, chartColors: [H.orange], lineSize: 3, lineDataSymbol: "circle", lineDataSymbolSize: 9, showLegend: false,
        showTitle: true, title: "More nurses → fewer sent home, up to 7–8", showCatAxisTitle: true, catAxisTitle: "number of nurses",
        showValAxisTitle: true, valAxisTitle: "sent home / day", valAxisMinVal: 0, valAxisMaxVal: 30, valAxisMajorUnit: 10 }));
    s.addText([{ text: "0% → 60% pre-cleared: ", options: { bold: true } }, { text: "sent home 15.6 → 6.0 a day. Chair use barely moves (51%).", options: { color: H.muted } }], T({ x: 0.6, y: 5.32, w: 6.0, h: 0.5, fontSize: 13 }));
    s.addText([{ text: "Below 6 nurses the unit breaks; ", options: { bold: true } }, { text: "above 8 extra nurses change almost nothing.", options: { color: H.muted } }], T({ x: 6.85, y: 5.32, w: 5.85, h: 0.5, fontSize: 13 }));
    take(s, "Best change the unit controls: pre-clear 60% + 7 nurses → 2.9 sent home a day.", 5.9);
    s.addText("Also tested: reserved chairs and standby patients matter little once the pharmacy has 4 hoods (best: 3 reserved, 5 standby). Robustness: the conclusions hold when every input is halved or doubled.",
      T({ x: 0.6, y: 6.62, w: 12.1, h: 0.35, fontSize: 11, italic: true, color: H.muted }));
  }

  // ============================================================ 9 PHARMACY
  {
    const s = slide("Content", "Results", "RESULT 3 · BOTTLENECK", "The hidden bottleneck is the pharmacy", "Found while checking why the cycle rule failed");
    const hood = (x, title, pct, home, good) => {
      card(s, x, 1.95, 3.0, 3.1, good ? H.dark : H.panel);
      s.addText(title, T({ x: x + 0.3, y: 2.12, w: 2.4, h: 0.4, fontFace: "Cambria", fontSize: 20, bold: true, color: good ? "FFFFFF" : H.ink }));
      s.addText(pct, T({ x: x + 0.3, y: 2.6, w: 2.5, h: 0.8, fontFace: "Cambria", fontSize: 46, bold: true, color: good ? H.mint : H.orange }));
      s.addText("of missed cycles given in 3 days", T({ x: x + 0.3, y: 3.42, w: 2.5, h: 0.35, fontSize: 12.5, color: good ? H.onDark : H.muted }));
      s.addText(home, T({ x: x + 0.3, y: 3.9, w: 2.5, h: 0.65, fontFace: "Cambria", fontSize: 34, bold: true, color: good ? "FFFFFF" : H.ink }));
      s.addText("sent home a day", T({ x: x + 0.3, y: 4.55, w: 2.5, h: 0.35, fontSize: 12.5, color: good ? H.onDark : H.muted }));
    };
    hood(0.6, "3 hoods", "12%", "38", false);
    shape(s, pres.shapes.RIGHT_ARROW, { x: 3.72, y: 3.3, w: 0.36, h: 0.4, fill: { color: "B8C5C1" } }, "arrow");
    hood(4.2, "4 hoods", "99.6%", "7", true);
    dot(s, "pharm", 7.6, 1.95, 0.5, C.accent2);
    s.addText("Why", T({ x: 8.25, y: 2.03, w: 3, h: 0.35, fontFace: "Cambria", fontSize: 19, bold: true }));
    s.addText([
      { text: "~50 drugs a day × ~40 min = 2,000 hood-minutes; 3 hoods give only 1,800", options: { bullet: true, breakLine: true } },
      { text: "Urgent patients waited ~4 h 30 m at the pharmacy, missed the close, were sent home again", options: { bullet: true, breakLine: true } },
      { text: "Reserved chairs (best 16%) and extra nurses did not fix it; one more hood did", options: { bullet: true, breakLine: true } },
      { text: "20 missed cycles traced end to end: the rebooking logic is correct", options: { bullet: true } },
    ], T({ x: 7.6, y: 2.6, w: 5.1, h: 2.5, fontSize: 13.5, paraSpaceAfter: 6 }));
    card(s, 0.6, 5.2, 12.1, 0.8);
    s.addText([{ text: "Why chair use stays near 51%   ", options: { bold: true, color: H.teal } }, { text: "Demand, not the schedule: 8 new patients a day fill only 6,120 of 12,000 chair-minutes. Idle time is mostly mornings, while same-day patients are still in lab. For 85% use the unit needs ~13 new patients a day, then a 3rd doctor and a 5th hood.", options: {} }],
      T({ x: 0.85, y: 5.22, w: 11.65, h: 0.76, fontSize: 12, valign: "middle" }));
    take(s, "One extra pharmacy hood matters more than extra chairs, nurses or reserved slots.", 6.15);
  }

  // ============================================================ 10 CHAIR TIME
  {
    const s = slide("Content", "Results", "RESULT 4 · CHAIR TIME", "Where the chair time goes", "One day: 20 chairs × 10 h = 12,000 chair-minutes · base case, mean of 120 days");
    const segs = [[51, "Used for treatment", "6,120 min", H.teal], [34, "Patient here, not ready yet", "4,096 min", H.orange], [10, "Nobody left to seat", "", H.grey], [5, "No free nurse", "", H.amber]];
    let x = 0.6; const W = 12.1;
    segs.forEach(([p, lab, mins, col], i) => {
      const w = W * p / 100;
      shape(s, pres.shapes.RECTANGLE, { x, y: 2.0, w: w - 0.04, h: 1.15, fill: { color: col } }, "seg");
      s.addText(`${p}%`, T({ x: x + 0.15, y: 2.1, w: Math.max(w - 0.25, 0.5), h: 0.55, fontFace: "Cambria", fontSize: i < 2 ? 30 : 18, bold: true, color: "FFFFFF" }));
      if (mins) s.addText(mins, T({ x: x + 0.15, y: 2.68, w: w - 0.3, h: 0.35, fontSize: 13, color: "FFFFFF" }));
      if (i < 2) s.addText(lab, T({ x, y: 3.25, w: w - 0.1, h: 0.3, fontSize: 12.5, bold: true, color: H.ink }));
      else s.addText(lab, T({ x: x + w - 2.4, y: 3.25 + (i === 3 ? 0.32 : 0), w: 2.4 - (i === 2 ? 0.04 : 0), h: 0.3, fontSize: 12.5, bold: true, color: H.ink, align: "right" }));
      x += w;
    });
    const cards = [["Not ready yet: 34%", "Mostly mornings, while same-day patients are still in lab (~3 h), doctor and pharmacy.", "Fix: pre-clear patients the day before; faster lab results", true],
      ["Nobody left to seat: 10%", "8 new patients a day is not enough to fill 20 chairs.", "Fix: more patients (≈13 a day for 85% use), or fewer chairs", false],
      ["No free nurse: 5%", "A chair is free and a patient ready, but every nurse is busy setting up.", "Fix: 7 nurses instead of 6", false]];
    cards.forEach(([h, b, f, hot], i) => {
      const cx = 0.6 + i * 4.1;
      card(s, cx, 4.0, 3.85, 1.95, hot ? H.orangeSoft : H.panel);
      s.addText(h, T({ x: cx + 0.25, y: 4.15, w: 3.4, h: 0.35, fontSize: 15, bold: true, color: hot ? H.orange : H.ink }));
      s.addText(b, T({ x: cx + 0.25, y: 4.55, w: 3.4, h: 0.75, fontSize: 12.5, color: H.muted }));
      s.addText(f, T({ x: cx + 0.25, y: 5.3, w: 3.4, h: 0.55, fontSize: 12.5, bold: true, color: H.teal }));
    });
    take(s, "Chairs mostly wait for patients to become ready. Getting patients ready earlier is the biggest lever.", 6.15);
  }

  // ============================================================ 11 DEMO
  {
    const s = slide("Content", "Results", "LIVE DEMO", "The simulator", "Every day the model plays out, minute by minute, in the browser");
    card(s, 0.6, 1.95, 8.15, 4.05, H.panel);
    const img = fs.readFileSync(path.join(__dirname, "simulator_screenshot.png"));
    s.addImage({ data: "image/png;base64," + img.toString("base64"), x: 0.8, y: 2.12, w: 7.75, h: 7.75 * 752 / 1542, objectName: "screenshot" });
    const cards = [["play", "Live day", "Clock, chair use, doctor use, sent home; station queues; 20 chair tiles that fill as the drip runs; doctor and nurse chips"],
      ["chart", "Experiments", "All six experiments, each with one chart and a one-line answer"],
      ["flask", "Model", "Flow, closing rule, every input with its source; Python and website give identical numbers"]];
    cards.forEach(([ic, h, b], i) => {
      const y = 1.95 + i * 1.38;
      card(s, 9.0, y, 3.7, 1.25);
      dot(s, ic, 9.2, y + 0.18, 0.45);
      s.addText(h, T({ x: 9.8, y: y + 0.2, w: 2.8, h: 0.35, fontSize: 15, bold: true }));
      s.addText(b, T({ x: 9.2, y: y + 0.68, w: 3.35, h: 0.55, fontSize: 11, color: H.muted }));
    });
    card(s, 0.6, 6.15, 12.1, 0.68, H.dark, "url");
    dot(s, "web", 0.8, 6.27, 0.44, C.accent1);
    s.addText([{ text: "https://ie301-infucinq.iitbresume.workers.dev/", options: { hyperlink: { url: "https://ie301-infucinq.iitbresume.workers.dev/" }, color: "FFFFFF" } }],
      T({ x: 1.45, y: 6.15, w: 11.0, h: 0.68, fontSize: 17, bold: true, valign: "middle" }));
  }

  // ============================================================ 12 RECAP
  pres.addSection({ title: "Close" });
  {
    const s = slide("Dark", "Close", "WHAT WE FOUND", "Four answers from 120 simulated days");
    const k = [["+9 pts", "chair use, and ~22 fewer sent home a day, by telling each patient a time based on their own readiness"],
      ["2.9", "sent home a day with 60% pre-cleared and 7 nurses: the best change the unit controls"],
      ["12% → 99.6%", "missed cycles given within 3 days, from one extra pharmacy hood"],
      ["34%", "of chair time is lost to patients who are here but not ready: the biggest lever"]];
    k.forEach(([b, l], i) => {
      const x = 0.6 + (i % 2) * 6.15, y = 1.8 + Math.floor(i / 2) * 2.35;
      card(s, x, y, 5.95, 2.1, H.chip);
      s.addText(b, T({ x: x + 0.35, y: y + 0.25, w: 5.3, h: 0.85, fontFace: "Cambria", fontSize: 40, bold: true, color: i === 2 ? H.peach : H.mint }));
      s.addText(l, T({ x: x + 0.35, y: y + 1.15, w: 5.3, h: 0.85, fontSize: 15, color: "FFFFFF" }));
    });
  }

  // ============================================================ 13 THANK YOU
  {
    const s = slide("Cover", "Close");
    s.addText("TEAM INFUCINQ · IE301 OPERATIONS ANALYSIS · TOPIC 1", { placeholder: "kicker" });
    s.addText("Thank you", { placeholder: "title" });
    s.addText("Questions", T({ x: 0.8, y: 2.85, w: 6, h: 0.6, fontSize: 26, color: H.mint }));
    s.addText("Parav · Sahasra · Siddhesh · Vaibhav · Kartikya", { placeholder: "team" });
  }

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
