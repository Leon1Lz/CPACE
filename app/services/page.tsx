"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ServicesSection } from "@/components/sections/services-section"
import { ProfessionalCertifications } from "@/components/sections/professional-certifications"
import { BusinessConsultancy } from "@/components/sections/business-consultancy"

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <ServicesSection />
      <ProfessionalCertifications />
      <BusinessConsultancy />
      <Footer />
    </div>
  )
}
