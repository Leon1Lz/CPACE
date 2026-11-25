export interface QualificationCategory {
  code: "Category A" | "Category B" | "Category C" | "Category D"
  title: string
  description: string
}

export interface CertificationFaq {
  question: string
  answer: string
}

export interface CertificationCourse {
  slug: string
  aliases?: string[]
  acronym: string
  parenthesizedAcronym: string
  fullName: string
  category: string
  shortDescription: string
  heroSubtitle: string
  badgeImage: string
  gradient: string
  lightBg: string
  lightText: string
  lightBorder: string
  formats: string
  highlights: string[]
  pillars: {
    title: string
    description: string
  }[]
  examFormat: {
    overview: string
    duration: string
    questions?: string
    passingMark: string
    validity: string
    authorization: string
  }
  coverageTopics: string[]
  processSteps: {
    step: string
    title: string
    detail: string
  }[]
  investment: string
  submissionEmail: string
  registerUrl: string
  brochureUrl?: string
  qualificationCategories: QualificationCategory[]
  faqs: CertificationFaq[]
}

export const CERTIFICATION_CATEGORIES = [
  "All Programs",
  "Finance",
  "Marketing",
  "Operations",
  "Hospitality & Tourism",
  "HR & Labor Law",
] as const

export const certificationCourses: CertificationCourse[] = [
  {
    slug: "cfms",
    acronym: "CFMS®",
    parenthesizedAcronym: "(CFMS)®",
    fullName: "Certified Financial Management Specialist",
    category: "Finance",
    shortDescription:
      "Validate your expertise in financial management, budgeting, financial analysis, and strategic financial planning. The CFMS® credential distinguishes professionals who demonstrate advanced competency in managing organizational finances.",
    heroSubtitle:
      "Validate your expertise in financial management, corporate finance, and investment strategies with the CFMS® credential — designed for professionals seeking to enhance decision-making, profitability, and career growth in the finance sector.",
    badgeImage: "/assets/badges/cfms-badge.png",
    gradient: "from-emerald-600 to-teal-700",
    lightBg: "bg-emerald-50",
    lightText: "text-emerald-700",
    lightBorder: "border-emerald-200",
    formats: "Online, In-person, Hybrid",
    highlights: [
      "Financial Analysis and Reporting",
      "Budgeting and Forecasting",
      "Strategic Financial Planning",
      "Risk and Compliance Management",
    ],
    pillars: [
      {
        title: "Industry-Recognized Certification",
        description:
          "The Certified Financial Management Specialist (CFMS)® is an industry-recognized credential that validates your expertise and commitment to the highest standards of financial management.",
      },
      {
        title: "Online & In-Person Assessment",
        description:
          "Take the CFMS® exam securely online through CPACE's Learning Management System (LMS). In-person assessments and special schedules can also be conducted as requested by the school.",
      },
      {
        title: "Professional Development",
        description:
          "Earning your CFMS® is a commitment to continuous professional development, keeping your skills sharp and current in a dynamic financial industry.",
      },
    ],
    examFormat: {
      overview:
        "The CERTIFIED FINANCIAL MANAGEMENT SPECIALIST (CFMS)® is an assessment exam of core knowledge in financial management conducted by the Center for Professional Advancement and Continuing Education, Inc. (CPACE Philippines). The exam evaluates the essential competencies that both aspiring and practicing finance professionals must possess.",
      duration: "2 Hours (120 Minutes)",
      questions: "120 Multiple-Choice Questions",
      passingMark: "75% Rating (A minimum score of 60 points is required to pass.)",
      validity: "Lifetime Validity (No renewal required)",
      authorization:
        "Examinees who pass and earn formal certification are authorized to use the professional post-nominal title Certified Financial Management Specialist (CFMS)®.",
    },
    coverageTopics: [
      "Capital Markets",
      "Behavioral Finance",
      "Income and Business Taxation",
      "Financial Analysis and Reporting",
      "Banking and Financial Institutions",
      "Fundamentals of Corporate Finance",
      "Financial Policy and Central Banking",
      "Investment and Portfolio Management",
      "Cash and Working Capital Management",
    ],
    processSteps: [
      {
        step: "01",
        title: "Register Online",
        detail: "Complete the online registration form and settle the learning investment of Php 1,680.00.",
      },
      {
        step: "02",
        title: "Submit Requirements & Payment Confirmation",
        detail: "Email your documentary requirements and proof of payment to cfms@cpaceph.com.",
      },
      {
        step: "03",
        title: "Verification & Slot Confirmation",
        detail: "Your payment and documents will be validated within 2–3 business days.",
      },
      {
        step: "04",
        title: "Access Self-Review Materials",
        detail: "You will receive your official self-review materials, references, and exam schedule upon confirmation of your slot.",
      },
    ],
    investment: "Php 1,680.00",
    submissionEmail: "cfms@cpaceph.com",
    registerUrl: "https://bit.ly/cfmsbycpace",
    brochureUrl: "https://bit.ly/cfmsinfosheet",
    qualificationCategories: [
      {
        code: "Category A",
        title: "Undergraduate & Graduating Students",
        description:
          "Graduates or currently graduating students in Financial Management, Banking and Finance, Accountancy, Accounting Technology, Economics with Finance specialization, or any accounting and finance-related degree.",
      },
      {
        code: "Category B",
        title: "Graduate & Postgraduate Scholars",
        description:
          "Graduates or graduate school students of MS in Finance, MS in Computational Finance, Master's in Business Administration (MBA) with Finance specialization, or a PhD in Finance and Banking.",
      },
      {
        code: "Category C",
        title: "Academic Faculty & Educators",
        description:
          "Faculty members teaching Financial Management, Banking and Finance, Corporate Finance, Accounting, or any other finance-related subjects.",
      },
      {
        code: "Category D",
        title: "Industry Practitioners & Professionals",
        description:
          "Any 4-year degree holder with at least 1 year of working experience in the field of financial management — including employees, officers, managers, supervisors, department heads, or any related positions in finance.",
      },
    ],
    faqs: [
      {
        question:
          "Does the Professional Regulation Commission (PRC) or the Civil Service Commission (CSC) oversee the Certified Financial Management Specialist (CFMS)® Assessment Exam?",
        answer:
          "The certification does not fall under the purview of the Professional Regulation Commission or the Civil Service Commission. This is not a government professional license or civil service eligibility. It is an industry assessment examination and credential of your competencies in financial management, initiated by the Center for Professional Advancement and Continuing Education, Inc. (CPACE Philippines).",
      },
      {
        question: "What are the advantages of taking CFMS®?",
        answer:
          "Earning a professional certification validates your mastery of financial management and enhances your credentials, providing a competitive edge in the job market. Passing the certification exam establishes your credibility and demonstrates a commitment to continuous learning valued by employers. Your name will also be included in the official roster of certified individuals shared with our partner institutions.",
      },
      {
        question: "What is the passing mark?",
        answer: "75% Rating (A minimum score of 60 points is required to pass.)",
      },
      {
        question: "Is there a limit to how many times we can take the CFMS®?",
        answer: "There is no limit to taking the assessment examination.",
      },
      {
        question: "How do we know that we passed the examination?",
        answer:
          "You will be notified officially via email. Passers are also recognized on CPACE Philippines' official website and social media platforms.",
      },
      {
        question: "What is the validity period?",
        answer: "The validity is lifetime. No renewal is required.",
      },
    ],
  },
  {
    slug: "cmms",
    acronym: "CMMS®",
    parenthesizedAcronym: "(CMMS)®",
    fullName: "Certified Marketing Management Specialist",
    category: "Marketing",
    shortDescription:
      "Demonstrate your proficiency in modern marketing management, digital marketing strategy, brand development, and consumer insights. The CMMS® certification equips professionals to lead impactful marketing initiatives.",
    heroSubtitle:
      "Validate skills in market research, brand strategy, digital marketing, and campaign execution with the CMMS® certification — built for professionals aiming to boost brand visibility, engagement, and revenue growth.",
    badgeImage: "/assets/badges/cmms-badge.png",
    gradient: "from-blue-600 to-cyan-700",
    lightBg: "bg-blue-50",
    lightText: "text-blue-700",
    lightBorder: "border-blue-200",
    formats: "Online, In-person, Hybrid",
    highlights: [
      "Digital Marketing Strategy",
      "Brand Management and Development",
      "Consumer Behavior and Insights",
      "Marketing Analytics and ROI",
    ],
    pillars: [
      {
        title: "Industry-Recognized Certification",
        description:
          "The Certified Marketing Management Specialist (CMMS)® is an industry-recognized credential that validates your expertise and commitment to the highest standards of marketing management.",
      },
      {
        title: "Online & In-Person Assessment",
        description:
          "Take the CMMS® exam securely online through CPACE's Learning Management System (LMS). In-person assessments and special institutional schedules can also be conducted as requested by partner schools.",
      },
      {
        title: "Professional Development",
        description:
          "Earning your CMMS® demonstrates continuous professional growth, keeping your strategic marketing and digital branding capabilities sharp in a fast-moving marketplace.",
      },
    ],
    examFormat: {
      overview:
        "The CERTIFIED MARKETING MANAGEMENT SPECIALIST (CMMS)® is an assessment examination of core knowledge in marketing management conducted by the Center for Professional Advancement and Continuing Education, Inc. (CPACE Philippines). The examination evaluates the fundamental competencies that an aspiring or practicing marketing professional must possess.",
      duration: "2 Hours (120 Minutes)",
      questions: "120 Multiple-Choice Questions",
      passingMark: "75% Rating (A minimum score of 60 points is required to pass.)",
      validity: "Lifetime Validity (No renewal required)",
      authorization:
        "Examinees who pass and earn formal certification are authorized to use the professional post-nominal title Certified Marketing Management Specialist (CMMS)®.",
    },
    coverageTopics: [
      "Consumer Decision Making",
      "Business Marketing",
      "Segmenting and Targeting Markets",
      "Marketing Research",
      "Product Concepts",
      "Developing and Managing Products",
      "Pricing Concepts",
      "Marketing Communications",
      "Services and Nonprofit Organization Marketing",
      "Advertising, Public Relations, and Sales Promotion",
      "Digital Marketing",
      "Social Media and Marketing",
    ],
    processSteps: [
      {
        step: "01",
        title: "Register Online",
        detail: "Complete the online registration form and settle the learning investment of Php 1,680.00.",
      },
      {
        step: "02",
        title: "Submit Requirements & Payment Confirmation",
        detail: "Email your documentary requirements and proof of payment to cmms@cpaceph.com.",
      },
      {
        step: "03",
        title: "Verification & Slot Confirmation",
        detail: "Your payment and documents will be validated within 2–3 business days.",
      },
      {
        step: "04",
        title: "Access Self-Review Materials",
        detail: "You will receive your official self-review materials, references, and exam schedule upon confirmation of your slot.",
      },
    ],
    investment: "Php 1,680.00",
    submissionEmail: "cmms@cpaceph.com",
    registerUrl: "https://bit.ly/cmmsbycpace",
    brochureUrl: "https://bit.ly/cmmsinfosheet",
    qualificationCategories: [
      {
        code: "Category A",
        title: "Undergraduate & Graduating Students",
        description:
          "Graduates or graduating students of Marketing Management, Digital Marketing, Entrepreneurial Marketing, Entrepreneurship, Integrated Marketing Communication, or any marketing-related degree.",
      },
      {
        code: "Category B",
        title: "Graduate & Postgraduate Scholars",
        description:
          "Graduates or graduate school students of MBA, MA in Marketing, MA in Marketing Communication, Master's in Business Administration with Marketing specializations, or a PhD in Business and Marketing.",
      },
      {
        code: "Category C",
        title: "Academic Faculty & Educators",
        description:
          "Faculty members teaching Marketing Management, Digital Marketing, Marketing Communication, Brand Management, or any other marketing-related subjects.",
      },
      {
        code: "Category D",
        title: "Industry Practitioners & Professionals",
        description:
          "Any 4-year degree holder with at least 1 year of working experience in the field of marketing — including employees, officers, managers, supervisors, department heads, or any related positions in marketing.",
      },
    ],
    faqs: [
      {
        question:
          "Does the Professional Regulation Commission (PRC) or the Civil Service Commission (CSC) oversee the Certified Marketing Management Specialist (CMMS)® Assessment Exam?",
        answer:
          "The certification does not fall under the purview of the Professional Regulation Commission or the Civil Service Commission. This is not a government professional license or civil service eligibility. It is an industry assessment examination and credential of your skills in marketing management, initiated by the Center for Professional Advancement and Continuing Education, Inc. (CPACE Philippines).",
      },
      {
        question: "What are the advantages of taking CMMS®?",
        answer:
          "Earning a professional certification validates your mastery of marketing management and enhances your credentials, providing a competitive edge in the job market. Passing the exam establishes your credibility and demonstrates a commitment to continuous learning valued by employers. Your name will also be included in the official list of certified professionals shared with our partner institutions.",
      },
      {
        question: "What is the passing mark?",
        answer: "75% Rating (A minimum score of 60 points is required to pass.)",
      },
      {
        question: "Is there a limit to how many times we can take the CMMS®?",
        answer: "There is no limit to taking the assessment examination.",
      },
      {
        question: "How do we know that we passed the examination?",
        answer:
          "You will be notified officially via email. Passers are also posted on CPACE Philippines' official website and social media platforms.",
      },
      {
        question: "What is the validity period?",
        answer: "The validity is lifetime. No renewal is required.",
      },
    ],
  },
  {
    slug: "coms",
    acronym: "COMS®",
    parenthesizedAcronym: "(COMS)®",
    fullName: "Certified Operations Management Specialist",
    category: "Operations",
    shortDescription:
      "Prove your capability in operations excellence, supply chain management, process optimization, and quality assurance. The COMS® credential is designed for professionals driving operational efficiency.",
    heroSubtitle:
      "The COMS® credential equips you to optimize operations, streamline supply chains, improve process efficiency, and manage organizational resources for competitive business performance.",
    badgeImage: "/assets/badges/coms-badge.png",
    gradient: "from-violet-600 to-purple-700",
    lightBg: "bg-violet-50",
    lightText: "text-violet-700",
    lightBorder: "border-violet-200",
    formats: "Online, In-person, Hybrid",
    highlights: [
      "Supply Chain Management",
      "Process Optimization and Lean",
      "Quality Assurance Systems",
      "Project and Resource Management",
    ],
    pillars: [
      {
        title: "Industry-Recognized Certification",
        description:
          "The Certified Operations Management Specialist (COMS)® is an industry-recognized credential that validates your expertise and commitment to the highest standards of operations management.",
      },
      {
        title: "Online & In-Person Assessment",
        description:
          "Take the COMS® exam securely online through CPACE's Learning Management System (LMS). In-person assessments and special schedules can also be conducted as requested by the school.",
      },
      {
        title: "Professional Development",
        description:
          "Earning your COMS® is a commitment to continuous professional development, keeping your operational leadership and process improvement skills sharp in a dynamic industry.",
      },
    ],
    examFormat: {
      overview:
        "The CERTIFIED OPERATIONS MANAGEMENT SPECIALIST (COMS)® is an assessment examination of core knowledge in the field of operations and supply chain management conducted by the Center for Professional Advancement and Continuing Education, Inc. (CPACE Philippines). The examination evaluates the essential competencies that an aspiring or practicing operations professional must possess.",
      duration: "2 Hours (120 Minutes)",
      questions: "120 Multiple-Choice Questions",
      passingMark: "75% Rating (A minimum score of 60 points is required to pass.)",
      validity: "Lifetime Validity (No renewal required)",
      authorization:
        "Examinees who pass and earn formal certification are authorized to use the professional post-nominal title Certified Operations Management Specialist (COMS)®.",
    },
    coverageTopics: [
      "Operations Strategy",
      "Project Management",
      "Facilities Management",
      "Logistics Management",
      "Total Quality Management (TQM)",
      "Forecasting & Demand Planning",
      "Enterprise Resource Planning (ERP)",
      "Inventory Management & Control",
      "Lean Operating Systems",
      "Process Selection, Design & Improvement",
    ],
    processSteps: [
      {
        step: "01",
        title: "Register Online",
        detail: "Complete the online registration form and settle the learning investment of Php 1,680.00.",
      },
      {
        step: "02",
        title: "Submit Requirements & Payment Confirmation",
        detail: "Email your documentary requirements and proof of payment to coms@cpaceph.com.",
      },
      {
        step: "03",
        title: "Verification & Slot Confirmation",
        detail: "Your payment and documents will be validated within 2–3 business days.",
      },
      {
        step: "04",
        title: "Access Self-Review Materials",
        detail: "You will receive your official self-review materials, references, and exam schedule upon confirmation of your slot.",
      },
    ],
    investment: "Php 1,680.00",
    submissionEmail: "coms@cpaceph.com",
    registerUrl: "https://bit.ly/comsbycpace",
    brochureUrl: "https://bit.ly/comsinfosheet",
    qualificationCategories: [
      {
        code: "Category A",
        title: "Undergraduate & Graduating Students",
        description:
          "Graduates or graduating students of Operations Management, Customs Administration, Entrepreneurship, Industrial Engineering, or any BSBA courses aligned with operations management.",
      },
      {
        code: "Category B",
        title: "Graduate & Postgraduate Scholars",
        description:
          "Graduates or graduate school students of a Master's in Business Administration with Entrepreneurship or Operations Management specializations, a Master of Science in Management, or any Master's/DBA programs related to operations management.",
      },
      {
        code: "Category C",
        title: "Academic Faculty & Educators",
        description:
          "Faculty members teaching Operations Management, Supply Chain Management, Logistics, Quality Management, or any other operations management-related subjects.",
      },
      {
        code: "Category D",
        title: "Industry Practitioners & Professionals",
        description:
          "Any 4-year degree holder with at least 1 year of working experience in operations management, logistics, inventory management, or supply chain — including employees, officers, managers, supervisors, department heads, or related positions.",
      },
    ],
    faqs: [
      {
        question:
          "Does the Professional Regulation Commission (PRC) or the Civil Service Commission (CSC) oversee the Certified Operations Management Specialist (COMS)® Assessment Exam?",
        answer:
          "The certification does not fall under the purview of the Professional Regulation Commission or the Civil Service Commission. This is not a government professional license or civil service eligibility. It is an industry assessment examination and certification of your skills in operations management, initiated by the Center for Professional Advancement and Continuing Education, Inc. (CPACE Philippines).",
      },
      {
        question: "What are the advantages of taking COMS®?",
        answer:
          "Earning a professional certification validates your mastery of operations management and enhances your credentials, providing a competitive edge in the job market. Passing the exam establishes your credibility and demonstrates a commitment to continuous learning valued by employers. Your name will also be included in the official list of certified individuals shared with our partner institutions.",
      },
      {
        question: "What is the passing mark?",
        answer: "75% Rating (A minimum score of 60 points is required to pass.)",
      },
      {
        question: "Is there a limit to how many times we can take the COMS®?",
        answer: "There is no limit to taking the assessment examination.",
      },
      {
        question: "How do we know that we passed the examination?",
        answer:
          "You will be notified officially via email. Passers are also posted on CPACE Philippines' official website and social media platforms.",
      },
      {
        question: "What is the validity period?",
        answer: "The validity is lifetime. No renewal is required.",
      },
    ],
  },
  {
    slug: "chms",
    acronym: "CHMS™",
    parenthesizedAcronym: "(CHMS)™",
    fullName: "Certified Hospitality Management Specialist",
    category: "Hospitality & Tourism",
    shortDescription:
      "Master modern hospitality operations, guest service excellence, tourism leadership, and strategic hotel and food service management. The CHMS™ credential validates advanced capability in hospitality industry standards and operational leadership.",
    heroSubtitle:
      "Elevate your expertise in guest relations, service excellence, and hospitality operations with the CHMS™ credential — designed for professionals seeking to enhance guest satisfaction, operational efficiency, and leadership in the hospitality and tourism industry.",
    badgeImage: "/assets/badges/chms-badge.png",
    gradient: "from-emerald-800 to-green-950",
    lightBg: "bg-emerald-50",
    lightText: "text-emerald-800",
    lightBorder: "border-emerald-200",
    formats: "Online, In-person, Hybrid",
    highlights: [
      "Hospitality Operations and Guest Experience",
      "Hotel and Tourism Leadership",
      "Food and Beverage Service Management",
      "Quality Standards and Industry Compliance",
    ],
    pillars: [
      {
        title: "Industry-Recognized Certification",
        description:
          "The Certified Hospitality Management Specialist (CHMS)™ is an industry-recognized credential that validates your service leadership and mastery of international hospitality standards.",
      },
      {
        title: "Online & In-Person Assessment",
        description:
          "Take the CHMS™ exam securely online through CPACE's Learning Management System (LMS). In-person assessments and institutional testing cohorts can also be arranged with partner colleges and universities.",
      },
      {
        title: "Professional Development",
        description:
          "Earning your CHMS™ affirms your dedication to world-class guest experience, operational excellence, and continuous career advancement across global hospitality and tourism sectors.",
      },
    ],
    examFormat: {
      overview:
        "The CERTIFIED HOSPITALITY MANAGEMENT SPECIALIST (CHMS)™ is a comprehensive assessment examination of core competencies in hospitality, lodging, food service, and tourism management conducted by the Center for Professional Advancement and Continuing Education, Inc. (CPACE Philippines).",
      duration: "3 hours instructor-led live learning\n2 hours assessment examination",
      passingMark: "75% Rating (A minimum score of 60 points is required to pass.)",
      validity: "Lifetime Validity (No renewal required)",
      authorization:
        "Examinees who pass and earn formal certification are authorized to use the professional post-nominal title Certified Hospitality Management Specialist (CHMS)™.",
    },
    coverageTopics: [
      "Tourism and Hospitality Foundations",
      "Hotel and Lodging Operations",
      "Food and Beverage Operations",
      "Hospitality Business and Management",
      "Hospitality Systems and Technology",
      "Risk, Law, and Quality",
    ],
    processSteps: [
      {
        step: "01",
        title: "Register Online",
        detail: "Complete the online registration form and settle the learning investment of Php 1,980.00.",
      },
      {
        step: "02",
        title: "Submit Requirements & Payment Confirmation",
        detail: "Email your documentary requirements and proof of payment to chms@cpaceph.com.",
      },
      {
        step: "03",
        title: "Verification & Slot Confirmation",
        detail: "Your payment and documents will be validated within 2–3 business days.",
      },
      {
        step: "04",
        title: "Access Self-Review Materials",
        detail: "You will receive your official self-review materials, references, and exam schedule upon confirmation of your slot.",
      },
    ],
    investment: "Php 1,980.00",
    submissionEmail: "chms@cpaceph.com",
    registerUrl: "https://bit.ly/chmsbycpace",
    brochureUrl: "https://bit.ly/chmsinfosheet",
    qualificationCategories: [
      {
        code: "Category A",
        title: "Undergraduate & Graduating Students",
        description:
          "Graduates or currently graduating students of Hospitality Management (BSHM), Tourism Management (BSTM), Hotel and Restaurant Management (HRM), Culinary Management, or any hospitality and tourism-related degree.",
      },
      {
        code: "Category B",
        title: "Graduate & Postgraduate Scholars",
        description:
          "Graduates or graduate school students of Master in Hospitality Management, Master in Tourism Management, MBA with Hospitality or Service Management specialization, or related doctoral programs.",
      },
      {
        code: "Category C",
        title: "Academic Faculty & Educators",
        description:
          "Faculty members and hospitality trainers teaching Hospitality Management, Tourism Operations, Food and Beverage Service, Front Office, Culinary Arts, or related subjects.",
      },
      {
        code: "Category D",
        title: "Industry Practitioners & Professionals",
        description:
          "Any 4-year degree holder with at least 1 year of working experience in hotels, resorts, restaurants, travel and tourism, cruise/airline hospitality, events (MICE), or food service management.",
      },
    ],
    faqs: [
      {
        question:
          "Does the Professional Regulation Commission (PRC) or the Civil Service Commission (CSC) oversee the Certified Hospitality Management Specialist (CHMS)™ Assessment Exam?",
        answer:
          "The certification does not fall under the purview of the Professional Regulation Commission or the Civil Service Commission. This is not a government professional license or civil service eligibility. It is an industry assessment examination and certification of your skills in hospitality management, initiated by the Center for Professional Advancement and Continuing Education, Inc. (CPACE Philippines).",
      },
      {
        question: "What are the advantages of taking CHMS™?",
        answer:
          "Earning the CHMS™ credential validates your readiness for leadership and service roles across hotels, resorts, restaurants, cruise lines, and tourism enterprises. Passing the certification exam strengthens your resume and places your name in CPACE Philippines' official directory of certified specialists shared with partner institutions.",
      },
      {
        question: "What is the passing mark?",
        answer: "75% Rating (A minimum score of 60 points is required to pass.)",
      },
      {
        question: "Is there a limit to how many times we can take the CHMS™?",
        answer: "There is no limit to taking the assessment examination.",
      },
      {
        question: "How do we know that we passed the examination?",
        answer:
          "You will be notified officially via email. Passers are also recognized on CPACE Philippines' official website and social media platforms.",
      },
      {
        question: "What is the validity period?",
        answer: "The validity is lifetime. No renewal is required.",
      },
    ],
  },
  {
    slug: "labor-law-lecture",
    aliases: ["lll"],
    acronym: "LLL",
    parenthesizedAcronym: "(LLL)",
    fullName: "Labor Law Lecture (A CHRA® Online Review)",
    category: "HR & Labor Law",
    shortDescription:
      "Deepen your expertise in Philippine labor relations, statutory standards, and HR compliance through CPACE's specialized Labor Law Lecture. An intensive online review program designed to thoroughly prepare candidates for the CHRA® assessment and practical employment practice.",
    heroSubtitle:
      "Master the Philippine Labor Code, statutory benefits, employee discipline due process, and labor relations through CPACE Philippines' intensive online review lecture — built for CHRA® examinees and practicing HR professionals.",
    badgeImage: "/assets/badges/lll-badge.png",
    gradient: "from-emerald-700 to-green-900",
    lightBg: "bg-emerald-50",
    lightText: "text-emerald-800",
    lightBorder: "border-emerald-200",
    formats: "Online Live & Review Handouts",
    highlights: [
      "Philippine Labor Law and Compliance",
      "Employee Relations and Due Process",
      "CHRA® Online Review and Assessment Prep",
      "HR Legal Compliance and Practical Application",
    ],
    pillars: [
      {
        title: "Structured CHRA® Exam Preparation",
        description:
          "Engineered around the core Labor Standards and Labor Relations competencies tested in the Certified Human Resource Associate (CHRA)® examination, with over 6,000+ participants.",
      },
      {
        title: "100% Online Interactive Lecture & Drills",
        description:
          "Attend live interactive lectures with legal and HR subject-matter experts, supported by guided case analyses, statutory computation drills, and digital reviewers.",
      },
      {
        title: "Practical Workplace HR Compliance",
        description:
          "Go beyond memorization by mastering real-world application of DOLE department orders, the twin-notice rule, termination due process, and statutory employee benefits.",
      },
    ],
    examFormat: {
      overview:
        "The LABOR LAW LECTURE (A CHRA® ONLINE REVIEW) is an intensive continuing education and review program conducted by the Center for Professional Advancement and Continuing Education, Inc. (CPACE Philippines). It equips HR students, examinees, and practitioners with a thorough command of Book I to Book VII of the Labor Code of the Philippines and recent DOLE issuances.",
      duration: "Comprehensive Online Lectures",
      passingMark: "Certificate of Completion & CHRA® Readiness",
      validity: "Lifetime Access to Issued Certificate",
      authorization:
        "Participants receive an official CPACE Philippines Certificate of Attendance and structured review kit preparing them for the CHRA® examination and HR compliance roles.",
    },
    coverageTopics: [
      "Fundamental Principles & Constitutional Mandates on Labor",
      "Pre-Employment, Recruitment & Employment Classifications",
      "Working Conditions, Hours of Work, Overtime, Night Shift & Rest Days",
      "Administration of Wages, 13th Month Pay & Holiday Pay Computations",
      "Statutory Leaves (SIL, Maternity, Paternity, Solo Parent, VAWC, Special Leave for Women)",
      "Social Welfare Legislation (SSS, PhilHealth, Pag-IBIG & Employees' Compensation)",
      "Management Prerogative, Workplace Discipline & The Twin-Notice Rule",
      "Just Causes vs. Authorized Causes of Termination & Separation Pay",
      "Labor Relations, Right to Self-Organization, CBA & Unfair Labor Practices",
      "Situational Jurisprudence Analysis",
    ],
    processSteps: [
      {
        step: "01",
        title: "Register Online",
        detail: "Complete the online registration form and settle the learning investment of Php 500.00.",
      },
      {
        step: "02",
        title: "Submit Registration & Payment Proof",
        detail: "Email your documentary requirements and proof of payment to lectures@cpaceph.com.",
      },
      {
        step: "03",
        title: "Slot Verification",
        detail: "Receive your official confirmation email and virtual classroom credentials within 2–3 business days.",
      },
      {
        step: "04",
        title: "Attend the Online Review & Receive Handouts",
        detail: "Join the online live review session, Q&A, and claim your certificate of attendance.",
      },
    ],
    investment: "Php 500.00",
    submissionEmail: "lectures@cpaceph.com",
    registerUrl: "https://bit.ly/chraonlinereview",
    qualificationCategories: [
      {
        code: "Category A",
        title: "Undergraduate & Graduating Students",
        description:
          "Graduating students or fresh graduates of Human Resource Management (BSBA-HRM / BSBA-HRDM), Psychology (BS/AB Psychology), Behavioral Science, Legal Management, or related business degrees preparing for the CHRA® exam.",
      },
      {
        code: "Category B",
        title: "Graduate & Postgraduate Scholars",
        description:
          "Graduate students taking MBA, Master in Industrial Relations, Master in Human Resource Management, or Law students seeking a structured refresher on Philippine Labor Standards and Relations.",
      },
      {
        code: "Category C",
        title: "Academic Faculty & Coaches",
        description:
          "Faculty members, department chairs, and review coaches teaching Human Resource Management, Labor Law, Business Law, or Industrial Relations.",
      },
      {
        code: "Category D",
        title: "HR Practitioners & Business Leaders",
        description:
          "HR assistants, HR officers, generalists, employee relations specialists, team leaders, and business owners seeking practical mastery of Philippine Labor Code compliance.",
      },
    ],
    faqs: [
      {
        question: "Who should enroll in the Labor Law Lecture (A CHRA® Online Review)?",
        answer:
          "The program is ideal for graduating students, fresh graduates, and HR practitioners preparing to take the Certified Human Resource Associate (CHRA)® assessment examination, as well as managers and business owners who want a solid foundation in Philippine Labor Law.",
      },
      {
        question: "How is the Labor Law Lecture delivered?",
        answer:
          "It is delivered online via live interactive lecture sessions complemented by downloadable review handouts, statutory benefit computation guides, and situational practice questions.",
      },
      {
        question: "Do participants receive a certificate?",
        answer:
          "Yes. Participants who complete the lecture receive an official Certificate of Attendance from the Center for Professional Advancement and Continuing Education, Inc. (CPACE Philippines).",
      },
      {
        question: "How do I register for the next batch?",
        answer:
          "Click the Register button to open https://bit.ly/chraonlinereview and select the upcoming Labor Law Lecture schedule, or message our team at lectures@cpaceph.com for institutional group bookings.",
      },
    ],
  },
]

export function getCertificationCourseBySlug(slug: string): CertificationCourse | undefined {
  const normalized = slug.toLowerCase().trim()
  return certificationCourses.find(
    course => course.slug === normalized || course.aliases?.includes(normalized)
  )
}
