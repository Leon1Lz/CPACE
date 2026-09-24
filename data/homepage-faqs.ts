export type HomepageFaq = {
  id: string
  category: "certifications" | "partnerships" | "verification"
  question: string
  answer: string
  isPublished: boolean
  sortOrder: number
}

export const defaultHomepageFaqs: HomepageFaq[] = [
  { id: "faq-1", category: "certifications", question: "What certifications does CPACE Philippines offer?", answer: "CPACE Philippines provides industry-recognized certifications including the Certified Financial Management Specialist (CFMS®), Certified Marketing Management Specialist (CMMS®), Certified Operations Management Specialist (COMS®), and the Certified Human Resource Associate (CHRA™) review lecture and credential programs.", isPublished: true, sortOrder: 0 },
  { id: "faq-2", category: "certifications", question: "Are CPACE certifications recognized by employers and institutions?", answer: "Yes. CPACE certifications are recognized by leading employers, corporate institutions, and over 20+ top academic universities across the Philippines as validated benchmarks of professional competence.", isPublished: true, sortOrder: 1 },
  { id: "faq-3", category: "certifications", question: "How are the training programs and examinations conducted?", answer: "Programs are delivered through flexible hybrid learning pathways. Training modules and webinars are available through the Learning Portal, while examinations are administered online with secure proctoring or in person at partner testing centers.", isPublished: true, sortOrder: 2 },
  { id: "faq-4", category: "partnerships", question: "How can our school or company partner with CPACE?", answer: "We welcome academic institutions, media organizations, and corporate partners. Contact our Corporate & Institutional Services team through the contact form or at corporate@cpaceph.com.", isPublished: true, sortOrder: 3 },
  { id: "faq-5", category: "verification", question: "How can employers and graduates verify certification credentials?", answer: "Official credential authenticity can be verified through Student Support & Verification at support@cpaceph.com or +63 956 221-2400 using the certified individual's name and certificate reference.", isPublished: true, sortOrder: 4 },
  { id: "faq-6", category: "certifications", question: "How do I register for an upcoming certification or short course?", answer: "Enroll through linktr.ee/cpaceph or submit an inquiry through the contact form to receive syllabus guides, schedules, and fee details.", isPublished: true, sortOrder: 5 },
]
