/**
 * Centralized statistics for CPACE Philippines.
 * Single source of truth — import these in every section that displays numbers.
 */

export const cpaceStats = {
  certifiedProfessionals: {
    value: "12,880+",
    numericValue: 12880,
    label: "Certified Professionals",
    sublabel: "CFMS® | CMMS® | COMS®",
  },
  chraPassers: {
    value: "5,890+",
    numericValue: 5890,
    label: "CHRA™ Review Passers",
    sublabel: "Review Lecture & Credential Programs",
  },
  institutionalPartners: {
    value: "20+",
    numericValue: 20,
    label: "Institutional & Industry Partners",
    sublabel: "Academic & Industry Collaborations",
  },
  programsOffered: {
    value: "50+",
    numericValue: 50,
    label: "Programs Available",
    sublabel: "Certifications, Courses & Training",
  },
  serviceCategories: {
    value: "6+",
    numericValue: 6,
    label: "Service Categories",
    sublabel: "Professional Development Tracks",
  },
  successRate: {
    value: "95%",
    numericValue: 95,
    label: "Success Rate",
    sublabel: "Program Completion & Passing Rate",
  },
  yearsOfExcellence: {
    value: "7+",
    numericValue: 7,
    label: "Years of Excellence",
    sublabel: "Since 2017",
  },
} as const

export type StatKey = keyof typeof cpaceStats
