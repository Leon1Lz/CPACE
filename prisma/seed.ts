import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"
import * as dotenv from "dotenv"
dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding test users...")

  const hashedPassword = await bcrypt.hash("cpace1234", 12)

  const users = [
    {
      email: "admin@cpace.ph",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "CPACE",
      role: "ADMIN" as const,
    },
    {
      email: "instructor@cpace.ph",
      password: hashedPassword,
      firstName: "Maria",
      lastName: "Santos",
      role: "INSTRUCTOR" as const,
    },
    {
      email: "learner@cpace.ph",
      password: hashedPassword,
      firstName: "Juan",
      lastName: "Dela Cruz",
      role: "LEARNER" as const,
    },
    {
      email: "proctor@cpace.ph",
      password: hashedPassword,
      firstName: "Rosa",
      lastName: "Reyes",
      role: "PROCTOR" as const,
    },
  ]

  for (const user of users) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } })
    if (!existing) {
      await prisma.user.create({ data: user })
      console.log(`✅ Created: ${user.email} (${user.role})`)
    } else {
      console.log(`⏭️  Already exists: ${user.email}`)
    }
  }

  // Seed sample courses
  console.log("\n📚 Seeding sample courses...")
  const adminUser = await prisma.user.findUnique({ where: { email: "admin@cpace.ph" } })
  if (adminUser) {
    const sampleCourses = [
      {
        title: "Certificate in Financial Management Services (CFMS)",
        description: "Develop essential skills in financial planning, budgeting, and financial analysis for modern business environments.",
        content: "This course covers financial statement analysis, budgeting processes, cash flow management, and investment decision-making.",
        category: "CFMS",
        level: "Intermediate",
        duration: "12 weeks",
        price: 0,
        status: "PUBLISHED" as const,
        learningObjectives: ["Understand financial statements", "Apply budgeting techniques", "Analyze investment options"],
        creatorId: adminUser.id,
        instructorId: adminUser.id,
      },
      {
        title: "Certificate in Marketing Management Services (CMMS)",
        description: "Master modern marketing strategies, digital marketing fundamentals, and consumer behavior analysis.",
        content: "This course explores market research, branding, digital marketing channels, and campaign management.",
        category: "CMMS",
        level: "Beginner",
        duration: "10 weeks",
        price: 0,
        status: "PUBLISHED" as const,
        learningObjectives: ["Develop marketing strategies", "Understand digital marketing", "Conduct market research"],
        creatorId: adminUser.id,
        instructorId: adminUser.id,
      },
      {
        title: "Certificate in Operations Management Services (COMS)",
        description: "Learn to optimize business operations, supply chain management, and process improvement methodologies.",
        content: "This course covers operations strategy, supply chain logistics, quality management, and lean principles.",
        category: "COMS",
        level: "Advanced",
        duration: "14 weeks",
        price: 0,
        status: "PUBLISHED" as const,
        learningObjectives: ["Optimize operational processes", "Manage supply chains", "Apply lean methodology"],
        creatorId: adminUser.id,
        instructorId: adminUser.id,
      },
    ]

    for (const course of sampleCourses) {
      const existing = await prisma.course.findFirst({ where: { title: course.title } })
      if (!existing) {
        await prisma.course.create({ data: course })
        console.log(`✅ Created course: ${course.title}`)
      } else {
        console.log(`⏭️  Course already exists: ${course.title}`)
      }
    }
  }

  // Seed Final Exams for each course
  console.log("\n📝 Seeding final exams...")

  const examData = [
    {
      courseTitle: "Certificate in Financial Management Services (CFMS)",
      exam: {
        title: "CFMS Final Examination",
        description: "The official final exam for the Certificate in Financial Management Services program. Passing this exam will issue your certificate.",
        type: "FINAL_EXAM" as const,
        timeLimit: 60,
        attempts: 3,
        passingScore: 70,
        isPublished: true,
      },
      questions: [
        {
          question: "Which financial statement shows a company's revenues and expenses over a specific period?",
          type: "MULTIPLE_CHOICE" as const, order: 1, points: 1,
          options: [
            { text: "Balance Sheet", isCorrect: false, order: 1 },
            { text: "Income Statement", isCorrect: true, order: 2 },
            { text: "Cash Flow Statement", isCorrect: false, order: 3 },
            { text: "Statement of Retained Earnings", isCorrect: false, order: 4 },
          ],
        },
        {
          question: "What does liquidity refer to in financial management?",
          type: "MULTIPLE_CHOICE" as const, order: 2, points: 1,
          options: [
            { text: "The ability to generate long-term profit", isCorrect: false, order: 1 },
            { text: "The ease of converting assets into cash", isCorrect: true, order: 2 },
            { text: "The total debt a company holds", isCorrect: false, order: 3 },
            { text: "The market value of a company", isCorrect: false, order: 4 },
          ],
        },
        {
          question: "A budget that adjusts based on actual activity levels is called a:",
          type: "MULTIPLE_CHOICE" as const, order: 3, points: 1,
          options: [
            { text: "Static Budget", isCorrect: false, order: 1 },
            { text: "Master Budget", isCorrect: false, order: 2 },
            { text: "Flexible Budget", isCorrect: true, order: 3 },
            { text: "Capital Budget", isCorrect: false, order: 4 },
          ],
        },
        {
          question: "Net Present Value (NPV) is used to evaluate:",
          type: "MULTIPLE_CHOICE" as const, order: 4, points: 1,
          options: [
            { text: "Employee performance", isCorrect: false, order: 1 },
            { text: "The profitability of an investment over time", isCorrect: true, order: 2 },
            { text: "Current ratio of assets", isCorrect: false, order: 3 },
            { text: "Tax liability of a company", isCorrect: false, order: 4 },
          ],
        },
        {
          question: "The current ratio is calculated as:",
          type: "MULTIPLE_CHOICE" as const, order: 5, points: 1,
          options: [
            { text: "Total Assets / Total Liabilities", isCorrect: false, order: 1 },
            { text: "Net Income / Total Revenue", isCorrect: false, order: 2 },
            { text: "Current Assets / Current Liabilities", isCorrect: true, order: 3 },
            { text: "Operating Income / Total Expenses", isCorrect: false, order: 4 },
          ],
        },
        {
          question: "True or False: Depreciation is a non-cash expense.",
          type: "TRUE_FALSE" as const, order: 6, points: 1,
          options: [
            { text: "True", isCorrect: true, order: 1 },
            { text: "False", isCorrect: false, order: 2 },
          ],
        },
        {
          question: "Which of the following is an example of a fixed cost?",
          type: "MULTIPLE_CHOICE" as const, order: 7, points: 1,
          options: [
            { text: "Raw materials", isCorrect: false, order: 1 },
            { text: "Sales commissions", isCorrect: false, order: 2 },
            { text: "Monthly office rent", isCorrect: true, order: 3 },
            { text: "Shipping costs", isCorrect: false, order: 4 },
          ],
        },
        {
          question: "Working capital is defined as:",
          type: "MULTIPLE_CHOICE" as const, order: 8, points: 1,
          options: [
            { text: "Total Revenue minus Total Expenses", isCorrect: false, order: 1 },
            { text: "Current Assets minus Current Liabilities", isCorrect: true, order: 2 },
            { text: "Total Assets minus Total Equity", isCorrect: false, order: 3 },
            { text: "Net Income minus Depreciation", isCorrect: false, order: 4 },
          ],
        },
        {
          question: "True or False: A higher debt-to-equity ratio always means a company is financially healthy.",
          type: "TRUE_FALSE" as const, order: 9, points: 1,
          options: [
            { text: "True", isCorrect: false, order: 1 },
            { text: "False", isCorrect: true, order: 2 },
          ],
        },
        {
          question: "Which method of inventory valuation assumes the most recently purchased goods are sold first?",
          type: "MULTIPLE_CHOICE" as const, order: 10, points: 1,
          options: [
            { text: "FIFO (First-In, First-Out)", isCorrect: false, order: 1 },
            { text: "LIFO (Last-In, First-Out)", isCorrect: true, order: 2 },
            { text: "Weighted Average", isCorrect: false, order: 3 },
            { text: "Specific Identification", isCorrect: false, order: 4 },
          ],
        },
      ],
    },
    {
      courseTitle: "Certificate in Marketing Management Services (CMMS)",
      exam: {
        title: "CMMS Final Examination",
        description: "The official final exam for the Certificate in Marketing Management Services program. Passing this exam will issue your certificate.",
        type: "FINAL_EXAM" as const,
        timeLimit: 60,
        attempts: 3,
        passingScore: 70,
        isPublished: true,
      },
      questions: [
        {
          question: "The 4 Ps of the marketing mix are:",
          type: "MULTIPLE_CHOICE" as const, order: 1, points: 1,
          options: [
            { text: "Price, People, Place, Promotion", isCorrect: false, order: 1 },
            { text: "Product, Price, Place, Promotion", isCorrect: true, order: 2 },
            { text: "Product, Profit, Place, People", isCorrect: false, order: 3 },
            { text: "Process, Price, Place, Promotion", isCorrect: false, order: 4 },
          ],
        },
        {
          question: "Market segmentation divides the market based on:",
          type: "MULTIPLE_CHOICE" as const, order: 2, points: 1,
          options: [
            { text: "Only age and gender", isCorrect: false, order: 1 },
            { text: "Only geographic location", isCorrect: false, order: 2 },
            { text: "Demographic, psychographic, geographic, and behavioral factors", isCorrect: true, order: 3 },
            { text: "Company revenue and size only", isCorrect: false, order: 4 },
          ],
        },
        {
          question: "A SWOT analysis evaluates:",
          type: "MULTIPLE_CHOICE" as const, order: 3, points: 1,
          options: [
            { text: "Sales, Workforce, Operations, Technology", isCorrect: false, order: 1 },
            { text: "Strengths, Weaknesses, Opportunities, Threats", isCorrect: true, order: 2 },
            { text: "Strategy, Workflow, Output, Timeline", isCorrect: false, order: 3 },
            { text: "Supply, Wholesale, Overhead, Trade", isCorrect: false, order: 4 },
          ],
        },
        {
          question: "True or False: SEO stands for Search Engine Optimization.",
          type: "TRUE_FALSE" as const, order: 4, points: 1,
          options: [
            { text: "True", isCorrect: true, order: 1 },
            { text: "False", isCorrect: false, order: 2 },
          ],
        },
        {
          question: "Which of the following best describes a brand?",
          type: "MULTIPLE_CHOICE" as const, order: 5, points: 1,
          options: [
            { text: "Only the logo and color scheme of a company", isCorrect: false, order: 1 },
            { text: "The name, symbol, and overall identity that distinguishes a product", isCorrect: true, order: 2 },
            { text: "The price strategy used by a company", isCorrect: false, order: 3 },
            { text: "A company's distribution channel", isCorrect: false, order: 4 },
          ],
        },
        {
          question: "The primary goal of a customer relationship management (CRM) system is to:",
          type: "MULTIPLE_CHOICE" as const, order: 6, points: 1,
          options: [
            { text: "Track employee performance", isCorrect: false, order: 1 },
            { text: "Manage customer interactions and improve retention", isCorrect: true, order: 2 },
            { text: "Automate product manufacturing", isCorrect: false, order: 3 },
            { text: "Reduce marketing expenditure", isCorrect: false, order: 4 },
          ],
        },
        {
          question: "True or False: Content marketing focuses on creating valuable content to attract and engage a target audience.",
          type: "TRUE_FALSE" as const, order: 7, points: 1,
          options: [
            { text: "True", isCorrect: true, order: 1 },
            { text: "False", isCorrect: false, order: 2 },
          ],
        },
        {
          question: "A product's unique selling proposition (USP) refers to:",
          type: "MULTIPLE_CHOICE" as const, order: 8, points: 1,
          options: [
            { text: "Its lowest price in the market", isCorrect: false, order: 1 },
            { text: "The feature that makes it distinct from competitors", isCorrect: true, order: 2 },
            { text: "The number of distribution channels it uses", isCorrect: false, order: 3 },
            { text: "The size of its target demographic", isCorrect: false, order: 4 },
          ],
        },
        {
          question: "Which social media metric measures the percentage of people who clicked a link out of total viewers?",
          type: "MULTIPLE_CHOICE" as const, order: 9, points: 1,
          options: [
            { text: "Reach", isCorrect: false, order: 1 },
            { text: "Impressions", isCorrect: false, order: 2 },
            { text: "Click-Through Rate (CTR)", isCorrect: true, order: 3 },
            { text: "Engagement Rate", isCorrect: false, order: 4 },
          ],
        },
        {
          question: "Market penetration strategy aims to:",
          type: "MULTIPLE_CHOICE" as const, order: 10, points: 1,
          options: [
            { text: "Enter a new market with a new product", isCorrect: false, order: 1 },
            { text: "Increase market share for existing products in existing markets", isCorrect: true, order: 2 },
            { text: "Develop a new product for a new market", isCorrect: false, order: 3 },
            { text: "Diversify into unrelated business areas", isCorrect: false, order: 4 },
          ],
        },
      ],
    },
    {
      courseTitle: "Certificate in Operations Management Services (COMS)",
      exam: {
        title: "COMS Final Examination",
        description: "The official final exam for the Certificate in Operations Management Services program. Passing this exam will issue your certificate.",
        type: "FINAL_EXAM" as const,
        timeLimit: 60,
        attempts: 3,
        passingScore: 70,
        isPublished: true,
      },
      questions: [
        {
          question: "Which operations management concept focuses on eliminating waste and improving efficiency?",
          type: "MULTIPLE_CHOICE" as const, order: 1, points: 1,
          options: [
            { text: "Six Sigma", isCorrect: false, order: 1 },
            { text: "Lean Manufacturing", isCorrect: true, order: 2 },
            { text: "Total Quality Management", isCorrect: false, order: 3 },
            { text: "Just-in-Time", isCorrect: false, order: 4 },
          ],
        },
        {
          question: "A Gantt chart is primarily used for:",
          type: "MULTIPLE_CHOICE" as const, order: 2, points: 1,
          options: [
            { text: "Financial forecasting", isCorrect: false, order: 1 },
            { text: "Project scheduling and tracking", isCorrect: true, order: 2 },
            { text: "Customer segmentation", isCorrect: false, order: 3 },
            { text: "Quality inspection", isCorrect: false, order: 4 },
          ],
        },
        {
          question: "True or False: Supply chain management involves coordinating the flow of goods, information, and finances from supplier to customer.",
          type: "TRUE_FALSE" as const, order: 3, points: 1,
          options: [
            { text: "True", isCorrect: true, order: 1 },
            { text: "False", isCorrect: false, order: 2 },
          ],
        },
        {
          question: "Which inventory system triggers a reorder when stock reaches a predetermined level?",
          type: "MULTIPLE_CHOICE" as const, order: 4, points: 1,
          options: [
            { text: "Periodic Review System", isCorrect: false, order: 1 },
            { text: "Continuous Review System (Reorder Point)", isCorrect: true, order: 2 },
            { text: "ABC Analysis", isCorrect: false, order: 3 },
            { text: "FIFO System", isCorrect: false, order: 4 },
          ],
        },
        {
          question: "The PDCA cycle stands for:",
          type: "MULTIPLE_CHOICE" as const, order: 5, points: 1,
          options: [
            { text: "Plan, Do, Check, Act", isCorrect: true, order: 1 },
            { text: "Process, Develop, Control, Analyze", isCorrect: false, order: 2 },
            { text: "Prepare, Deploy, Confirm, Adjust", isCorrect: false, order: 3 },
            { text: "Prioritize, Define, Create, Assess", isCorrect: false, order: 4 },
          ],
        },
        {
          question: "True or False: Bottlenecks in a process reduce the overall throughput of the system.",
          type: "TRUE_FALSE" as const, order: 6, points: 1,
          options: [
            { text: "True", isCorrect: true, order: 1 },
            { text: "False", isCorrect: false, order: 2 },
          ],
        },
        {
          question: "Total Quality Management (TQM) is a management approach that focuses on:",
          type: "MULTIPLE_CHOICE" as const, order: 7, points: 1,
          options: [
            { text: "Reducing workforce size", isCorrect: false, order: 1 },
            { text: "Long-term success through customer satisfaction and continuous improvement", isCorrect: true, order: 2 },
            { text: "Maximizing short-term profits", isCorrect: false, order: 3 },
            { text: "Outsourcing non-core operations", isCorrect: false, order: 4 },
          ],
        },
        {
          question: "Which of the following is NOT one of the 5S principles?",
          type: "MULTIPLE_CHOICE" as const, order: 8, points: 1,
          options: [
            { text: "Sort", isCorrect: false, order: 1 },
            { text: "Sustain", isCorrect: false, order: 2 },
            { text: "Standardize", isCorrect: false, order: 3 },
            { text: "Strategize", isCorrect: true, order: 4 },
          ],
        },
        {
          question: "Capacity planning ensures that:",
          type: "MULTIPLE_CHOICE" as const, order: 9, points: 1,
          options: [
            { text: "Products are priced competitively", isCorrect: false, order: 1 },
            { text: "Operations can meet customer demand efficiently", isCorrect: true, order: 2 },
            { text: "Marketing campaigns reach the right audience", isCorrect: false, order: 3 },
            { text: "Financial statements are accurate", isCorrect: false, order: 4 },
          ],
        },
        {
          question: "Enterprise Resource Planning (ERP) systems are used to:",
          type: "MULTIPLE_CHOICE" as const, order: 10, points: 1,
          options: [
            { text: "Monitor employee social media activity", isCorrect: false, order: 1 },
            { text: "Integrate and manage core business processes across departments", isCorrect: true, order: 2 },
            { text: "Design product packaging", isCorrect: false, order: 3 },
            { text: "Conduct market surveys", isCorrect: false, order: 4 },
          ],
        },
      ],
    },
  ]

  for (const examEntry of examData) {
    const course = await prisma.course.findFirst({ where: { title: examEntry.courseTitle } })
    if (!course) {
      console.log(`⚠️  Course not found: ${examEntry.courseTitle}`)
      continue
    }

    const existingExam = await prisma.assessment.findFirst({
      where: { title: examEntry.exam.title, courseId: course.id },
    })

    if (existingExam) {
      console.log(`⏭️  Exam already exists: ${examEntry.exam.title}`)
      continue
    }

    const assessment = await prisma.assessment.create({
      data: {
        ...examEntry.exam,
        courseId: course.id,
        questions: {
          create: examEntry.questions.map(q => ({
            question: q.question,
            type: q.type,
            order: q.order,
            points: q.points,
            options: { create: q.options },
          })),
        },
      },
    })
    console.log(`✅ Created final exam: ${assessment.title} (${examEntry.questions.length} questions)`)
  }

  console.log("\n🎉 Done! Test credentials:")
  console.log("  Admin:      admin@cpace.ph      / cpace1234")
  console.log("  Instructor: instructor@cpace.ph / cpace1234")
  console.log("  Learner:    learner@cpace.ph    / cpace1234")
  console.log("  Proctor:    proctor@cpace.ph    / cpace1234")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
