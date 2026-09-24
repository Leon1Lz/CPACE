import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"
import * as dotenv from "dotenv"
import {
  cfmsFinalQuestions,
  cfmsPracticeQuestions,
  cmmsFinalQuestions,
  cmmsPracticeQuestions,
  comsFinalQuestions,
  comsPracticeQuestions,
} from "./assessment-data"
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
        timeLimit: 90,
        attempts: 3,
        passingScore: 70,
        isPublished: true,
      },
      questions: cfmsFinalQuestions,
    },
    {
      courseTitle: "Certificate in Financial Management Services (CFMS)",
      exam: {
        title: "CFMS Practice Quiz",
        description: "A 30-item practice quiz covering financial statements, budgeting, liquidity, and capital investments. Unlimited attempts with no browser lock.",
        type: "PRACTICE_EXAM" as const,
        timeLimit: 45,
        attempts: null,
        passingScore: 70,
        isPublished: true,
      },
      questions: cfmsPracticeQuestions,
    },
    {
      courseTitle: "Certificate in Marketing Management Services (CMMS)",
      exam: {
        title: "CMMS Final Examination",
        description: "The official final exam for the Certificate in Marketing Management Services program. Passing this exam will issue your certificate.",
        type: "FINAL_EXAM" as const,
        timeLimit: 90,
        attempts: 3,
        passingScore: 70,
        isPublished: true,
      },
      questions: cmmsFinalQuestions,
    },
    {
      courseTitle: "Certificate in Marketing Management Services (CMMS)",
      exam: {
        title: "CMMS Practice Quiz",
        description: "A 30-item practice quiz covering marketing mix, digital advertising, segmentation, and consumer behavior. Unlimited attempts with no browser lock.",
        type: "PRACTICE_EXAM" as const,
        timeLimit: 45,
        attempts: null,
        passingScore: 70,
        isPublished: true,
      },
      questions: cmmsPracticeQuestions,
    },
    {
      courseTitle: "Certificate in Operations Management Services (COMS)",
      exam: {
        title: "COMS Final Examination",
        description: "The official final exam for the Certificate in Operations Management Services program. Passing this exam will issue your certificate.",
        type: "FINAL_EXAM" as const,
        timeLimit: 90,
        attempts: 3,
        passingScore: 70,
        isPublished: true,
      },
      questions: comsFinalQuestions,
    },
    {
      courseTitle: "Certificate in Operations Management Services (COMS)",
      exam: {
        title: "COMS Practice Quiz",
        description: "A 30-item practice quiz covering process analysis, quality management, supply chain, and lean manufacturing. Unlimited attempts with no browser lock.",
        type: "PRACTICE_EXAM" as const,
        timeLimit: 45,
        attempts: null,
        passingScore: 70,
        isPublished: true,
      },
      questions: comsPracticeQuestions,
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
