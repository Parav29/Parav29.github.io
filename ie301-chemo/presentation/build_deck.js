// Final presentation deck: IE301 Topic 1, Team INFUCINQ
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const md = require("react-icons/md");
const { applyTheme } = require("/root/.claude/skills/synced/40e305a6-4612-4756-b9a2-5a1a1573d8bc_b6812a72-6a19-4f8a-81fd-e2023f3fdbf0/pptx/scripts/apply_theme.js");

const THEME = {
  name: "INFUCINQ Clinic",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1C2A30", lt1: "FFFFFF", dk2: "12302D", lt2: "EEF3F1",
    accent1: "0F766E", accent2: "EB6834", accent3: "2A78D6", accent4: "EDA100", accent5: "6250D6", accent6: "1BAF7A",
    hlink: "0F766E", folHlink: "6250D6",
  },
};
const HX = { ink: "1C2A30", muted: "5E6E73", line: "D6DEDB", teal: "0F766E", tealDark: "12302D", tealSoft: "DCEEEA",
  orange: "EB6834", blue: "2A78D6", amber: "EDA100", grey: "8C9A97", panel: "EEF3F1", white: "FFFFFF", mint: "7FD1C7" };
const OUT = process.argv[2] || "INFUCINQ_Final_Presentation.pptx";

