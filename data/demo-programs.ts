export const DEMO_NOTICE = "Demo material—not official CPACE content. All organizations, people, and figures are fictional. No certification or professional advice is provided."

type DemoQuestion = {
  question: string
  type: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY"
  points: number
  options?: { text: string; isCorrect: boolean }[]
}
type DemoLesson = { title: string; description: string; duration: number; sections: { heading: string; paragraphs: string[] }[] }
export type DemoProgram = {
  code: "CFMS" | "CMMS" | "COMS"
  name: string
  objectives: string[]
  lessons: DemoLesson[]
  practice: DemoQuestion[]
  assignment: DemoQuestion[]
  rubric: string
}
const choice = (question: string, options: string[], correct: number): DemoQuestion => ({
  question, type: "MULTIPLE_CHOICE", points: 2,
  options: options.map((text, index) => ({ text, isCorrect: index === correct })),
})

export const demoPrograms: DemoProgram[] = [
  {
    code: "CFMS", name: "Certified Financial Management Specialist",
    objectives: ["Distinguish earnings from cash availability", "Calculate simple profitability, liquidity, and budget variances", "Explain assumptions and financial trade-offs using a fictional case"],
    lessons: [
      {
        title: "Financial statements and business health", duration: 25,
        description: "Read a simplified income statement and liquidity snapshot.",
        sections: [
          { heading: "Three different questions", paragraphs: ["An income statement summarizes revenue and expenses over a period. A balance sheet describes assets, liabilities, and equity at a point in time. A cash-flow view tracks cash movements. Profit does not necessarily mean enough cash is available to pay tomorrow's bills.", "For this exercise, ignore tax, interest, and depreciation. Use the supplied figures only; do not treat this simplified presentation as an official accounting standard."] },
          { heading: "Case: Harbor Office Supplies", paragraphs: ["During one fictional month, revenue is PHP 100,000. Materials cost PHP 40,000, payroll PHP 25,000, and other operating expenses PHP 15,000. Simplified operating profit is PHP 20,000, and operating margin is 20,000 / 100,000 × 100 = 20%.", "At month-end, current assets are PHP 90,000 and current liabilities PHP 45,000. The current ratio is 2.0. This alone does not establish financial safety: assets may include slow inventory or receivables that are difficult to collect."] },
          { heading: "Your activity", paragraphs: ["Create a three-column worksheet: metric, calculation, interpretation. Include profit, operating margin, and current ratio. State one missing fact you would request before recommending any business decision."] },
        ],
      },
      {
        title: "Budgeting, variances, and break-even", duration: 30,
        description: "Compare planned spending with actual spending and estimate break-even volume.",
        sections: [
          { heading: "Budget versus actual", paragraphs: ["A budget is a plan based on assumptions, not a guarantee. Here the monthly expense budget is PHP 50,000 and actual spending PHP 54,000. Actual minus budget is PHP 4,000, an 8% adverse expense variance. Investigation should separate price changes, volume changes, timing, and recording errors before assigning blame."] },
          { heading: "A simplified break-even model", paragraphs: ["A fictional product sells for PHP 200 per unit, with variable cost PHP 125 per unit and monthly fixed costs PHP 30,000. Contribution per unit is PHP 75. Break-even volume is fixed costs / contribution per unit = 400 units.", "This model assumes one product, constant prices and costs, and sales of all produced units. A discount, capacity limit, or unsold stock may change the result. A break-even estimate is not a cash forecast."] },
          { heading: "Your activity", paragraphs: ["Write two plausible explanations for the expense variance and the evidence needed to distinguish them. Recalculate break-even volume if the selling price falls to PHP 185, then explain which assumptions become important."] },
        ],
      },
      {
        title: "Cash forecasting and internal controls", duration: 25,
        description: "Identify a projected cash shortfall and distinguish analysis from authorization.",
        sections: [
          { heading: "Case: the next four weeks", paragraphs: ["Harbor starts with PHP 7,000 cash, expects PHP 40,000 receipts, and plans PHP 54,000 payments. Projected closing cash is 7,000 + 40,000 − 54,000 = negative PHP 7,000. This represents an uncovered cash requirement, not an actual negative bank balance.", "Possible topics for management discussion include collection timing, payment scheduling, reducing discretionary spending, or financing. Compare costs, contractual obligations, and risks rather than claiming one option is always best. This fictional activity is not personal investment or credit advice."] },
          { heading: "Controls and evidence", paragraphs: ["Separate approval, payment execution, and reconciliation where feasible. Keep supporting invoices and an audit trail. An unexplained discrepancy should be investigated using records rather than silently changing the numbers."] },
          { heading: "Deliverable", paragraphs: ["Prepare a short management memo showing the forecast, two response options, one risk per option, and the missing evidence required. Clearly label every assumption."] },
        ],
      },
    ],
    practice: [
      choice("Harbor's revenue is PHP 100,000 and operating expenses total PHP 80,000. What is its simplified operating margin?", ["8%", "20%", "25%", "80%"], 1),
      choice("Fixed costs are PHP 30,000; price per unit is PHP 200 and variable cost PHP 125. What is break-even sales volume?", ["150 units", "240 units", "400 units", "600 units"], 2),
      choice("Expense budget is PHP 50,000 and actual expense PHP 54,000. Which interpretation is correct?", ["PHP 4,000 favorable", "PHP 4,000 adverse (8%)", "PHP 54,000 adverse", "8% lower spending"], 1),
    ],
    assignment: [
      { question: "Opening cash is PHP 7,000, forecast receipts PHP 40,000, and payments PHP 54,000. Calculate projected closing cash, show your formula, and explain what a negative result means in this forecast.", type: "SHORT_ANSWER", points: 5 },
      { question: "Write a 150–250 word memo for fictional Harbor Office Supplies. Explain why profit and cash can differ; propose two ways management could investigate or address the forecast shortfall; identify one risk for each and two missing facts. Distinguish supplied facts from assumptions. Do not provide personal financial advice.", type: "ESSAY", points: 10 },
    ],
    rubric: "Short answer (5): correct formula 2, result 2, interpretation 1. Memo (10): cash/profit distinction 2, two reasoned options 4, risks 2, missing facts/clear assumptions 2.",
  },
  {
    code: "CMMS", name: "Certified Marketing Management Specialist",
    objectives: ["Define an audience and a testable value proposition", "Calculate conversion rate, acquisition cost, and revenue-based ROAS", "Design an ethical campaign experiment with explicit limitations"],
    lessons: [
      {
        title: "Audience research and positioning", duration: 25,
        description: "Turn fictional customer observations into a research-backed campaign brief.",
        sections: [
          { heading: "Case: Northstar Skills Studio", paragraphs: ["Northstar is a fictional training business considering an evening workshop for working professionals. Interview notes suggest some people value flexible timing while others prioritize a practical portfolio. Treat these as hypotheses, not proof that every customer has the same needs.", "Segmentation groups customers by relevant characteristics or needs. Targeting chooses whom a particular offer will serve. Positioning explains a useful difference in that audience's terms. A job title or age bracket alone does not establish willingness to buy."] },
          { heading: "Research quality", paragraphs: ["A convenience survey of 20 existing followers may exclude people unfamiliar with the brand. Record how respondents were recruited and what the sample cannot represent. Avoid inventing testimonials, collecting unnecessary sensitive data, or promising certification that the business cannot substantiate."] },
          { heading: "Your activity", paragraphs: ["Draft an audience statement, one value proposition, and three interview questions. For each research finding, state its source, uncertainty, and the next validation step."] },
        ],
      },
      {
        title: "Campaign funnel and performance metrics", duration: 30,
        description: "Calculate campaign metrics without confusing revenue with profit.",
        sections: [
          { heading: "Case: a fictional paid campaign", paragraphs: ["The campaign spends PHP 50,000 and receives 2,000 clicks resulting in 100 attributed purchases. Every purchase has PHP 1,200 revenue, giving PHP 120,000 attributed revenue. For this exercise, assume the attribution counts contain no duplicates or refunds.", "Click-to-purchase conversion is 100 / 2,000 × 100 = 5%. Acquisition cost is 50,000 / 100 = PHP 500. Revenue-based return on ad spend (ROAS) is 120,000 / 50,000 = 2.4×. None of these numbers alone proves profitability: delivery costs, overhead, taxes, refunds, and attribution accuracy are not supplied."] },
          { heading: "Choose a useful objective", paragraphs: ["Report an outcome metric tied to the campaign goal, plus diagnostic metrics that help explain it. More clicks are not automatically better if they do not reach an appropriate audience. Use consistent time windows and clearly define what counts as a purchase."] },
          { heading: "Your activity", paragraphs: ["Build a metric worksheet with numerator, denominator, unit, and business meaning. List two data-quality checks before comparing this campaign with another channel."] },
        ],
      },
      {
        title: "Experiments, communication, and campaign planning", duration: 25,
        description: "Write a small experiment plan with ethical claims and a clear decision rule.",
        sections: [
          { heading: "Case: creative A and B", paragraphs: ["Creative A reaches 500 visitors and records 40 purchases; B reaches 500 and records 30. The observed purchase rates are 8% and 6%. A has the higher observed rate, but these counts alone do not establish statistical significance or eliminate audience/timing differences.", "A fair test should specify the hypothesis, audience allocation, observation window, primary metric, and stopping rule before results are inspected. Avoid changing several variables at once when you want to learn which change matters."] },
          { heading: "Responsible messaging", paragraphs: ["Make claims that match the offer. Explain costs and conditions clearly, avoid fabricated scarcity, and respect consent and unsubscribe requests. Do not collect personal information merely because the form can ask for it."] },
          { heading: "Deliverable", paragraphs: ["Prepare a one-page fictional campaign brief: audience, offer, channel, budget, two creatives, test plan, success metric, and one ethical safeguard. Label estimates and unknowns."] },
        ],
      },
    ],
    practice: [
      choice("A campaign has 100 purchases from 2,000 clicks. What is click-to-purchase conversion?", ["2%", "5%", "20%", "50%"], 1),
      choice("Campaign spend is PHP 50,000 and there are 100 acquired customers. What is acquisition cost per customer?", ["PHP 50", "PHP 100", "PHP 500", "PHP 5,000"], 2),
      choice("Attributed revenue is PHP 120,000 and ad spend PHP 50,000. Which statement is supported?", ["ROAS is 2.4×; profit is not established", "Profit is PHP 120,000", "Every future campaign will earn 2.4×", "Conversion rate is 240%"], 0),
    ],
    assignment: [
      { question: "Creative A has 40 purchases from 500 visitors; B has 30 from 500. Calculate both observed purchase rates. Explain one reason these results alone do not prove that A will always perform better.", type: "SHORT_ANSWER", points: 5 },
      { question: "Write a 150–250 word campaign brief for fictional Northstar Skills Studio's evening workshop. Specify audience, value proposition, channel, PHP 50,000 budget allocation, measurable objective, a fair A/B test, and one ethical safeguard. Clearly mark assumptions and do not fabricate endorsements or official certification claims.", type: "ESSAY", points: 10 },
    ],
    rubric: "Short answer (5): A 8% 2, B 6% 2, valid limitation 1. Brief (10): audience/value 2, channel/budget rationale 2, measurable objective 2, fair test 3, ethical safeguard 1.",
  },
  {
    code: "COMS", name: "Certified Operational Management Specialist",
    objectives: ["Identify a process bottleneck using supplied cycle times", "Calculate simple quality, capacity, and replenishment metrics", "Propose a measurable operational improvement with realistic trade-offs"],
    lessons: [
      {
        title: "Process mapping and bottleneck analysis", duration: 25,
        description: "Map a fictional fulfillment process and distinguish lead time from capacity.",
        sections: [
          { heading: "Case: Bayline Fulfillment", paragraphs: ["Bayline's fictional order process has receive (3 minutes), verify (7 minutes), and pack (4 minutes) stages. Assume each stage has one dedicated worker, orders can flow between stages, and setup time and variability are ignored. Verification is the bottleneck because it has the longest processing time.", "The theoretical steady-state bottleneck capacity is 60 / 7 ≈ 8.57 orders per hour. One order's processing time across all stages is 14 minutes, excluding waiting. Dividing 60 by 14 would answer a different question if a single worker performed all stages sequentially."] },
          { heading: "Observe before changing", paragraphs: ["Map inputs, outputs, handoffs, and rework. Measure queues and interruptions, not just average processing time. Moving work away from verification helps only if the controls and quality requirements still hold."] },
          { heading: "Your activity", paragraphs: ["Draw the three-stage map, identify the constraint, and propose one measurement to validate it. Describe how staffing or variable order complexity might change the capacity estimate."] },
        ],
      },
      {
        title: "Quality, capacity, and replenishment", duration: 30,
        description: "Use clear denominators for operational measures.",
        sections: [
          { heading: "A simple quality dashboard", paragraphs: ["Of 100 inspected orders, 7 orders have at least one defect. The defective-order rate is 7%; it is not a count of all individual defects. Of 100 orders due for delivery, 95 arrive on time, giving 95% on-time delivery. Keep the inspected and delivery cohorts distinct.", "If a process completes 40 units against an available capacity of 50 units in the same period, utilization is 80%. Higher utilization is not automatically better service: little spare capacity may increase queues when demand varies."] },
          { heading: "Reorder point exercise", paragraphs: ["Assume constant demand of 100 units per day, fixed lead time of 4 days, and a supplied safety-stock allowance of 80 units. Reorder point = demand during lead time + safety stock = 100 × 4 + 80 = 480 units.", "The safety stock is given, not calculated from a service-level model. Real replenishment decisions must consider demand/lead-time uncertainty, inventory position, pack sizes, and supplier constraints."] },
          { heading: "Your activity", paragraphs: ["Create a dashboard row for each metric with calculation, unit, scope, and one limitation. Recalculate the reorder point for a fixed six-day lead time with the same supplied safety-stock allowance."] },
        ],
      },
      {
        title: "Continuous improvement and operational risk", duration: 25,
        description: "Design a small controlled improvement rather than declaring success from one number.",
        sections: [
          { heading: "Case: reducing verification delay", paragraphs: ["Bayline proposes a standard checklist and a pilot that prepares order information before verification. The goal is to reduce average verification time while keeping defect rate and staff workload visible. Do not assume faster work is safer or more accurate without measurement.", "Define baseline period, pilot scope, process owner, target measure, quality guardrail, and rollback condition. A small pilot can expose unintended consequences before wider adoption."] },
          { heading: "Risk and trade-offs", paragraphs: ["Consider incomplete data, supplier delay, equipment downtime, and demand spikes. Rank risks using clearly described impact and likelihood assumptions. A backup process must preserve traceability and approval requirements rather than bypassing them for speed."] },
          { heading: "Deliverable", paragraphs: ["Write a short improvement proposal showing the bottleneck evidence, intervention, measurement plan, quality guardrail, one cost/trade-off, and a fallback if performance worsens."] },
        ],
      },
    ],
    practice: [
      choice("One dedicated worker per stage processes receive in 3 min, verify in 7 min, and pack in 4 min. Which stage limits theoretical steady-state throughput?", ["Receive", "Verify", "Pack", "All have identical capacity"], 1),
      choice("7 of 100 inspected orders have at least one defect. What is the defective-order rate?", ["0.7%", "7%", "14%", "93%"], 1),
      choice("Demand is 100 units/day, fixed lead time 4 days, and given safety stock 80 units. What is the simplified reorder point?", ["180 units", "320 units", "400 units", "480 units"], 3),
    ],
    assignment: [
      { question: "A process completes 40 units against available capacity of 50 in the same period. Calculate utilization. Explain one reason maximizing utilization alone may worsen service performance.", type: "SHORT_ANSWER", points: 5 },
      { question: "Write a 150–250 word improvement proposal for fictional Bayline Fulfillment. Use the receive/verify/pack times (3/7/4 minutes) to identify the constraint, propose one intervention, define a success metric and quality guardrail, and discuss one trade-off and fallback. State the assumptions behind the capacity calculation.", type: "ESSAY", points: 10 },
    ],
    rubric: "Short answer (5): calculation/result 3, valid queue/variability explanation 2. Proposal (10): constraint evidence 2, intervention 2, measurable pilot 2, quality guardrail 2, trade-off/fallback/assumptions 2.",
  },
]
