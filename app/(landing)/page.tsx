"use client"

import { Header } from "@/components/layout/header"
import { HeroSection } from "@/components/layout/hero-section"
import { ContinuingEducationSection } from "@/components/sections/continuing-education-section"
import { NextScrollSection } from "@/components/sections/next-scroll-section"
import { LatestIndustrySection } from "@/components/sections/latest-industry-section"
import { PartnersSection } from "@/components/sections/partners-section"
import { InstitutionalPartnersSection } from "@/components/sections/institutional-partners-section"
import { ProfessionalCertifications } from "@/components/sections/professional-certifications"
import { ServicesSection } from "@/components/sections/services-section"
import { ContactSection } from "@/components/sections/contact-section"
import { Footer } from "@/components/layout/footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <ContinuingEducationSection />
      <NextScrollSection />
      <LatestIndustrySection />
      <PartnersSection />
      <InstitutionalPartnersSection />
      <ProfessionalCertifications />
      <ServicesSection />
      <ContactSection />
      <Footer />
    </div>
  )
}
