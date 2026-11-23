"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ProfessionalCertifications } from "@/components/sections/professional-certifications"

export default function ProfessionalCertificationCatalogPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        <Header />
        <ProfessionalCertifications />
      </div>
      <Footer />
    </div>
  )
}
