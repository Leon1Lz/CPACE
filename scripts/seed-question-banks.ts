import "dotenv/config"
import { prisma } from "../lib/prisma"

async function main() {
  console.log("🌱 Seeding Question Banks...")

  // Find courses for CFMS, CMMS, COMS
  const [cfmsCourse, cmmsCourse, comsCourse] = await Promise.all([
    prisma.course.findFirst({ where: { category: "CFMS" } }),
    prisma.course.findFirst({ where: { category: "CMMS" } }),
    prisma.course.findFirst({ where: { category: "COMS" } }),
  ])

  if (!cfmsCourse || !cmmsCourse || !comsCourse) {
    console.error("Courses for CFMS, CMMS, or COMS not found. Available courses:", await prisma.course.findMany({ select: { id: true, category: true, title: true } }))
    return
  }

  // 1. CFMS Question Bank
  let cfmsBank = await prisma.questionBank.findFirst({ where: { courseId: cfmsCourse.id, code: "QB-CFMS-01" } })
  if (!cfmsBank) {
    cfmsBank = await prisma.questionBank.create({
      data: {
        title: "CFMS Financial Analysis & Corporate Finance Item Bank",
        description: "Comprehensive question bank covering financial statement analysis, cash flow metrics, working capital management, WACC, and capital budgeting.",
        code: "QB-CFMS-01",
        courseId: cfmsCourse.id,
      },
    })
    console.log(`Created CFMS Question Bank: ${cfmsBank.id}`)
  }

  const cfmsQuestions = [
    {
      question: "Which financial statement reports the cash receipts and cash disbursements of an enterprise over a specified reporting period?",
      difficulty: "EASY" as const,
      points: 1.0,
      topic: "Financial Statements",
      explanation: "The Statement of Cash Flows reports the cash generated and spent by a company across operating, investing, and financing activities during a specific period.",
      formula: "Ending Cash = Beginning Cash + Operating Cash Flow + Investing Cash Flow + Financing Cash Flow",
      options: [
        { text: "Balance Sheet", isCorrect: false },
        { text: "Statement of Comprehensive Income", isCorrect: false },
        { text: "Statement of Cash Flows", isCorrect: true },
        { text: "Statement of Changes in Equity", isCorrect: false },
      ],
    },
    {
      question: "Company ABC has Current Assets of ₱500,000, Inventories of ₱150,000, Prepaid Expenses of ₱50,000, and Current Liabilities of ₱200,000. What is the company's Quick Ratio?",
      difficulty: "MEDIUM" as const,
      points: 2.0,
      topic: "Liquidity Ratios",
      explanation: "The Quick Ratio (Acid-Test) excludes inventory and prepaid expenses from current assets because they cannot be liquidated into cash immediately. Quick Assets = ₱500,000 - ₱150,000 - ₱50,000 = ₱300,000. Quick Ratio = ₱300,000 / ₱200,000 = 1.50.",
      formula: "Quick Ratio = (Current Assets - Inventory - Prepaid Expenses) / Current Liabilities",
      options: [
        { text: "2.50", isCorrect: false },
        { text: "1.75", isCorrect: false },
        { text: "1.50", isCorrect: true },
        { text: "1.20", isCorrect: false },
      ],
    },
    {
      question: "When evaluating independent capital investment projects, which capital budgeting metric takes into account the time value of money and directly measures the net addition to shareholder wealth?",
      difficulty: "MEDIUM" as const,
      points: 1.5,
      topic: "Capital Budgeting",
      explanation: "Net Present Value (NPV) discounts all expected future cash flows to the present at the firm's cost of capital and subtracts the initial outlay, directly measuring the dollar value added to shareholder wealth.",
      formula: "NPV = Σ [CF_t / (1 + r)^t] - Initial Investment",
      options: [
        { text: "Payback Period", isCorrect: false },
        { text: "Net Present Value (NPV)", isCorrect: true },
        { text: "Accounting Rate of Return (ARR)", isCorrect: false },
        { text: "Gross Profit Margin", isCorrect: false },
      ],
    },
    {
      question: "A company with an equity cost of capital of 12%, a pre-tax cost of debt of 6%, a debt-to-capital ratio of 40%, and a corporate tax rate of 25% has a Weighted Average Cost of Capital (WACC) of:",
      difficulty: "HARD" as const,
      points: 2.5,
      topic: "Cost of Capital",
      explanation: "After-tax cost of debt = 6% × (1 - 0.25) = 4.5%. Equity weight = 60%, Debt weight = 40%. WACC = (0.60 × 12%) + (0.40 × 4.5%) = 7.2% + 1.8% = 9.0%.",
      formula: "WACC = (E/V × Re) + [D/V × Rd × (1 - Tc)]",
      options: [
        { text: "9.60%", isCorrect: false },
        { text: "9.00%", isCorrect: true },
        { text: "8.40%", isCorrect: false },
        { text: "10.20%", isCorrect: false },
      ],
    },
    {
      question: "Which of the following would cause a decrease in a company's Net Working Capital (NWC)?",
      difficulty: "EASY" as const,
      points: 1.0,
      topic: "Working Capital",
      explanation: "Net Working Capital is Current Assets minus Current Liabilities. Paying cash (a current asset) to purchase a long-term fixed equipment reduces current assets without reducing current liabilities, thus reducing NWC.",
      formula: "NWC = Current Assets - Current Liabilities",
      options: [
        { text: "Collecting cash from an Accounts Receivable", isCorrect: false },
        { text: "Using cash to purchase long-term machinery equipment", isCorrect: true },
        { text: "Purchasing inventory on 30-day trade credit", isCorrect: false },
        { text: "Issuing long-term bonds to increase cash balances", isCorrect: false },
      ],
    },
  ]

  for (const q of cfmsQuestions) {
    const existing = await prisma.bankQuestion.findFirst({ where: { bankId: cfmsBank.id, question: q.question } })
    if (!existing) {
      await prisma.bankQuestion.create({
        data: {
          bankId: cfmsBank.id,
          question: q.question,
          difficulty: q.difficulty,
          points: q.points,
          topic: q.topic,
          explanation: q.explanation,
          formula: q.formula,
          options: {
            create: q.options.map((o, idx) => ({ text: o.text, isCorrect: o.isCorrect, order: idx + 1 })),
          },
        },
      })
    }
  }

  // 2. CMMS Question Bank
  let cmmsBank = await prisma.questionBank.findFirst({ where: { courseId: cmmsCourse.id, code: "QB-CMMS-01" } })
  if (!cmmsBank) {
    cmmsBank = await prisma.questionBank.create({
      data: {
        title: "CMMS Strategic Marketing & Customer Analytics Item Bank",
        description: "Question bank focusing on unit economics (CAC, LTV, Churn), market segmentation, omni-channel campaigns, and positioning strategy.",
        code: "QB-CMMS-01",
        courseId: cmmsCourse.id,
      },
    })
    console.log(`Created CMMS Question Bank: ${cmmsBank.id}`)
  }

  const cmmsQuestions = [
    {
      question: "If a company spends ₱150,000 on digital marketing and sales campaigns in a quarter and acquires 300 new paying customers, what is the Customer Acquisition Cost (CAC)?",
      difficulty: "EASY" as const,
      points: 1.0,
      topic: "Marketing Analytics",
      explanation: "Customer Acquisition Cost (CAC) is calculated by dividing total acquisition expenses by the number of new customers acquired during that specific period. ₱150,000 / 300 = ₱500 per customer.",
      formula: "CAC = Total Acquisition Marketing Costs / Total New Customers Acquired",
      options: [
        { text: "₱300", isCorrect: false },
        { text: "₱450", isCorrect: false },
        { text: "₱500", isCorrect: true },
        { text: "₱650", isCorrect: false },
      ],
    },
    {
      question: "A SaaS enterprise generates an Average Revenue Per User (ARPU) of ₱1,200 per month with a gross margin of 75% and a monthly customer churn rate of 5%. What is the Customer Lifetime Value (LTV)?",
      difficulty: "HARD" as const,
      points: 2.5,
      topic: "Customer Analytics",
      explanation: "LTV = (ARPU × Gross Margin %) / Churn Rate. LTV = (₱1,200 × 0.75) / 0.05 = ₱900 / 0.05 = ₱18,000.",
      formula: "LTV = (ARPU × Gross Margin) / Churn Rate",
      options: [
        { text: "₱12,000", isCorrect: false },
        { text: "₱15,000", isCorrect: false },
        { text: "₱18,000", isCorrect: true },
        { text: "₱24,000", isCorrect: false },
      ],
    },
    {
      question: "Dividing a broad consumer market into subsets of consumers who have common needs and behaviors based on lifestyle, values, and social attitudes is termed:",
      difficulty: "MEDIUM" as const,
      points: 1.5,
      topic: "Market Segmentation",
      explanation: "Psychographic segmentation groups consumers by psychological traits, lifestyle, personal values, opinions, and social standing, unlike demographic segmentation which looks at age, sex, or income.",
      formula: "Market Segmentation = Demographic + Geographic + Psychographic + Behavioral",
      options: [
        { text: "Demographic Segmentation", isCorrect: false },
        { text: "Geographic Segmentation", isCorrect: false },
        { text: "Psychographic Segmentation", isCorrect: true },
        { text: "Technographic Segmentation", isCorrect: false },
      ],
    },
  ]

  for (const q of cmmsQuestions) {
    const existing = await prisma.bankQuestion.findFirst({ where: { bankId: cmmsBank.id, question: q.question } })
    if (!existing) {
      await prisma.bankQuestion.create({
        data: {
          bankId: cmmsBank.id,
          question: q.question,
          difficulty: q.difficulty,
          points: q.points,
          topic: q.topic,
          explanation: q.explanation,
          formula: q.formula,
          options: {
            create: q.options.map((o, idx) => ({ text: o.text, isCorrect: o.isCorrect, order: idx + 1 })),
          },
        },
      })
    }
  }

  // 3. COMS Question Bank
  let comsBank = await prisma.questionBank.findFirst({ where: { courseId: comsCourse.id, code: "QB-COMS-01" } })
  if (!comsBank) {
    comsBank = await prisma.questionBank.create({
      data: {
        title: "COMS Operations & Supply Chain Management Item Bank",
        description: "Question bank addressing inventory models (EOQ, safety stock), capacity utilization, Six Sigma quality control, and Lean flow engineering.",
        code: "QB-COMS-01",
        courseId: comsCourse.id,
      },
    })
    console.log(`Created COMS Question Bank: ${comsBank.id}`)
  }

  const comsQuestions = [
    {
      question: "An operations facility has an annual demand of 8,000 units, an ordering cost of ₱50 per order, and an annual carrying cost of ₱2 per unit. What is the Economic Order Quantity (EOQ)?",
      difficulty: "MEDIUM" as const,
      points: 2.0,
      topic: "Inventory Management",
      explanation: "EOQ = √[(2 × D × S) / H] = √[(2 × 8,000 × 50) / 2] = √[800,000 / 2] = √400,000 = 632.45 ≈ 632 units.",
      formula: "EOQ = √[(2 × D × S) / H]",
      options: [
        { text: "400 units", isCorrect: false },
        { text: "632 units", isCorrect: true },
        { text: "800 units", isCorrect: false },
        { text: "1,200 units", isCorrect: false },
      ],
    },
    {
      question: "In the Six Sigma methodology, what is the maximum permissible number of defects per million opportunities (DPMO) for a process operating at 6-Sigma quality?",
      difficulty: "EASY" as const,
      points: 1.0,
      topic: "Quality Engineering",
      explanation: "A process operating at Six Sigma quality produces no more than 3.4 defects per million opportunities (DPMO), representing 99.99966% defect-free output.",
      formula: "Six Sigma Quality Benchmark = 3.4 DPMO",
      options: [
        { text: "3.4 DPMO", isCorrect: true },
        { text: "34 DPMO", isCorrect: false },
        { text: "66 DPMO", isCorrect: false },
        { text: "100 DPMO", isCorrect: false },
      ],
    },
    {
      question: "The step or stage in a production process that has the lowest capacity and limits the throughput rate of the entire system is known as the:",
      difficulty: "EASY" as const,
      points: 1.0,
      topic: "Process Flow Analysis",
      explanation: "The bottleneck is the process stage with the lowest effective capacity. Under the Theory of Constraints (TOC), the bottleneck dictates the maximum output of the entire operational chain.",
      formula: "System Capacity = Min(Stage 1, Stage 2, ..., Bottleneck Stage)",
      options: [
        { text: "Slack resource", isCorrect: false },
        { text: "Critical bottleneck", isCorrect: true },
        { text: "Buffer stock", isCorrect: false },
        { text: "Takt threshold", isCorrect: false },
      ],
    },
  ]

  for (const q of comsQuestions) {
    const existing = await prisma.bankQuestion.findFirst({ where: { bankId: comsBank.id, question: q.question } })
    if (!existing) {
      await prisma.bankQuestion.create({
        data: {
          bankId: comsBank.id,
          question: q.question,
          difficulty: q.difficulty,
          points: q.points,
          topic: q.topic,
          explanation: q.explanation,
          formula: q.formula,
          options: {
            create: q.options.map((o, idx) => ({ text: o.text, isCorrect: o.isCorrect, order: idx + 1 })),
          },
        },
      })
    }
  }

  console.log("✅ Question Banks seeded successfully with rich concepts, formulas, and rationales!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
