"use client"

import { useEffect, useState } from "react"
import { ChevronDown, HelpCircle, GraduationCap, Building, ShieldCheck, Award } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface FAQItem {
  id: string
  category: "all" | "certifications" | "partnerships" | "verification"
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    id: "faq-1",
    category: "certifications",
    question: "What certifications does CPACE Philippines offer?",
    answer: "CPACE Philippines provides industry-recognized certifications including the Certified Financial Management Specialist (CFMS®), Certified Marketing Management Specialist (CMMS®), Certified Operations Management Specialist (COMS®), and the Certified Human Resource Associate (CHRA™) review lecture and credential programs."
  },
  {
    id: "faq-2",
    category: "certifications",
    question: "Are CPACE certifications recognized by employers and institutions?",
    answer: "Yes. CPACE certifications are recognized by leading employers, corporate institutions, and over 20+ top academic universities across the Philippines (including Batangas State University, FEU, University of St. La Salle, STI, and Holy Angel University) as validated benchmarks of professional competence."
  },
  {
    id: "faq-3",
    category: "certifications",
    question: "How are the training programs and examinations conducted?",
    answer: "Programs are delivered through flexible hybrid learning pathways. You can access training modules and webinars via our official Learning Portal (certifications.cpaceph.com), while certification examinations are administered either online with secure proctoring or in-person at partner university testing centers."
  },
  {
    id: "faq-4",
    category: "partnerships",
    question: "How can our school or company partner with CPACE?",
    answer: "We welcome academic institutions, media organizations, and corporate partners. We collaborate on curriculum integration, co-branded training initiatives, and corporate upskilling. You can reach our Corporate & Institutional Services team directly via the contact form below or email corporate@cpaceph.com."
  },
  {
    id: "faq-5",
    category: "verification",
    question: "How can employers and graduates verify certification credentials?",
    answer: "Official credential authenticity can be verified directly through our Student Support & Verification department by emailing support@cpaceph.com or calling +63 956 221-2400 with the certified individual's full name and certificate reference."
  },
  {
    id: "faq-6",
    category: "certifications",
    question: "How do I register for an upcoming certification or short course?",
    answer: "Registration is fast and convenient. You can enroll online directly via our official portal at linktr.ee/cpaceph, or submit an inquiry through our contact form below to receive full syllabus guides, schedules, and fee details."
  }
]

export function FAQSection() {
  const [openId, setOpenId] = useState<string | null>("faq-1")
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [faqItems, setFaqItems] = useState<FAQItem[]>(faqs)

  useEffect(() => {
    fetch("/api/homepage-faqs")
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(items => { if (Array.isArray(items)) setFaqItems(items) })
      .catch(() => undefined)
  }, [])

  const filteredFaqs = activeCategory === "all" 
    ? faqItems
    : faqItems.filter(f => f.category === activeCategory)

  const toggleFAQ = (id: string) => {
    setOpenId(openId === id ? null : id)
  }

  return (
    <section id="faq" className="py-20 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
        <div className="absolute top-10 right-10 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-teal-100/40 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-100/80 text-emerald-800 rounded-full text-xs font-semibold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            Frequently Asked Questions
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
            Got Questions? We Have Answers.
          </h2>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about our certifications, partner programs, examinations, and registration process.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { id: "all", label: "All Questions", icon: <HelpCircle className="w-3.5 h-3.5" /> },
            { id: "certifications", label: "Certifications & Exams", icon: <GraduationCap className="w-3.5 h-3.5" /> },
            { id: "partnerships", label: "Institutional Partnerships", icon: <Building className="w-3.5 h-3.5" /> },
            { id: "verification", label: "Verification & Support", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:text-emerald-700 hover:bg-emerald-50/70 border border-gray-200/80"
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Accordion List */}
        <div className="space-y-3.5">
          {filteredFaqs.map((faq) => {
            const isOpen = openId === faq.id
            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "bg-white border-emerald-300 shadow-md ring-1 ring-emerald-200/50"
                    : "bg-white/90 border-gray-200/80 hover:border-emerald-200 hover:bg-white shadow-xs"
                }`}
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-gray-900 text-base md:text-lg">
                    {faq.question}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                    isOpen ? "bg-emerald-100 text-emerald-700 rotate-180" : "bg-gray-100 text-gray-500"
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-gray-600 text-sm md:text-base leading-relaxed border-t border-gray-100">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Still have questions banner */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 sm:p-8 border border-emerald-100 text-center space-y-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto shadow-sm text-emerald-600 border border-emerald-100">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-gray-900">Have more specific questions?</h4>
            <p className="text-gray-600 text-sm mt-1 max-w-md mx-auto">
              Our admissions team is available to assist you with program details, fees, and institution arrangements.
            </p>
          </div>
          <div className="pt-1">
            <Link href="/#contact">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm hover:shadow transition-all">
                Send Us a Message
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
