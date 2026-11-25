export type HomepageFaq = {
  id: string
  category: "certifications" | "partnerships" | "verification"
  question: string
  answer: string
  isPublished: boolean
  sortOrder: number
}

export const defaultHomepageFaqs: HomepageFaq[] = [
  { id: "faq-1", category: "certifications", question: "What certifications does CPACE Philippines offer?", answer: "CPACE Philippines provides industry-recognized certifications including the Certified Financial Management Specialist (CFMS)®, Certified Marketing Management Specialist (CMMS)®, Certified Hospitality Management Specialist (CHMS)™, Certified Operations Management Specialist (COMS)®, and the Certified Human Resource Associate (CHRA)® review lecture and credential programs.", isPublished: true, sortOrder: 0 },
  { id: "faq-2", category: "certifications", question: "Are CPACE certifications recognized by employers and institutions?", answer: "Yes, CPACE certifications provide a recognized benchmark of professional competence, supported by partnered industries and academic institutions in the Philippines.", isPublished: true, sortOrder: 1 },
  { id: "faq-3", category: "certifications", question: "How are the training programs and examinations conducted?", answer: "Programs feature flexible hybrid learning through our online portal, with self-paced training modules available anytime. Examinations are administered via secure online proctoring or in person at partner testing centers.", isPublished: true, sortOrder: 2 },
  { id: "faq-4", category: "partnerships", question: "How can our school or company partner with CPACE?", answer: "We welcome academic institutions, media organizations, and corporate partners. Contact our Corporate & Institutional Services team through the contact form or at partnerships@cpaceph.com.", isPublished: true, sortOrder: 3 },
  { id: "faq-5", category: "verification", question: "How can employers and graduates verify certification credentials?", answer: "Official credential authenticity can be verified through Support & Verification at verify@cpaceph.com or (02) 8260-9931 / +63 956 221-2400 using the certified individual's name and certificate reference.", isPublished: true, sortOrder: 4 },
  { id: "faq-6", category: "certifications", question: "How do I register for an upcoming certification or short course?", answer: "Enroll through bit.ly/cpaceprograms or submit an inquiry through the contact form to receive syllabus guides, schedules, and fee details.", isPublished: true, sortOrder: 5 },
]
