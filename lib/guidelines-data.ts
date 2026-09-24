export interface GuidelineSection {
  title: string
  iconName: string
  content: string
  bullets: string[]
}

export interface CourseGuideline {
  programCode: "CFMS" | "CMMS" | "COMS"
  programName: string
  title: string
  subtitle: string
  sections: GuidelineSection[]
}

export const courseGuidelines: Record<string, CourseGuideline> = {
  CFMS: {
    programCode: "CFMS",
    programName: "Certificate in Financial Management Services (CFMS)",
    title: "CFMS Examination Rules & Academic Guidelines",
    subtitle: "Official CPACE Philippines candidate guidelines for financial practice drills and certification examinations.",
    sections: [
      {
        title: "1. Certification Path & Curriculum Flow",
        iconName: "GraduationCap",
        content: "To earn your official CPACE Certificate in Financial Management Services, complete each stage of the curriculum:",
        bullets: [
          "Stage 1 — Study Modules & Question Reviewer: Master financial statements, capital budgeting, working capital, and valuation principles.",
          "Stage 2 — Practice Quiz: Complete the 30-item practice drill. Unlimited attempts are available with no time pressure or lockouts.",
          "Stage 3 — Final Examination: Take the 60-item proctored final exam. Achieving a score of 70% or higher automatically issues your verified certificate."
        ]
      },
      {
        title: "2. Practice Quiz Policies (Open-Book & Unlocked)",
        iconName: "Unlock",
        content: "The practice quiz is designed for mastery and knowledge reinforcement:",
        bullets: [
          "30 items covering core accounting, financial ratios, time value of money, and capital budgeting.",
          "No browser lockout: You may freely switch tabs, refer to formulas, study notes, and course reviewers.",
          "Unlimited retakes with no penalty to your permanent academic record.",
          "Instantaneous answer key breakdown and rationales provided upon submission."
        ]
      },
      {
        title: "3. Final Examination & Proctoring Protocol",
        iconName: "ShieldCheck",
        content: "The final examination is a secure, formal assessment verifying your professional financial competency:",
        bullets: [
          "60 comprehensive items with a 90-minute server-enforced countdown timer.",
          "Automated identity screening: Candidate face snapshot and valid government/student ID capture required prior to starting.",
          "Live AI and proctor monitoring: Tab switching, minimizing the browser, or exiting full-screen mode triggers an immediate proctor alert and exam lock.",
          "Passing threshold: 70% (minimum 42 correct answers out of 60).",
          "One formal attempt per scheduled sitting. Official retakes must be authorized by your program administrator."
        ]
      },
      {
        title: "4. Permitted Tools & Technical Setup",
        iconName: "Clock",
        content: "Ensure your testing workstation meets all technical and operational criteria:",
        bullets: [
          "The built-in on-screen floating calculator is provided and permitted for all quantitative problems.",
          "Scratch paper and a standard pen/pencil are permitted for rough calculations (must be kept on desk in camera view).",
          "Stable broadband internet connection (minimum 2 Mbps download/upload recommended).",
          "Working webcam and well-lit workspace with no unauthorized individuals present."
        ]
      },
      {
        title: "5. Certificate Issuance & Verification",
        iconName: "Award",
        content: "Upon successfully passing the Final Examination:",
        bullets: [
          "Your digital certificate is generated immediately with a tamper-proof credential ID (e.g. CPACE-CFMS-XXXXXX).",
          "Your certificate can be shared directly to LinkedIn or downloaded as a high-resolution, print-ready PDF from your Certificates tab.",
          "Employers and academic institutions can verify certificate authenticity 24/7 on the public CPACE verification portal."
        ]
      }
    ]
  },
  CMMS: {
    programCode: "CMMS",
    programName: "Certificate in Marketing Management Services (CMMS)",
    title: "CMMS Examination Rules & Academic Guidelines",
    subtitle: "Official CPACE Philippines candidate guidelines for marketing practice drills and certification examinations.",
    sections: [
      {
        title: "1. Certification Path & Curriculum Flow",
        iconName: "GraduationCap",
        content: "To earn your official CPACE Certificate in Marketing Management Services, complete each stage of the curriculum:",
        bullets: [
          "Stage 1 — Study Modules & Question Reviewer: Master the 7Ps marketing mix, STP frameworks, consumer behavior, and digital metrics.",
          "Stage 2 — Practice Quiz: Complete the 30-item practice drill. Unlimited attempts are available with no time pressure or lockouts.",
          "Stage 3 — Final Examination: Take the 60-item proctored final exam. Achieving a score of 70% or higher automatically issues your verified certificate."
        ]
      },
      {
        title: "2. Practice Quiz Policies (Open-Book & Unlocked)",
        iconName: "Unlock",
        content: "The practice quiz is designed for mastery and knowledge reinforcement:",
        bullets: [
          "30 items covering marketing strategy, consumer psychology, pricing models, and campaign performance analytics.",
          "No browser lockout: You may freely switch tabs, consult case studies, notes, and course reviewers.",
          "Unlimited retakes with no penalty to your permanent academic record.",
          "Instantaneous answer key breakdown and rationales provided upon submission."
        ]
      },
      {
        title: "3. Final Examination & Proctoring Protocol",
        iconName: "ShieldCheck",
        content: "The final examination is a secure, formal assessment verifying your professional marketing competency:",
        bullets: [
          "60 comprehensive items with a 90-minute server-enforced countdown timer.",
          "Automated identity screening: Candidate face snapshot and valid government/student ID capture required prior to starting.",
          "Live AI and proctor monitoring: Tab switching, minimizing the browser, or exiting full-screen mode triggers an immediate proctor alert and exam lock.",
          "Passing threshold: 70% (minimum 42 correct answers out of 60).",
          "One formal attempt per scheduled sitting. Official retakes must be authorized by your program administrator."
        ]
      },
      {
        title: "4. Permitted Tools & Technical Setup",
        iconName: "Clock",
        content: "Ensure your testing workstation meets all technical and operational criteria:",
        bullets: [
          "The built-in on-screen floating calculator is provided for marketing analytics (CAC, LTV, ROI, conversion rates).",
          "Stable broadband internet connection (minimum 2 Mbps download/upload recommended).",
          "Working webcam and well-lit workspace with no unauthorized individuals present."
        ]
      },
      {
        title: "5. Certificate Issuance & Verification",
        iconName: "Award",
        content: "Upon successfully passing the Final Examination:",
        bullets: [
          "Your digital certificate is generated immediately with a tamper-proof credential ID (e.g. CPACE-CMMS-XXXXXX).",
          "Your certificate can be shared directly to LinkedIn or downloaded as a high-resolution, print-ready PDF from your Certificates tab.",
          "Employers and academic institutions can verify certificate authenticity 24/7 on the public CPACE verification portal."
        ]
      }
    ]
  },
  COMS: {
    programCode: "COMS",
    programName: "Certificate in Operations Management Services (COMS)",
    title: "COMS Examination Rules & Academic Guidelines",
    subtitle: "Official CPACE Philippines candidate guidelines for operations practice drills and certification examinations.",
    sections: [
      {
        title: "1. Certification Path & Curriculum Flow",
        iconName: "GraduationCap",
        content: "To earn your official CPACE Certificate in Operations Management Services, complete each stage of the curriculum:",
        bullets: [
          "Stage 1 — Study Modules & Question Reviewer: Master supply chain logistics, inventory optimization (EOQ, JIT), Six Sigma, and project scheduling.",
          "Stage 2 — Practice Quiz: Complete the 30-item practice drill. Unlimited attempts are available with no time pressure or lockouts.",
          "Stage 3 — Final Examination: Take the 60-item proctored final exam. Achieving a score of 70% or higher automatically issues your verified certificate."
        ]
      },
      {
        title: "2. Practice Quiz Policies (Open-Book & Unlocked)",
        iconName: "Unlock",
        content: "The practice quiz is designed for mastery and knowledge reinforcement:",
        bullets: [
          "30 items covering process flows, quality management, lean manufacturing, and capacity planning.",
          "No browser lockout: You may freely switch tabs, refer to formulas, study notes, and course reviewers.",
          "Unlimited retakes with no penalty to your permanent academic record.",
          "Instantaneous answer key breakdown and rationales provided upon submission."
        ]
      },
      {
        title: "3. Final Examination & Proctoring Protocol",
        iconName: "ShieldCheck",
        content: "The final examination is a secure, formal assessment verifying your professional operations competency:",
        bullets: [
          "60 comprehensive items with a 90-minute server-enforced countdown timer.",
          "Automated identity screening: Candidate face snapshot and valid government/student ID capture required prior to starting.",
          "Live AI and proctor monitoring: Tab switching, minimizing the browser, or exiting full-screen mode triggers an immediate proctor alert and exam lock.",
          "Passing threshold: 70% (minimum 42 correct answers out of 60).",
          "One formal attempt per scheduled sitting. Official retakes must be authorized by your program administrator."
        ]
      },
      {
        title: "4. Permitted Tools & Technical Setup",
        iconName: "Clock",
        content: "Ensure your testing workstation meets all technical and operational criteria:",
        bullets: [
          "The built-in on-screen floating calculator is provided for operations calculations (EOQ, Little's Law, ROP, utilization rates).",
          "Scratch paper and a pen/pencil are permitted for network diagrams and inventory calculations.",
          "Stable broadband internet connection (minimum 2 Mbps download/upload recommended).",
          "Working webcam and well-lit workspace with no unauthorized individuals present."
        ]
      },
      {
        title: "5. Certificate Issuance & Verification",
        iconName: "Award",
        content: "Upon successfully passing the Final Examination:",
        bullets: [
          "Your digital certificate is generated immediately with a tamper-proof credential ID (e.g. CPACE-COMS-XXXXXX).",
          "Your certificate can be shared directly to LinkedIn or downloaded as a high-resolution, print-ready PDF from your Certificates tab.",
          "Employers and academic institutions can verify certificate authenticity 24/7 on the public CPACE verification portal."
        ]
      }
    ]
  }
}

export function getGuidelineByCourseCode(code: string): CourseGuideline {
  const upper = (code || "").toUpperCase()
  if (upper.includes("FINANC") || upper.includes("CFMS")) return courseGuidelines.CFMS
  if (upper.includes("MARKET") || upper.includes("CMMS")) return courseGuidelines.CMMS
  if (upper.includes("OPERAT") || upper.includes("COMS")) return courseGuidelines.COMS
  return courseGuidelines.CFMS
}
