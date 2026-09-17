"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { LatestIndustrySection } from "@/components/sections/latest-industry-section"
import { IndustryInsights } from "@/components/sections/industry-insights"

export default function InsightsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <LatestIndustrySection />
      <IndustryInsights />
      <Footer />
    </div>
  )
}
