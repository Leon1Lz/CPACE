"use client"

import { Header } from "@/components/layout/header"
import { HeroSection } from "@/components/layout/hero-section"
import { InstitutionalPartnersSection } from "@/components/sections/institutional-partners-section"
import { ContinuingEducationSection } from "@/components/sections/continuing-education-section"
import { UpcomingEventsSection } from "@/components/sections/upcoming-events-section"
import { NextScrollSection } from "@/components/sections/next-scroll-section"
import { PartnersSection } from "@/components/sections/partners-section"
import { TestimonialsSection } from "@/components/sections/testimonials-section"
import { LatestIndustrySection } from "@/components/sections/latest-industry-section"
import { FAQSection } from "@/components/sections/faq-section"
import { ContactSection } from "@/components/sections/contact-section"
import { Footer } from "@/components/layout/footer"
import { BackToTop } from "@/components/ui/back-to-top"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <InstitutionalPartnersSection />
      <ContinuingEducationSection />
      <UpcomingEventsSection />
      <NextScrollSection />
      <PartnersSection />
      <TestimonialsSection />
      <LatestIndustrySection />
      <FAQSection />
      <ContactSection />
      <Footer />
      <BackToTop />
    </div>
  )
}
