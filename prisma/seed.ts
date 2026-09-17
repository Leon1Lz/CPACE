import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"
import * as dotenv from "dotenv"
dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Seed script runs locally during development only — allow self-signed certs
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

  // Seed articles/insights
  console.log("\n🌱 Seeding articles/insights...")
  const seedArticles = [
    {
      slug: "cpace-san-beda-partnership",
      title: "CPACE Philippines and San Beda University Manila Forge Partnership to Expand Microcredential Opportunities for Students",
      excerpt: "With this collaboration, CPACE Philippines and San Beda University Manila reaffirm their dedication to empowering…",
      content: "CPACE Philippines and San Beda University have officially formalized a strategic partnership through the signing of a Memorandum of Agreement (MOA), marking a significant step toward strengthening industry-academe collaboration.\n\nThe partnership aims to provide San Beda students with enhanced access to globally aligned certification programs and microcredential opportunities. Through this initiative, students will be able to complement their academic degrees with industry-relevant certifications, equipping them with practical skills and competencies demanded in today’s evolving workforce.\n\nThis collaboration underscores both institutions’ shared commitment to bridging the gap between academic learning and real-world application. By integrating CPACE’s professional certification programs into the university ecosystem, students are expected to gain a competitive edge as they prepare to enter their respective industries.\n\nSan Beda University, known for its strong academic foundation and commitment to holistic student development, continues to expand its industry linkages to ensure that graduates are future-ready. Meanwhile, CPACE Philippines continues to broaden its reach across educational institutions, reinforcing its mission to elevate professional standards through accessible and high-quality certification programs.\n\nThe partnership reflects a growing trend among higher education institutions to align closely with industry leaders—ensuring that graduates are not only academically prepared but also equipped with globally competitive credentials.\n\nWith this collaboration, CPACE Philippines and San Beda University Manila reaffirm their dedication to empowering the next generation of professionals through innovation, excellence, and meaningful partnerships.",
      category: "Partnership",
      categoryColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
      iconName: "users",
      image: "/assets/articles/San Beda University - March 18.jpg",
      featured: true,
    },
    {
      slug: "beyond-job-titles",
      title: "Beyond Job Titles: Orchestrating People, Tech, and Purpose",
      excerpt: "We're living in a liminal hour where titles matter less than capability. This piece argues…",
      content: "We're living in a liminal hour where titles matter less than capability. This piece argues that modern organizations must focus on orchestrating people, technology, and purpose as a single ecosystem rather than working in silos.\n\nTo build future-proof teams, organizations need to move away from static job descriptions and embrace a dynamic skill-based architecture. Aligning people's innate talent with technology empowers them to achieve higher productivity and organizational goals.\n\nUltimately, purpose remains the ultimate compass. A strong, shared vision unites teams and ensures technology acts as an enabler rather than a disruptor.",
      category: "Industry Insights",
      categoryColor: "bg-blue-100 text-blue-700 border-blue-200",
      iconName: "trending-up",
      image: "/assets/articles/Beyond the Paycheck.jpg",
      featured: false,
    },
    {
      slug: "fintech-revolution-summit-2026",
      title: "Fintech Revolution Summit – Philippines 2026",
      excerpt: "The Fintech Revolution Summit is set to return to Manila on April 30, 2026, at…",
      content: "The Fintech Revolution Summit is set to return to Manila on April 30, 2026, bringing together industry leaders, innovators, and policymakers from across the region.\n\nThe summit will focus on the rapid growth of digital banking, decentralized finance, and blockchain integrations within the Philippine financial sector. Key speakers will address the challenges of cybersecurity, financial inclusion, and the regulatory frameworks required to sustain digital transformation.\n\nAttendees can expect deep-dive panels, networking opportunities, and showcase exhibitions of the latest fintech solutions poised to redefine banking and commerce.",
      category: "Events",
      categoryColor: "bg-violet-100 text-violet-700 border-violet-200",
      iconName: "zap",
      image: "/assets/articles/Modernizing Finance.jpg",
      featured: false,
    },
    {
      slug: "chro-philippines-2026",
      title: "CHRO Philippines 2026: Navigating the Future of HR in the Philippines",
      excerpt: "CHRO Philippines 2026: Navigating the Future of HR in the Philippines 27–28 January…",
      content: "CHRO Philippines 2026: Navigating the Future of HR in the Philippines will be hosted on January 27–28, 2026. The conference highlights the critical role of human resource leaders in shaping agile and remote-friendly organizational cultures.\n\nTopics will include modern talent acquisition strategies, mental health and wellness in the workplace, and leveraging AI for HR analytics. As the hybrid work model becomes a permanent fixture in the country, HR professionals must acquire new competencies to keep their workforce motivated, collaborative, and highly engaged.\n\nJoin senior executives and industry pioneers to discuss strategies, build networks, and share insights.",
      category: "Events",
      categoryColor: "bg-violet-100 text-violet-700 border-violet-200",
      iconName: "zap",
      image: "/assets/articles/CHRO Philippines 2026.jpg",
      featured: false,
    },
    {
      slug: "cpace-gordon-college-cfms",
      title: "CPACE Philippines, Gordon College host CFMS exam among graduating students",
      excerpt: "The CPACE Philippines has partnered with Gordon College to host the CFMS exam among graduating students…",
      content: "The CPACE Philippines has partnered with Gordon College to host the CFMS exam among graduating students, facilitating direct access to professional credentials.\n\nThis initiative bridges the gap between traditional academic curricula and modern business requirements. By enabling graduating seniors to earn the Certificate in Financial Management Services (CFMS) alongside their college degree, the program ensures they enter the job market with validated, high-demand skills.\n\nRepresentatives from both Gordon College and CPACE expressed high expectations for the program's success and its long-term benefits to student employment rates.",
      category: "Partnership",
      categoryColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
      iconName: "users",
      image: "/assets/articles/Gordon College  - Dec 12.jpg",
      featured: false,
    },
    {
      slug: "batstateu-cpace-accord",
      title: "BatStateU, CPACE Philippines seal accord to expand students' career growth",
      excerpt: "The CPACE Philippines has signed an accord with BatStateU to expand students' career growth opportunities…",
      content: "The CPACE Philippines has signed an accord with BatStateU to expand students' career growth opportunities through globally aligned credentials.\n\nUnder this agreement, BatStateU will integrate CPACE certification pathways into their business and technology departments. Students will gain first-hand access to specialized materials and exam seats, facilitating credentials that are highly valued by corporate recruiters.\n\nThis partnership reinforces BatStateU's dedication to quality education and future-ready career readiness for all its students.",
      category: "Partnership",
      categoryColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
      iconName: "users",
      image: "/assets/articles/BatStateU Dec 2_feature.jpg",
      featured: false,
    },
    {
      slug: "nemsu-tagbina-cpace-collab",
      title: "NEMSU Tagbina in Mindanao to collab with CPACE Philippines after fruitful first CFMS® exam",
      excerpt: "A fruitful first CFMS® exam paves the way for a lasting collaboration between NEMSU Tagbina and CPACE Philippines…",
      content: "A fruitful first CFMS® exam paves the way for a lasting collaboration between NEMSU Tagbina and CPACE Philippines, extending professional education to Mindanao.\n\nFollowing the outstanding performance of NEMSU Tagbina students in the recent CFMS exam, both organizations have agreed to establish a continuous framework for certification hosting and training.\n\nThis milestone represents a major step forward in making premium professional training accessible to students and instructors in regional educational hubs.",
      category: "Partnership",
      categoryColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
      iconName: "users",
      image: "/assets/articles/NEMSU Nov 28.jpg",
      featured: false,
    },
    {
      slug: "stop-forwarding-emails",
      title: "Stop Forwarding Emails: How cloudHQ Gmail Label Sharing Syncs Your Entire Team",
      excerpt: "In the modern workplace, email remains a cornerstone of communication. cloudHQ's Gmail Label Sharing changes the game…",
      content: "In the modern workplace, email remains a cornerstone of communication, but forwarding threads can quickly lead to version confusion and lost context. cloudHQ's Gmail Label Sharing changes the game by syncronizing entire labels between team members in real-time.\n\nBy sharing a Gmail label, any email sorted into that label automatically appears in your team's folders. This eliminates redundant forwards, speeds up client communication, and ensures all team members have access to up-to-date communication logs without leaving their preferred email client.\n\nDiscover how this tech can streamline collaboration and save hours of administrative overhead every week.",
      category: "Technology",
      categoryColor: "bg-orange-100 text-orange-700 border-orange-200",
      iconName: "globe",
      image: "/assets/articles/CloudHQ Nov 25.jpg",
      featured: false,
    },
    {
      slug: "cpace-wlc-partnership",
      title: "CPACE Philippines, WLC Partner to Future-Proof Financial Mgmt Curriculum",
      excerpt: "The CPACE Philippines has officially signed a partnership with WLC to future-proof the Financial Management curriculum…",
      content: "The CPACE Philippines has officially signed a partnership with WLC to future-proof the Financial Management curriculum with industry-relevant skills.\n\nThe collaboration introduces certified course modules that align with current international practices in corporate finance, budgeting, and risk analysis. By blending theory with practice, WLC students will graduate with the practical tools and credentials needed to excel in competitive finance sectors.\n\nBoth institutions aim to raise the bar for financial education and support local businesses with highly competent finance professionals.",
      category: "Partnership",
      categoryColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
      iconName: "users",
      image: "/assets/articles/WLC.jpg",
      featured: false,
    },
  ]

  for (const article of seedArticles) {
    const existing = await prisma.article.findUnique({ where: { slug: article.slug } })
    if (existing) {
      console.log(`⏭️  Article already exists: ${article.title}`)
      continue
    }
    await prisma.article.create({ data: article })
    console.log(`✅ Created article: ${article.title}`)
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