async function icon(Comp, color = "FFFFFF") {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: "#" + color, size: 256 }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
  pres.title = "Two times per patient";
  pres.author = "Team INFUCINQ";
  pres.company = "IE301 Operations Analysis";
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;

  // ---------------- layouts ----------------
  const footer = (dark) => [
    { text: { text: "IE301 Operations Analysis · Topic 1 · Team INFUCINQ", options: { x: 0.6, y: 7.0, w: 7, h: 0.3, fontSize: 10, color: dark ? "9FC9C3" : HX.muted, margin: 0 } } },
  ];
  pres.defineSlideMaster({
    title: "INFUCINQ Title", background: { color: THEME.colors.dk2 },
    objects: [
      { placeholder: { options: { name: "kicker", type: "body", x: 0.8, y: 1.0, w: 7.2, h: 0.4, fontSize: 14, color: "9FC9C3", bold: true, charSpacing: 2 }, text: "" } },
      { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 1.55, w: 7.4, h: 1.9, fontFace: "Cambria", fontSize: 54, bold: true, color: "FFFFFF", valign: "top", align: "left" }, text: "" } },
      { placeholder: { options: { name: "subtitle", type: "body", x: 0.8, y: 3.55, w: 7.0, h: 1.1, fontSize: 22, color: "D7EAE6", valign: "top" }, text: "" } },
      { placeholder: { options: { name: "team", type: "body", x: 0.8, y: 5.9, w: 7.4, h: 0.8, fontSize: 14, color: "9FC9C3", valign: "top" }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "INFUCINQ Content", background: { color: "FFFFFF" },
    margin: [0.5, 0.6, 0.6, 0.6],
    objects: [
      { placeholder: { options: { name: "kicker", type: "body", x: 0.6, y: 0.38, w: 9, h: 0.3, fontSize: 12, color: THEME.colors.accent1, bold: true, charSpacing: 2, margin: 0 }, text: "" } },
      { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.7, w: 12.1, h: 0.85, fontFace: "Cambria", fontSize: 34, bold: true, color: THEME.colors.dk1, valign: "top", margin: 0, align: "left" }, text: "" } },
      ...footer(false),
    ],
    slideNumber: { x: 12.2, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: HX.muted, align: "right" },
  });
  pres.defineSlideMaster({
    title: "INFUCINQ Dark", background: { color: THEME.colors.dk2 },
    objects: [
      { placeholder: { options: { name: "kicker", type: "body", x: 0.6, y: 0.38, w: 9, h: 0.3, fontSize: 12, color: "9FC9C3", bold: true, charSpacing: 2, margin: 0 }, text: "" } },
      { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.7, w: 12.1, h: 0.85, fontFace: "Cambria", fontSize: 34, bold: true, color: "FFFFFF", valign: "top", margin: 0, align: "left" }, text: "" } },
      ...footer(true),
    ],
    slideNumber: { x: 12.2, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: "9FC9C3", align: "right" },
  });

  // ---------------- helpers ----------------
  const I = {};
  for (const [k, comp, col] of [
    ["clock", md.MdAccessTime], ["chair", md.MdEventSeat], ["phone", md.MdPhoneInTalk], ["lab", md.MdScience],
    ["calendar", md.MdEventAvailable], ["queue", md.MdPeopleAlt], ["med", md.MdMedication], ["data", md.MdDataset],
    ["sim", md.MdTimeline], ["math", md.MdFunctions], ["check", md.MdCheckCircle], ["warn", md.MdWarningAmber],
    ["insight", md.MdInsights], ["hospital", md.MdLocalHospital], ["nurse", md.MdMedicalServices], ["flag", md.MdFlag],
    ["search", md.MdSearch], ["speed", md.MdSpeed],
  ]) I[k] = await icon(comp);

  let n = 0;
  const T = (o) => Object.assign({ isTextBox: true, margin: 0, fontFace: "Calibri", color: HX.ink, valign: "top" }, o);
  const circleIcon = (s, key, x, y, d, fill = C.accent1) => {
    n++; s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" }, objectName: "iconbg" + n });
    s.addImage({ data: I[key], x: x + d * 0.22, y: y + d * 0.22, w: d * 0.56, h: d * 0.56, objectName: "icon" + n });
  };
  const card = (s, x, y, w, h, fill = HX.panel, name = "card") => {
    n++; s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: fill }, line: { type: "none" }, objectName: name + n });
  };
  const stat = (s, x, y, w, big, label, color = HX.teal, bigSize = 40, labelSize = 14, labelColor = HX.muted) => {
    s.addText(big, T({ x, y, w, h: bigSize / 60, fontFace: "Cambria", fontSize: bigSize, bold: true, color }));
    s.addText(label, T({ x, y: y + bigSize / 60 + 0.05, w, h: 0.75, fontSize: labelSize, color: labelColor }));
  };
  const slide = (layout, section, kicker, title) => {
    const s = pres.addSlide({ masterName: layout, sectionTitle: section });
    if (kicker) s.addText(kicker, { placeholder: "kicker" });
    if (title) s.addText(title, { placeholder: "title" });
    return s;
  };
  const AX = { catAxisLabelColor: HX.muted, valAxisLabelColor: HX.muted, catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt",
    catAxisLabelFontSize: 12, valAxisLabelFontSize: 11, valGridLine: { color: "E3E8E6", size: 0.75 }, catGridLine: { style: "none" },
    catAxisLineShow: false, valAxisLineShow: false, dataLabelFontFace: "+mn-lt", dataLabelFontSize: 12, titleFontFace: "+mn-lt",
    titleFontSize: 14, titleColor: HX.ink, legendFontFace: "+mn-lt", legendFontSize: 12, legendColor: HX.ink };

  // =========================================================== 1 TITLE
  pres.addSection({ title: "Opening" });
  {
    const s = slide("INFUCINQ Title", "Opening");
    s.addText("IE301 · TOPIC 1 · FINAL PRESENTATION", { placeholder: "kicker" });
    s.addText("Two times per patient", { placeholder: "title" });
    s.addText("Cutting waiting and overtime in an Indian day-care chemotherapy unit", { placeholder: "subtitle" });
    s.addText("Team INFUCINQ\nParav · Sahasra · Siddhesh · Vaibhav · Kartikya", { placeholder: "team" });
    // stat chips on the right
    const chips = [["316 → 157 min", "mean wait before the drip", HX.mint], ["127 → 10 min", "overtime after closing, per day", "F6A57F"], ["0", "extra chairs, nurses or doctors needed", "FFFFFF"]];
    chips.forEach(([b, l, c], i) => {
      const y = 1.25 + i * 1.75;
      n++; s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.75, y, w: 3.95, h: 1.45, rectRadius: 0.14, fill: { color: "1C4541" }, line: { type: "none" }, objectName: "chip" + n });
      s.addText(b, T({ x: 9.05, y: y + 0.2, w: 3.5, h: 0.65, fontFace: "Cambria", fontSize: 32, bold: true, color: c }));
      s.addText(l, T({ x: 9.05, y: y + 0.88, w: 3.5, h: 0.4, fontSize: 14, color: "D7EAE6" }));
    });
    s.addNotes("Good morning. Over this project we studied one question: why do chemotherapy patients in Indian day-care units wait three to four hours before their drip even starts, and what can the unit do about it without buying anything. The three numbers on the right are where we end up: mean wait halves from 316 to 157 minutes, overtime falls from over two hours to ten minutes a day, and none of it needs a new chair or a new nurse. The rest of the talk shows how we got there: the problem, our proposal, the data and simulation, the formulation, and the results.");
  }

  // =========================================================== 2 PROBLEM: FLOW
  pres.addSection({ title: "The problem" });
  {
    const s = slide("INFUCINQ Content", "The problem", "THE PROBLEM", "Patients wait 3–4 hours before the drip starts");
    const steps = [["Registration", "5–15 min"], ["Blood draw", "5–10 min"], ["Lab result", "60–120 min"], ["Doctor review", "10–20 min"], ["Billing", "30–60 min"],
      ["Drug prepared", "15–30 min"], ["Wait for chair", "20–60 min"], ["IV line, pre-meds", "20–40 min"], ["Infusion", "30 min – 6 h"], ["Discharge", "15–30 min"]];
    const x0 = 0.6, y0 = 1.95, cw = 1.42, ch = 1.35, gx = 0.12, gy = 0.25;
    steps.forEach(([name, t], i) => {
      const r = Math.floor(i / 5), c = i % 5, x = x0 + c * (cw + gx), y = y0 + r * (ch + gy);
      const sameDay = i >= 1 && i <= 3;
      n++; s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h: ch, rectRadius: 0.1, fill: { color: sameDay ? "FDEBE2" : HX.panel }, line: sameDay ? { color: HX.orange, width: 1.25 } : { type: "none" }, objectName: "step" + n });
      s.addText(String(i + 1), T({ x: x + 0.14, y: y + 0.12, w: 0.5, h: 0.32, fontFace: "Cambria", fontSize: 18, bold: true, color: sameDay ? HX.orange : HX.teal }));
      s.addText(name, T({ x: x + 0.14, y: y + 0.45, w: cw - 0.2, h: 0.5, fontSize: 13.5, bold: true }));
      s.addText(t, T({ x: x + 0.14, y: y + 1.0, w: cw - 0.24, h: 0.28, fontSize: 12, color: HX.muted }));
    });
    s.addText([{ text: "Orange steps", options: { bold: true, color: HX.orange } }, { text: " are done the same morning by most Indian patients, and the drug cannot be mixed until the doctor clears the blood counts. Flow confirmed by oncologists at Tata Memorial, 1 Oct 2026.", options: { color: HX.muted } }],
      T({ x: 0.6, y: 5.05, w: 7.4, h: 0.75, fontSize: 13 }));
    // right stats
    card(s, 8.55, 1.95, 4.15, 4.6, HX.panel);
    stat(s, 8.85, 2.15, 3.7, "3.5 h", "mean wait before chemo at Amrita, Kochi (1,029 patients)", HX.orange, 40);
    stat(s, 8.85, 3.6, 3.7, "300–400", "patients a day on 70–80 chairs at Tata Memorial", HX.teal, 40);
    stat(s, 8.85, 5.05, 3.7, "5 h 40", "average time in the unit at an Indian centre", HX.teal, 40);
    s.addNotes("This is the ten-step flow we presented earlier and that the oncologists at Tata Memorial confirmed during our visit. The key point is the orange block. Most patients do their blood test, wait for the lab, and see the doctor on the same morning, and the pharmacy cannot mix the drug until the doctor clears the counts. So three to four hours pass before the drip starts. Pavithran and colleagues measured a 3.5-hour baseline wait at Amrita in Kochi; an Indian single-centre study measured 5 hours 40 minutes in the unit. At Tata Memorial the scale is 300 to 400 patients a day on 70 to 80 chairs.");
  }

  // =========================================================== 3 ROOT CAUSE
  {
    const s = slide("INFUCINQ Content", "The problem", "THE PROBLEM", "The binding constraint is ready time, not chairs");
    card(s, 0.6, 1.95, 5.0, 4.6, HX.tealDark);
    s.addText("37%", T({ x: 0.95, y: 2.2, w: 4.4, h: 1.3, fontFace: "Cambria", fontSize: 88, bold: true, color: HX.mint }));
    s.addText("of chair-hours sit empty while the patient is already in the unit but not yet ready", T({ x: 0.95, y: 3.6, w: 4.3, h: 1.0, fontSize: 18, color: "FFFFFF" }));
    s.addText("Simulated, everyone told 08:00, 30% pre-cleared. Presentation 3 predicted 35% from the stage times alone.", T({ x: 0.95, y: 5.15, w: 4.3, h: 0.9, fontSize: 13, color: "9FC9C3" }));
    // reasoning
    s.addText("Why", T({ x: 6.1, y: 1.95, w: 6.5, h: 0.4, fontFace: "Cambria", fontSize: 20, bold: true }));
    s.addText([
      { text: "A same-day patient told 08:00 is ready for a chair only at about 11:10: registration, blood, 90 min lab, review, billing and drug.", options: { bullet: true, breakLine: true } },
      { text: "Until then only pre-cleared patients can use the chairs, so mornings are empty and afternoons run late.", options: { bullet: true, breakLine: true } },
      { text: "Calling everyone at 08:00 adds a crowd: 88 min queue at registration alone.", options: { bullet: true } },
    ], T({ x: 6.1, y: 2.4, w: 6.6, h: 1.9, fontSize: 15, paraSpaceAfter: 6 }));
    s.addText("What the literature leaves open", T({ x: 6.1, y: 4.35, w: 6.5, h: 0.4, fontFace: "Cambria", fontSize: 20, bold: true }));
    const gaps = [["Hesaraki 2019, 2020", "chair and nurse template; ready time known in advance"], ["Liang 2015", "optimise the schedule, then stress-test it in simulation"], ["Hadid 2022", "every stage random; 13 h to optimise 246 appointments"]];
    gaps.forEach(([a, b], i) => {
      s.addText([{ text: a + "  ", options: { bold: true, color: HX.teal } }, { text: b, options: { color: HX.ink } }], T({ x: 6.1, y: 4.85 + i * 0.42, w: 6.6, h: 0.4, fontSize: 14 }));
    });
    s.addText("Open: setting the appointment from an uncertain ready time, and varying how many patients are pre-cleared.", T({ x: 6.1, y: 6.15, w: 6.6, h: 0.5, fontSize: 14, bold: true, color: HX.orange }));
    s.addNotes("The real constraint is not chairs, it is ready time. In our simulation, 37 percent of chair-hours are wasted while the patient is already in the building but not yet cleared; our Presentation 3 calculation predicted 35 percent from the stage times alone, so the two agree. A same-day patient told to come at eight cannot be ready before about eleven. The published models give us the pieces: Hesaraki's chair and nurse template, Liang's optimise-then-simulate structure, Hadid's fully random stages. What none of them does is set the appointment from an uncertain ready time, or ask how many patients should be cleared the day before. That is our contribution.");
  }

  // =========================================================== 4 CORE IDEA
  pres.addSection({ title: "Our proposal" });
  {
    const s = slide("INFUCINQ Content", "Our proposal", "OUR PROPOSAL", "Give every patient two times: arrival and chair");
    const X0 = 1.75, PX = 7.0 / 300; // 08:00 .. 13:00 over 7.0 in
    const xt = (m) => X0 + m * PX;
    for (let h = 0; h <= 5; h++) {
      s.addText(`${8 + h}:00`, T({ x: xt(h * 60) - 0.4, y: 1.95, w: 0.8, h: 0.3, fontSize: 12, color: HX.muted, align: "center" }));
      n++; s.addShape(pres.shapes.LINE, { x: xt(h * 60), y: 2.3, w: 0, h: 3.0, line: { color: "E3E8E6", width: 0.75 }, objectName: "grid" + n });
    }
    const rows = [
      { y: 2.55, name: "Pre-cleared", sub: "bloods done the day before", col: HX.blue, soft: "D6E6F8", ready: 77.5, slot: 90, steps: "reg. · billing · drug" },
      { y: 4.05, name: "Same-day", sub: "blood test this morning", col: HX.orange, soft: "FCE1D4", ready: 190, slot: 210, steps: "registration · blood · lab · review · billing · drug" },
    ];
    for (const r of rows) {
      s.addText(r.name, T({ x: 0.6, y: r.y + 0.05, w: 1.1, h: 0.35, fontSize: 15, bold: true, color: r.col }));
      s.addText(r.sub, T({ x: 0.6, y: r.y + 0.4, w: 1.1, h: 0.6, fontSize: 11, color: HX.muted }));
      n++; s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: xt(0), y: r.y, w: r.ready * PX, h: 0.55, rectRadius: 0.06, fill: { color: r.soft }, line: { type: "none" }, objectName: "pre" + n });
      s.addText(r.steps, T({ x: xt(0) + 0.1, y: r.y + 0.14, w: r.ready * PX - 0.2, h: 0.3, fontSize: 11.5, color: HX.ink }));
      n++; s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: xt(r.slot), y: r.y, w: xt(300) - xt(r.slot), h: 0.55, rectRadius: 0.06, fill: { color: r.col }, line: { type: "none" }, objectName: "chairbar" + n });
      s.addText("in the chair", T({ x: xt(r.slot) + 0.12, y: r.y + 0.14, w: 1.6, h: 0.3, fontSize: 12, bold: true, color: "FFFFFF" }));
      // markers
      n++; s.addShape(pres.shapes.OVAL, { x: xt(0) - 0.09, y: r.y + 0.65, w: 0.18, h: 0.18, fill: { color: HX.ink }, line: { type: "none" }, objectName: "told" + n });
      s.addText("told 08:00", T({ x: xt(0) - 0.1, y: r.y + 0.88, w: 1.2, h: 0.3, fontSize: 11.5, color: HX.ink }));
      const hm = (m) => `${8 + Math.floor(m / 60)}:${String(Math.round(m % 60)).padStart(2, "0")}`;
      s.addText(`ready ≈ ${hm(r.ready)}`, T({ x: xt(r.ready) - 1.1, y: r.y + 0.88, w: 1.05, h: 0.3, fontSize: 11.5, color: HX.muted, align: "right" }));
      s.addText(`chair ${hm(r.slot)}`, T({ x: xt(r.slot) + 0.05, y: r.y + 0.88, w: 1.4, h: 0.3, fontSize: 11.5, bold: true, color: r.col }));
    }
    // right card
    card(s, 9.2, 1.95, 3.5, 4.65, HX.tealDark);
    s.addText("The rule", T({ x: 9.5, y: 2.2, w: 3.0, h: 0.4, fontFace: "Cambria", fontSize: 20, bold: true, color: "FFFFFF" }));
    s.addText("chair slot = arrival + B", T({ x: 9.5, y: 2.75, w: 3.0, h: 0.45, fontFace: "Cambria", fontSize: 19, italic: true, color: HX.mint }));
    s.addText("B covers 80% of patients of that class, so 4 in 5 are ready in time.", T({ x: 9.5, y: 3.3, w: 2.95, h: 0.9, fontSize: 14, color: "D7EAE6" }));
    stat(s, 9.5, 4.3, 3.0, "90 min", "pre-cleared buffer (89.9 min)", HX.mint, 30, 13, "D7EAE6");
    stat(s, 9.5, 5.4, 3.0, "210 min", "same-day buffer (206.2 min)", "F6A57F", 30, 13, "D7EAE6");
    s.addText("Bars show average times from our Presentation 3 inputs. Booking a same-day patient's chair at 08:30 would leave it empty for about 2 h 40.", T({ x: 0.6, y: 5.75, w: 8.3, h: 0.6, fontSize: 12.5, color: HX.muted }));
    s.addNotes("Our proposal is simple to explain to a patient. Today they get one time. We give two: the time to arrive, and the time their chair is booked. Both patients here are told to come at eight. The pre-cleared patient only needs registration, billing and the drug, and is ready around 9:18, so their chair is booked for 9:30. The same-day patient still needs the blood test, lab and review, and is ready around 11:10, so their chair is booked for 11:30. The gap B is chosen so 80 percent of patients of that class are ready in time: 90 minutes for pre-cleared, 210 for same-day. These are exactly the 89.9 and 206.2 minutes we computed in Presentation 3.");
  }

  // =========================================================== 5 SOLUTION PACKAGE
  {
    const s = slide("INFUCINQ Content", "Our proposal", "OUR PROPOSAL", "Three changes, no new chairs or staff");
    const cards = [
      ["calendar", "Two-time booking", "An integer programme sets every chair slot inside the chair and nurse limits; arrival = slot − B.", "Overtime 127 → 37 min", "E1"],
      ["phone", "Pre-clear 60% the day before", "Phone triage and outside labs, as Kochi did; their drugs are prepared before opening.", "Overtime 37 → 10 min", "E3, E5"],
      ["queue", "Cap arrivals per 15 min", "Never send more patients than registration (3) and the doctors (2) can see in 15 minutes.", "Front-desk queues halved", "E7"],
    ];
    cards.forEach(([ic, h, body, res, ex], i) => {
      const x = 0.6 + i * 4.1, y = 1.95, w = 3.85;
      card(s, x, y, w, 4.55, HX.panel);
      circleIcon(s, ic, x + 0.35, y + 0.35, 0.8);
      s.addText(`${i + 1}`, T({ x: x + w - 0.75, y: y + 0.3, w: 0.45, h: 0.6, fontFace: "Cambria", fontSize: 30, bold: true, color: "C6D3CF", align: "right" }));
      s.addText(h, T({ x: x + 0.35, y: y + 1.35, w: w - 0.7, h: 0.8, fontFace: "Cambria", fontSize: 21, bold: true }));
      s.addText(body, T({ x: x + 0.35, y: y + 2.15, w: w - 0.7, h: 1.3, fontSize: 15, color: HX.muted }));
      n++; s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.35, y: y + 3.55, w: w - 0.7, h: 0.7, rectRadius: 0.08, fill: { color: "FFFFFF" }, line: { type: "none" }, objectName: "res" + n });
      s.addText([{ text: res, options: { bold: true, color: HX.teal } }, { text: `   ${ex}`, options: { color: HX.muted, fontSize: 11 } }], T({ x: x + 0.5, y: y + 3.55, w: w - 0.95, h: 0.7, fontSize: 15, valign: "middle" }));
    });
    s.addNotes("The full proposal has three parts, and none of them needs new capacity. First, two-time booking, with the chair slots set by an integer programme so that chairs and nurses are never over-booked. Second, pre-clear about 60 percent of patients the day before by phone triage and outside labs, which is what Amrita in Kochi did, and prepare their drugs before opening. Third, cap how many patients we tell to arrive in each 15 minutes, so registration and the doctors are never swamped. The green line in each card is the measured effect, which I will show in the results.");
  }

  // =========================================================== 6 DATASET
  pres.addSection({ title: "Data and simulation" });
  {
    const s = slide("INFUCINQ Content", "Data and simulation", "DATA", "No public data exists, so we built a calibrated dataset");
    const st = [["5,007", "patients"], ["100", "simulated days"], ["22", "inputs, each with a source"], ["23 / 23", "data checks passed"]];
    st.forEach(([b, l], i) => { card(s, 0.6, 1.95 + i * 1.17, 3.3, 1.02, HX.panel); s.addText(b, T({ x: 0.85, y: 2.05 + i * 1.17, w: 2.9, h: 0.5, fontFace: "Cambria", fontSize: 28, bold: true, color: HX.teal })); s.addText(l, T({ x: 0.85, y: 2.55 + i * 1.17, w: 2.9, h: 0.35, fontSize: 13, color: HX.muted })); });
    const head = ["Input", "Value used", "Source"].map(t => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: HX.tealDark } } }));
    const rows = [
      ["Registration · doctor review", "Tri(5, 10, 15) · Tri(10, 15, 20) min", "Presentation 3; TMH visit"],
      ["Blood draw + lab result", "Tri(5, 7.5, 10) + Tri(60, 90, 120) min", "Presentation 3; TMH 4 h tested"],
      ["Billing · drug preparation", "Tri(30, 45, 60) · Tri(15, 22.5, 30) min", "Presentation 3; EJHP 2017"],
      ["Line and pre-meds (1 nurse)", "Tri(20, 30, 40) min", "Hesaraki et al. 2019"],
      ["Infusion length mix", "30 min 45% · 2 h 18% · 3 h 18% · 4 h 11%", "Clinic day, n = 55; Liang 2015"],
      ["Actual vs planned infusion", "short +17%, long −6%", "Hacettepe study, Bath, Mayo"],
      ["Unfit at review · no-show", "8% · 5%", "NCT00883181 · assumed"],
      ["Arrival vs told time", "Tri(−30, 0, 30) min", "Presentation 3 placeholder"],
    ].map((r, i) => r.map(t => ({ text: t, options: { fill: { color: i % 2 ? "FFFFFF" : "F5F8F7" } } })));
    s.addTable([head, ...rows], { x: 4.25, y: 1.95, w: 8.45, colW: [2.55, 3.45, 2.45], fontFace: "Calibri", fontSize: 12.5, color: HX.ink, border: { type: "solid", color: "E3E8E6", pt: 0.75 }, rowH: 0.42, valign: "middle", margin: [0.04, 0.1, 0.04, 0.1] });
    s.addText("Kaggle and the literature hold no per-patient infusion-unit timestamps. Every stage is drawn per patient from a fixed seed, so every rule is tested on the same 100 days. Our buffers reproduce Presentation 3 exactly: 89.9 and 206.2 min.", T({ x: 4.25, y: 6.1, w: 8.45, h: 0.6, fontSize: 12.5, color: HX.muted }));
    s.addNotes("We searched Kaggle and the literature for per-patient timestamps from an infusion unit and found none; the closest datasets are general appointment no-show data. So we built a synthetic dataset where every input carries a source. Stage times are the ranges from Presentation 3, which the TMH doctors agreed with. The infusion mix comes from a real clinic day of 55 patients, and Liang's paper reports the same 45 percent of short infusions. 5,007 patients over 100 days, all 23 statistical checks pass, and the dataset reproduces our Presentation 3 buffers exactly. Every row can be swapped for Tata Memorial data when it arrives.");
  }

  // =========================================================== 7 SIMULATION
  {
    const s = slide("INFUCINQ Content", "Data and simulation", "SIMULATION", "A discrete-event simulation of the 10-step flow");
    const boxes = [["Registration", "2 desks", HX.panel], ["Blood · lab · review", "same-day only · 2 doctors", "FDEBE2"], ["Billing", "approval delay", HX.panel], ["Pharmacy", "3 hoods", HX.panel], ["Chair + nurse", "20 chairs · 8 nurses", "D9EEEA"], ["Infusion → home", "1 nurse watches 4", HX.panel]];
    boxes.forEach(([a, b, f], i) => {
      const x = 0.6 + (i % 3) * 2.75, y = 1.95 + Math.floor(i / 3) * 1.45;
      n++; s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 2.45, h: 1.1, rectRadius: 0.1, fill: { color: f }, line: { type: "none" }, objectName: "sb" + n });
      s.addText(a, T({ x: x + 0.18, y: y + 0.18, w: 2.1, h: 0.4, fontSize: 15, bold: true }));
      s.addText(b, T({ x: x + 0.18, y: y + 0.6, w: 2.1, h: 0.35, fontSize: 12.5, color: HX.muted }));
      if (i % 3 !== 2) { n++; s.addShape(pres.shapes.RIGHT_ARROW, { x: x + 2.5, y: y + 0.42, w: 0.2, h: 0.26, fill: { color: "B8C5C1" }, line: { type: "none" }, objectName: "ar" + n }); }
    });
    s.addText([
      { text: "Nurse rule (Hesaraki 2019): ", options: { bold: true } },
      { text: "4 × (setups + takedowns) + patients on the drip ≤ 4 × nurses, at every minute.", options: {} },
    ], T({ x: 0.6, y: 4.95, w: 8.0, h: 0.4, fontSize: 14 }));
    s.addText("Built three ways: Python SimPy (all results), an interactive web simulator, and an AnyLogic build kit that replays the same days.", T({ x: 0.6, y: 5.45, w: 8.0, h: 0.6, fontSize: 13, color: HX.muted }));
    // validation table
    card(s, 8.95, 1.95, 3.75, 4.7, HX.panel);
    circleIcon(s, "check", 9.2, 2.15, 0.55);
    s.addText("10 / 10 code checks", T({ x: 9.9, y: 2.27, w: 2.7, h: 0.4, fontSize: 16, bold: true }));
    s.addText("hand calculation, capacity never exceeded, patients conserved, Little's law", T({ x: 9.2, y: 2.8, w: 3.3, h: 0.65, fontSize: 12, color: HX.muted }));
    const vh = ["Check", "Published", "Model"].map(t => ({ text: t, options: { bold: true, color: HX.muted } }));
    const vr = [["Kochi wait", "3.5 h", "4.1 h"], ["Time in unit", "5 h 40", "6 h 28"], ["Morning chairs lost", "35%", "37%"], ["Buffers (min)", "89.9 / 206.2", "exact"]]
      .map(r => r.map((t, j) => ({ text: t, options: { bold: j === 2, color: j === 2 ? HX.teal : HX.ink } })));
    s.addTable([vh, ...vr], { x: 9.15, y: 3.6, w: 3.4, colW: [1.45, 1.1, 0.85], fontFace: "Calibri", fontSize: 13, border: { type: "none" }, rowH: 0.48, valign: "middle", margin: [0.02, 0.04, 0.02, 0.04] });
    s.addNotes("The simulation plays out a day patient by patient. Registration has two desks; same-day patients go through the blood counter, the lab, and one of two doctors; billing is an approval delay; pharmacy has three hoods; then the patient waits for a chair and a nurse. Nurses follow Hesaraki's rule: a nurse setting up or taking down a line is fully busy, otherwise one nurse watches four drips. We verified the code ten ways, including hand calculations and Little's law, and validated it against Indian numbers: with spread-out appointments the model gives a 4.1-hour wait against Kochi's 3.5, and 37 percent of morning chair time lost against the 35 percent we predicted. We built it in Python, as an interactive web simulator, and as an AnyLogic kit.");
  }

  // =========================================================== 8 FORMULATION
  pres.addSection({ title: "Formulation" });
  {
    const s = slide("INFUCINQ Content", "Formulation", "FORMULATION", "Formulation: a buffer rule plus an integer programme");
    card(s, 0.6, 1.95, 5.2, 4.7, HX.panel);
    circleIcon(s, "insight", 0.85, 2.15, 0.6);
    s.addText("1  Booking rule", T({ x: 1.6, y: 2.27, w: 4.0, h: 0.4, fontFace: "Cambria", fontSize: 20, bold: true }));
    s.addText([
      { text: "P( aᵢ + Dᵢ ≤ sᵢ ) ≥ q", options: { breakLine: true } },
      { text: "⇒  sᵢ = aᵢ + B,   B = q-quantile of D", options: {} },
    ], T({ x: 0.9, y: 2.95, w: 4.7, h: 0.95, fontFace: "Cambria", fontSize: 19, color: HX.tealDark }));
    s.addText([
      { text: "a = told arrival, s = chair slot, D = random delay to drug ready, B set per class.", options: { breakLine: true } },
      { text: "q = 0.8 gives B = 90 and 210 min.", options: { breakLine: true } },
      { text: "Newsvendor view: best q = idle cost ÷ (idle cost + wait cost).", options: {} },
    ], T({ x: 0.9, y: 4.05, w: 4.7, h: 1.4, fontSize: 14, color: HX.muted, paraSpaceAfter: 4 }));
    s.addText("Two numbers carry all the randomness, so the daily problem stays deterministic and fast.", T({ x: 0.9, y: 5.6, w: 4.7, h: 0.8, fontSize: 14, bold: true, color: HX.teal }));
    // MIP
    card(s, 6.1, 1.95, 6.6, 4.7, HX.tealDark);
    s.addText("2  Daily chair slots (time-indexed MIP)", T({ x: 6.4, y: 2.15, w: 6.1, h: 0.4, fontFace: "Cambria", fontSize: 20, bold: true, color: "FFFFFF" }));
    s.addText("y(g, t) = patients of group g starting at 15-min slot t;  z(τ) = unit still open at τ", T({ x: 6.4, y: 2.62, w: 6.1, h: 0.35, fontSize: 13, color: "9FC9C3" }));
    s.addText("min  Σ finish time  +  wₘ · day length  +  wₒ · overtime", T({ x: 6.4, y: 3.1, w: 6.1, h: 0.45, fontFace: "Cambria", fontSize: 17, bold: true, color: HX.mint }));
    const cons = [["Everyone booked", "Σₜ y(g, t) = n(g) for every group"], ["Chairs", "patients in chairs at τ ≤ 20 · z(τ)"], ["Nurses", "4 · (setups + takedowns) + drips ≤ 4 · N"], ["Buffer", "y(g, t) = 0 before open + B"], ["Open is one block", "z(τ) ≥ z(τ + 1)"], ["Arrival cap", "told per 15 min ≤ 3, same-day ≤ 2"]]
      .map(([a, b]) => [{ text: a, options: { bold: true, color: "FFFFFF" } }, { text: b, options: { color: "D7EAE6" } }]);
    s.addTable(cons, { x: 6.35, y: 3.7, w: 6.15, colW: [1.95, 4.2], fontFace: "Calibri", fontSize: 13.5, border: { type: "none" }, rowH: 0.44, valign: "middle", margin: [0.02, 0.05, 0.02, 0.05] });
    s.addNotes("The formulation has two levels. First, the booking rule is a chance constraint: patient i should be ready by their slot with probability at least q. That turns into a fixed buffer per class, the q-quantile of the delay. It is also a newsvendor problem: q is the price of an idle chair relative to a waiting patient. Second, each day an integer programme sets the chair slots. Patients with the same class and infusion length are interchangeable, so the variables are counts per group and slot, which keeps it to about 560 variables. It minimises flowtime, makespan and a heavy overtime penalty, subject to chair capacity, Hesaraki's nurse rule, the buffer, and the arrival cap we added after we found the bottleneck moving to the front desk.");
  }

  // =========================================================== 9 VERIFY FORMULATION
  {
    const s = slide("INFUCINQ Content", "Formulation", "FORMULATION", "The MIP finds the true best schedule in 7 seconds");
    const head = ["Test case", "Schedules tried", "Brute force", "MIP", ""].map(t => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: HX.tealDark } } }));
    const rows = [["1", "4,800", "378", "378", "exact"], ["2", "12,000", "208", "208", "exact"], ["3", "2,560", "infeasible", "infeasible", "agree"], ["4", "2,880", "infeasible", "infeasible", "agree"], ["5", "1,152", "infeasible", "infeasible", "agree"], ["6", "4,800", "384", "384", "exact"]]
      .map((r, i) => r.map((t, j) => ({ text: t, options: { fill: { color: i % 2 ? "FFFFFF" : "F5F8F7" }, bold: j === 4, color: j === 4 ? HX.teal : HX.ink, align: j === 0 ? "left" : "right" } })));
    s.addTable([head, ...rows], { x: 0.6, y: 1.95, w: 6.4, colW: [1.2, 1.6, 1.3, 1.3, 1.0], fontFace: "Calibri", fontSize: 14, color: HX.ink, border: { type: "solid", color: "E3E8E6", pt: 0.75 }, rowH: 0.48, valign: "middle", margin: [0.04, 0.12, 0.04, 0.12] });
    s.addText("Brute force: every combination of start times for 4 patients, 2 chairs, 2 nurses. The MIP matches all 6, including proving 3 cases have no feasible schedule.", T({ x: 0.6, y: 5.45, w: 6.4, h: 0.8, fontSize: 13, color: HX.muted }));
    const st = [["48%", "better objective than the greedy list schedule, every one of 20 real days"], ["11 min", "planned overtime, against 76 min for greedy"], ["6.9 s", "mean solve time per day (560 variables)"], ["13 h", "for 246 appointments in Hadid 2022's full search"]];
    st.forEach(([b, l], i) => {
      const x = 7.5 + (i % 2) * 2.65, y = 1.95 + Math.floor(i / 2) * 2.25;
      card(s, x, y, 2.45, 2.05, i === 3 ? "FFFFFF" : HX.panel);
      s.addText(b, T({ x: x + 0.22, y: y + 0.2, w: 2.1, h: 0.65, fontFace: "Cambria", fontSize: 30, bold: true, color: i === 3 ? HX.muted : HX.teal }));
      s.addText(l, T({ x: x + 0.22, y: y + 0.9, w: 2.05, h: 1.05, fontSize: 13, color: HX.muted }));
    });
    s.addNotes("We checked the formulation against brute force. For six small random cases we tried every combination of start times; the MIP found exactly the same optimum in the three feasible cases, and proved the other three infeasible, which brute force confirms. On twenty real days it beats the greedy heuristic every time, by 48 percent on its objective, and plans 11 minutes of overtime instead of 76. It solves in about seven seconds a day. For comparison, Hadid's full simulation-optimisation took 13 hours for 246 appointments; that is why we optimise slots deterministically and tune only the buffer.");
  }

  // =========================================================== 10 E1
  pres.addSection({ title: "Results" });
  {
    const s = slide("INFUCINQ Content", "Results", "RESULT 1 · BOOKING RULES", "Two-time booking cuts overtime by 71%");
    const cats = ["Everyone at 08:00", "Longest first, 1 h early", "Shortest first, 1 h early", "Two times, greedy", "Two times, MIP"];
    const ot = [127, 106, 264, 60, 37], wt = [316, 206, 208, 208, 213];
    const mk = (vals) => [{ name: "Other rules", labels: cats, values: vals.map((v, i) => (i < 4 ? v : 0)) }, { name: "Two times, MIP", labels: cats, values: vals.map((v, i) => (i === 4 ? v : 0)) }];
    s.addChart(pres.charts.BAR, mk(ot), Object.assign({}, AX, { x: 0.6, y: 1.9, w: 6.0, h: 4.3, barDir: "bar", barGrouping: "stacked", chartColors: [HX.grey, HX.teal],
      showTitle: true, title: "Overtime after 18:00 (min per day)", showLegend: false, showValue: true, dataLabelPosition: "inEnd", dataLabelColor: "FFFFFF",
      dataLabelFormatCode: "0;-0;", catAxisOrientation: "maxMin", valAxisHidden: true, valGridLine: { style: "none" }, barGapWidthPct: 45 }));
    s.addChart(pres.charts.BAR, mk(wt), Object.assign({}, AX, { x: 6.85, y: 1.9, w: 5.85, h: 4.3, barDir: "bar", barGrouping: "stacked", chartColors: [HX.grey, HX.teal],
      showTitle: true, title: "Mean wait, arrival to drip (min)", showLegend: false, showValue: true, dataLabelPosition: "inEnd", dataLabelColor: "FFFFFF",
      dataLabelFormatCode: "0;-0;", catAxisOrientation: "maxMin", catAxisHidden: true, valAxisHidden: true, valGridLine: { style: "none" }, barGapWidthPct: 45 }));
    s.addText("100 identical simulated days, 30% pre-cleared, 20 chairs, 8 nurses. 95% CIs: overtime ±5–13 min, wait ±2–4 min. Against everyone-at-08:00: overtime −71%, wait −33%.", T({ x: 0.6, y: 6.3, w: 12.1, h: 0.5, fontSize: 12.5, color: HX.muted }));
    s.addNotes("First result: does our rule beat simple practice? On the same 100 days, telling everyone to come at eight gives 127 minutes of overtime and a 316-minute wait. Spreading appointments and telling people to come an hour early, as Liang's clinic did, already fixes the wait, down to about 206 minutes, but leaves over 100 minutes of overtime, and shortest-first is the worst at 264. Our two-time rule with the optimised schedule gives 37 minutes of overtime: 71 percent less than current practice and 65 percent less than the best simple rule, with the same wait. The confidence intervals are a few minutes wide, so these differences are real.");
  }

  // =========================================================== 11 E3
  {
    const s = slide("INFUCINQ Content", "Results", "RESULT 2 · PRE-CLEARANCE", "Pre-clearing 60% of patients captures most of the gain");
    const cats = ["0%", "20%", "40%", "60%", "80%", "100%"];
    s.addChart(pres.charts.LINE, [
      { name: "Everyone at 08:00", labels: cats, values: [185, 141, 107, 79, 67, 58] },
      { name: "Two times, MIP", labels: cats, values: [100, 48, 27, 15, 8, 3.5] },
    ], Object.assign({}, AX, { x: 0.6, y: 1.9, w: 7.7, h: 4.4, chartColors: [HX.grey, HX.teal], lineSize: 3, lineDataSymbol: "circle", lineDataSymbolSize: 9,
      showTitle: true, title: "Overtime (min per day) by share of patients pre-cleared the day before", showLegend: true, legendPos: "b", showValue: true, dataLabelPosition: "t",
      dataLabelColor: HX.ink, valAxisMinVal: 0, valAxisMaxVal: 200, valAxisMajorUnit: 50 }));
    card(s, 8.7, 1.95, 4.0, 4.35, HX.panel);
    s.addText("At 60% pre-cleared, two-time booking", T({ x: 9.0, y: 2.15, w: 3.5, h: 0.4, fontSize: 14, bold: true, color: HX.muted }));
    stat(s, 9.0, 2.6, 3.5, "15 min", "overtime (100 at 0%)", HX.teal, 36, 13);
    stat(s, 9.0, 3.85, 3.5, "178 min", "mean wait (238 at 0%)", HX.teal, 36, 13);
    s.addText("Beyond 60%, overtime falls only 15 → 4 min. Waiting keeps falling to 125 min, because each pre-cleared patient skips about 2 h of tests.", T({ x: 9.0, y: 5.1, w: 3.55, h: 1.1, fontSize: 13 }));
    s.addText("Under everyone-at-08:00, wait stops improving after 60% (271 → 250 min): the morning crowd at registration dominates, so pre-clearance needs two-time booking alongside it.", T({ x: 0.6, y: 6.35, w: 12.1, h: 0.5, fontSize: 12.5, color: HX.muted }));
    s.addNotes("Second result, our main research question: how much pre-clearance is enough? With nobody pre-cleared, even the optimal schedule has 100 minutes of overtime, because no same-day patient can reach a chair before 11:30. Overtime falls steeply up to about 60 percent pre-cleared, to 15 minutes, and after that only to 4. So 60 percent is the knee. Waiting keeps improving all the way, because every pre-cleared patient skips about two hours of tests. Note the grey line: if you pre-clear but still tell everyone to come at eight, the gain stalls, so the two changes work together.");
  }

  // =========================================================== 12 FIXES
  {
    const s = slide("INFUCINQ Content", "Results", "RESULT 3 · BOTTLENECKS", "Process changes beat buying capacity");
    const cats = ["Base: two times, MIP", "Pre-clear 60% + pre-compound", "Pre-clear 60%", "+1 registration desk", "+1 doctor", "+1 pharmacy hood", "+4 chairs", "+2 nurses (no arrival cap)"];
    const v = [37, 10, 15, 25, 30, 34, 38, 52];
    const best = (i) => i === 1 || i === 2;
    s.addChart(pres.charts.BAR, [
      { name: "Other", labels: cats, values: v.map((x, i) => (best(i) ? 0 : x)) },
      { name: "Process change", labels: cats, values: v.map((x, i) => (best(i) ? x : 0)) },
    ], Object.assign({}, AX, { x: 0.6, y: 1.9, w: 7.2, h: 4.5, barDir: "bar", barGrouping: "stacked", chartColors: [HX.grey, HX.teal], showTitle: true,
      title: "Overtime after 18:00 (min per day), 100 days", showLegend: false, showValue: true, dataLabelPosition: "inEnd", dataLabelColor: "FFFFFF",
      dataLabelFormatCode: "0;-0;", catAxisOrientation: "maxMin", valAxisHidden: true, valGridLine: { style: "none" }, barGapWidthPct: 40 }));
    const pts = [
      ["chair", "Chairs are not the constraint", "+4 chairs: 37 → 38 min. No change."],
      ["queue", "Extra nurses moved the queue", "Without the arrival cap, the plan bunched arrivals: registration queue 13 → 28 min. With the cap, 10 nurses cut overtime to 28 min."],
      ["med", "Best package, no new staff", "Pre-clear 60% and pre-compound: wait 157 min, overtime 10 min. With the arrival cap: 145 min (40-day run)."],
    ];
    pts.forEach(([ic, h, b], i) => {
      const y = 1.95 + i * 1.5;
      circleIcon(s, ic, 8.2, y, 0.55, i === 2 ? C.accent1 : "5E6E73");
      s.addText(h, T({ x: 8.95, y, w: 3.75, h: 0.4, fontSize: 15.5, bold: true }));
      s.addText(b, T({ x: 8.95, y: y + 0.4, w: 3.75, h: 1.0, fontSize: 13, color: HX.muted }));
    });
    s.addNotes("Third result: which change buys the most? Adding four chairs does nothing, 37 to 38 minutes, because chairs are not what runs out. A third registration desk is the best single resource, 25 minutes. Adding two nurses made things worse, which surprised us. The optimiser had no idea about the front desk, so with nurses no longer limiting, it told many patients to arrive together and the queue moved to registration. That is why we added the arrival cap to the formulation; with it, ten nurses cut overtime to 28 minutes. But the clear winner needs no new staff: pre-clear 60 percent and pre-compound their drugs, giving a 157-minute wait and 10 minutes of overtime.");
  }

  // =========================================================== 13 ROBUSTNESS
  {
    const s = slide("INFUCINQ Content", "Results", "RESULT 4 · ROBUSTNESS", "The plan survives wrong inputs, except a slow lab");
    const cats = ["As planned", "Stage spread ×0.5", "Stage spread ×2", "Lateness ×0.5", "Lateness ×2", "Lab 2–4 h (TMH)"];
    s.addChart(pres.charts.BAR, [
      { name: "Everyone at 08:00", labels: cats, values: [127, 126, 125, 138, 106, 184] },
      { name: "Two times, MIP", labels: cats, values: [37, 30, 55, 39, 42, 137] },
    ], Object.assign({}, AX, { x: 0.6, y: 1.9, w: 8.0, h: 4.45, barDir: "col", barGrouping: "clustered", chartColors: [HX.grey, HX.teal], showTitle: true,
      title: "Overtime (min per day) when reality differs from the plan", showLegend: true, legendPos: "b", showValue: true, dataLabelPosition: "outEnd", dataLabelColor: HX.ink,
      valAxisHidden: true, valGridLine: { style: "none" }, barGapWidthPct: 60 }));
    card(s, 8.95, 1.95, 3.75, 4.4, HX.panel);
    circleIcon(s, "check", 9.2, 2.2, 0.55);
    s.addText("Two-time booking wins in all 6 cases", T({ x: 9.2, y: 2.9, w: 3.3, h: 0.7, fontSize: 15, bold: true }));
    s.addText("Doubling every spread costs 18 min of overtime (37 → 55).", T({ x: 9.2, y: 3.6, w: 3.3, h: 0.7, fontSize: 13, color: HX.muted }));
    circleIcon(s, "lab", 9.2, 4.35, 0.55, C.accent2);
    s.addText("A 2–4 h lab breaks the buffers: 137 min overtime. Measure lab turnaround first at TMH.", T({ x: 9.2, y: 5.05, w: 3.3, h: 1.1, fontSize: 13, bold: true, color: HX.orange }));
    s.addNotes("We do not know the real spread of Indian stage times, so we made the plan with our base inputs and then let reality differ. Halving or doubling the spreads, or the lateness, never changes the ranking: two-time booking beats everyone-at-eight in every case, and doubling every spread costs only 18 minutes. The one real danger is the lab. Tata Memorial states four hours for a blood count. With a two-to-four-hour lab, overtime rises to 137 minutes, because our buffers were sized for 60 to 120 minutes. So the first thing to measure on the field visit is lab turnaround, and the buffer must be recomputed from it.");
  }

  // =========================================================== 14 HEADLINE
  {
    const s = slide("INFUCINQ Dark", "Results", "WHAT WE ACHIEVED", "Same staff: half the wait, a tenth of the overtime");
    const st = [["−50%", "mean wait before the drip", "316 → 157 min"], ["−92%", "overtime after closing", "127 → 10 min a day"], ["−71%", "overtime from booking alone", "127 → 37 min"], ["0", "new chairs, nurses or doctors", "process changes only"]];
    st.forEach(([b, l, d], i) => {
      const x = 0.6 + i * 3.08;
      n++; s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 2.0, w: 2.85, h: 3.4, rectRadius: 0.14, fill: { color: "1C4541" }, line: { type: "none" }, objectName: "hs" + n });
      s.addText(b, T({ x: x + 0.25, y: 2.3, w: 2.4, h: 1.1, fontFace: "Cambria", fontSize: 54, bold: true, color: i === 1 ? "F6A57F" : HX.mint }));
      s.addText(l, T({ x: x + 0.25, y: 3.55, w: 2.4, h: 0.75, fontSize: 16, color: "FFFFFF" }));
      s.addText(d, T({ x: x + 0.25, y: 4.55, w: 2.4, h: 0.5, fontSize: 14, color: "9FC9C3" }));
    });
    s.addText("Two-time booking + 60% pre-cleared + pre-compounded drugs, against everyone told 08:00. 100 identical simulated days, 20 chairs, 8 nurses.", T({ x: 0.6, y: 5.75, w: 12.1, h: 0.6, fontSize: 14, color: "D7EAE6" }));
    s.addNotes("Putting it together. Against today's practice of calling everyone at eight, the full package halves the mean wait, from 316 to 157 minutes, and cuts overtime by 92 percent, from 127 minutes a day to 10. Booking alone already removes 71 percent of the overtime. And all of this is with the same 20 chairs and 8 nurses: these are process changes, not purchases.");
  }

  // =========================================================== 15 ASSUMPTIONS
  pres.addSection({ title: "Close" });
  {
    const s = slide("INFUCINQ Content", "Close", "ASSUMPTIONS AND LIMITS", "What these numbers rest on");
    const groups = [
      ["data", "Data", ["Synthetic, calibrated: stage times are the Presentation 3 ranges, not yet measured at TMH", "Published figures taken from abstracts; full texts still to check", "Infusion mix from one 55-patient clinic day"]],
      ["hospital", "Unit", ["Generic unit: 20 chairs, 8 nurses, 08:00–18:00, 60% of chair-hours booked", "Presentation 3's 80% load is infeasible: 156 min overtime", "TMH runs 24 h with walk-ins; walk-ins are outside the model"]],
      ["nurse", "Behaviour", ["A ready patient may start before the slot if a chair and nurse are free", "Setup and takedown each need one whole nurse; one nurse watches 4 drips", "Billing is an approval delay, not a queue; unfit 8%, no-show 5%"]],
      ["math", "Model", ["The MIP plans with mean durations; the simulation adds all randomness", "15 s solver limit, 1% gap; greedy fallback if no solution", "Buffers sized for a 60–120 min lab"]],
    ];
    groups.forEach(([ic, h, items], i) => {
      const x = 0.6 + (i % 2) * 6.15, y = 1.9 + Math.floor(i / 2) * 2.45;
      card(s, x, y, 5.95, 2.25, HX.panel);
      circleIcon(s, ic, x + 0.25, y + 0.25, 0.5);
      s.addText(h, T({ x: x + 0.9, y: y + 0.3, w: 4.8, h: 0.4, fontFace: "Cambria", fontSize: 18, bold: true }));
      s.addText(items.map((t, j) => ({ text: t, options: { bullet: true, breakLine: j < items.length - 1 } })), T({ x: x + 0.3, y: y + 0.85, w: 5.45, h: 1.35, fontSize: 13, color: HX.ink, paraSpaceAfter: 3 }));
    });
    s.addNotes("These are the assumptions our numbers rest on. The data is synthetic but calibrated: stage times are our Presentation 3 ranges and will be replaced when Tata Memorial shares timestamps. The unit is generic, with fixed hours and no walk-ins, unlike Tata Memorial. We allow a ready patient to start early if a chair and nurse are free, and we treat setup and takedown as needing a whole nurse. The optimiser plans with mean durations and the simulation adds the randomness. And the buffers assume a 60 to 120 minute lab; at four hours they must be recomputed.");
  }

  // =========================================================== 16 SUMMARY
  {
    const s = slide("INFUCINQ Dark", "Close", "SUMMARY", "Summary");
    const items = [
      ["Problem", "Patients wait 3–4 h because same-day blood work makes them ready only around 11:00; 37% of chair-hours are lost to it."],
      ["Proposal", "Two times per patient, arrival and chair, with chair = arrival + an 80% buffer (90 / 210 min), slots set by an integer programme."],
      ["Evidence", "Calibrated dataset (23/23 checks), verified simulation (10/10), MIP matches brute force (6/6), 100 identical days per scenario."],
      ["Result", "Booking alone: overtime −71%. With 60% pre-cleared and pre-compounding: wait 316 → 157 min, overtime 127 → 10 min."],
      ["Next", "Measure TMH stage times, lab turnaround first, and refit every input."],
    ];
    items.forEach(([a, b], i) => s.addText([{ text: a, options: { bold: true, color: HX.mint } }, { text: "\t" + b, options: { color: "FFFFFF" } }],
      T({ x: 0.6, y: 1.85 + i * 0.72, w: 12.1, h: 0.66, fontSize: 15.5, tabStops: [{ position: 1.55 }], valign: "middle" })));
    n++; s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 5.6, w: 12.1, h: 1.0, rectRadius: 0.12, fill: { color: "1C4541" }, line: { type: "none" }, objectName: "final" + n });
    s.addText("Telling each patient two times, and clearing 60% of them the day before, halves the wait and nearly removes overtime, with no new chairs or staff.",
      T({ x: 0.9, y: 5.6, w: 11.5, h: 1.0, fontFace: "Cambria", fontSize: 19, bold: true, color: "FFFFFF", valign: "middle" }));
    s.addNotes("To summarise. The problem is ready time: same-day blood work means patients cannot reach a chair before about eleven, and that wastes over a third of chair-hours. Our proposal is two times per patient, with the chair booked a buffer after arrival and the slots set by an integer programme. Every part was verified: the data, the simulation and the optimiser. Booking alone cuts overtime by 71 percent, and with 60 percent pre-clearance and pre-compounding, the wait halves and overtime nearly disappears, with no new chairs or staff. Our next step is to replace the assumed inputs with Tata Memorial measurements, starting with lab turnaround. Thank you; we are happy to take questions.");
  }

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
