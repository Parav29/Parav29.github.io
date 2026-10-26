# ICICI Bank – Banking Simulation (CIA 3)

Deliverables for the recession banking simulation (20% weightage).

| File | What it is |
|---|---|
| `ICICI_Bank_Simulation_Presentation.pptx` | 23-slide final presentation (editable) |
| `ICICI_Bank_Simulation_Presentation.pdf` | Same deck as PDF, for the email |
| `ICICI_Bank_Recession_Simulation_Model.xlsx` | 16-sheet model; every number is formula-linked |

## How the simulation is built

- **Starting point (real):** ICICI Bank's audited standalone results for FY2026 (year to 31 Mar 2026):
  PAT ₹50,147 cr, deposits ₹17.95 lakh cr, advances ₹15.54 lakh cr, GNPA 1.40%, CET-1 16.35%.
- **Simulation (fictional):** 8 quarterly rounds of recession, split into Year 1 and Year 2. Defaults peak at 3× normal,
  GDP falls to 1.8% and RBI cuts the repo rate to 4.50%.
- **Our decisions each round:** we use the four levers in the brief.
  - Investment: loan growth by segment.
  - Pricing: risk premium, loan rate offers and the FD premium.
  - Marketing: campaigns and digital spend.
  - Risk: underwriting, collections, coverage and the contingency buffer.
- **Scorecard:** profit, RAROC (risk-adjusted return on capital), market share and customer satisfaction (a simulated survey).

## Headline results

| | FY26 (actual) | Sim Year 1 | Sim Year 2 |
|---|---|---|---|
| Net profit | ₹50,147 cr | ₹33,461 cr | ₹42,537 cr |
| RAROC (hurdle 14%) | 18.2% | 14.4% | 15.1% |
| Gross NPA | 1.40% | 2.74% | 2.59% |
| CET-1 | 16.35% | 16.81% | 17.22% |
| Deposit market share | 6.84% | 6.91% | 6.96% |
| Credit market share | 7.62% | 7.66% | 7.71% |
| Customer satisfaction index | – | 80.3% | 80.2% |

## Before you submit

1. **Fill in names and App IDs** on slide 1 and slide 21 (contribution slide). Also fill in the `%` share for each member,
   and write "None" or name anyone who did not contribute. The brief requires this.
2. **If the faculty gives different market conditions in class,** change the yellow cells on the `Market` sheet.
   Change your choices on the `Decisions` sheet. Every other sheet updates. The deck's numbers come from the model,
   so update the charts and tables to match.
3. **Survey:** the customer survey is simulated, which the brief allows. To run it for real, the questionnaire is at the
   bottom of the `Customer_Survey` sheet. Paste the response counts over the blue cells.
4. Export the deck to PDF and send it using the email draft below.

## Email draft

**To:** apurva.mehta@atlasuniversity.edu.in
**Subject:** CIA 3 Banking Simulation – Final Submission – Team ICICI Bank – [Division]

Dear Prof. Mehta,

Please find attached our group's final submission for the CIA 3 banking simulation. We ran ICICI Bank through the
recession scenario.

Attached:
1. Final presentation (PPTX and PDF). It covers our strategy, the quarterly decisions, performance (profitability,
   RAROC, market share and customer satisfaction), SWOT, ethical considerations and lessons learned.
2. Simulation model (Excel). It contains the quarterly P&L, balance sheet, NPA and provisioning schedules, capital and
   RAROC calculations, market share and the customer survey.

The starting position uses ICICI Bank's reported FY2026 standalone results. All simulation-period figures are
fictional outcomes of the recession scenario and our decisions. Slide 21 lists each member's contribution.

Group members:
1. [Name] – [App ID] – [Role]
2. [Name] – [App ID] – [Role]
3. [Name] – [App ID] – [Role]
4. [Name] – [App ID] – [Role]
5. [Name] – [App ID] – [Role]

Thank you,
[Your name]
On behalf of Team ICICI Bank

## Sources

- ICICI Bank – Performance Review, quarter ended 31 March 2026; Form 6-K FY2026 results
- ICICI Bank Q4 FY26 investor presentation / earnings call coverage (Investing.com, Yahoo Finance)
- Elite Wealth – ICICI Bank Q4 FY26 result analysis (operating expenses, provisions, PPOP)
- ICICI Bank FY2025 results coverage (Business Standard)
- ICICI Bank Q2 FY27 results, 17 Oct 2026 (Business Standard) – real context only
- RBI – Scheduled Commercial Banks statement, 31 March 2026 (system deposits)
