/**
 * Centralized statistics for CPACE Philippines.
 * Single source of truth — import these in every section that displays numbers.
 */

export const cpaceStats = {
  certifiedProfessionals: {
    value: "19,980+",
    numericValue: 19980,
    label: "Certified Professionals",
    sublabel: "Across Certification Programs",
  },
  chraPassers: {
    value: "6,280+",
    numericValue: 6280,
    label: "CHRA® Review Passers",
    sublabel: "Review Lecture & Credential Programs",
  },
  institutionalPartners: {
    value: "25+",
    numericValue: 25,
    label: "Institutional & Industry Partners",
    sublabel: "Academic & Industry Collaborations",
  },
  programsOffered: {
    value: "10+",
    numericValue: 10,
    label: "Custom Training Programs",
    sublabel: "Certifications, Courses & Training",
  },
  serviceCategories: {
    value: "6+",
    numericValue: 6,
    label: "Service Categories",
    sublabel: "Professional Development Tracks",
  },
  successRate: {
    value: "76%",
    numericValue: 76,
    label: "Overall Passing Rate",
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
