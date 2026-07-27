"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle, Users, Award, BookOpen, ChevronDown, ChevronUp } from "lucide-react"

export function HeroSection() {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Professional Background Image with Overlay */}
      <div className="absolute inset-0">
        {/* Hero Background Image */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
          backgroundImage: `url("https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80")`
        }}></div>
        
        {/* Multi-layer Gradient Overlay for Better Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-emerald-900/60"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-slate-900/40"></div>
        
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      {/* Premium Floating Elements - Smaller */}
      <div className="absolute top-8 left-4 w-20 h-20 bg-gradient-to-br from-emerald-400/30 to-emerald-600/30 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute top-16 right-8 w-24 h-24 bg-gradient-to-br from-cyan-400/25 to-blue-600/25 rounded-full blur-2xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-12 left-1/4 w-20 h-20 bg-gradient-to-br from-teal-400/30 to-emerald-600/30 rounded-full blur-2xl animate-pulse delay-2000"></div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            {/* CPACE Philippines Heading with Green Gradient */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                <span className="block text-white drop-shadow-lg">
                  Advance Your
                </span>
                <span className="block bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent drop-shadow-lg">
                  Career & Business
                </span>
                <span className="block text-white drop-shadow-lg">
                  with CPACE Philippines
                </span>
              </h1>
              <p className="text-lg text-white/90 leading-relaxed max-w-xl font-light drop-shadow">
                The Center for Professional Advancement and Continuing Education, Inc. (CPACE Philippines), is a professional organization that provides professional development and continuing education opportunities to individuals and organizations for their career and professional growth.
              </p>
            </div>

            {/* Premium CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                className="bg-white text-emerald-700 hover:bg-gray-100 font-semibold px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => setShowDetails(true)}
              >
                LEARN MORE
              </Button>
              <Link href="#certifications">
                <Button variant="ghost" className="border-2 border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white/50 font-semibold px-6 py-2 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm">
                  Explore Programs
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span className="text-xs text-white/80">Certified Programs</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-400" />
                <span className="text-xs text-white/80">Expert Instructors</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-emerald-400" />
                <span className="text-xs text-white/80">Industry Recognized</span>
              </div>
            </div>
          </div>

          {/* Right Column - Details Card */}
          <div className="relative lg:pl-8">
            {/* Glass Morphism Main Card */}
            <div className="relative group">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-600/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
              
              {/* Main Card */}
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 group-hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                <div className="space-y-6">
                  {/* Premium Header */}
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-xl mb-4 shadow-md group-hover:shadow-lg transition-shadow backdrop-blur-sm border border-white/10">
                      <BookOpen className="h-8 w-8 text-emerald-300" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
                      Continuing Education & Professional Certifications
                    </h3>
                    <p className="text-white/80 leading-relaxed text-sm">
                      Your journey to impact starts here. Continuing education isn't just about gaining credentials; it's about seizing new opportunities and making a lasting difference.
                    </p>
                  </div>

                  {/* Premium Features */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 group/item">
                      <div className="w-6 h-6 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 group-hover/item:scale-110 transition-transform backdrop-blur-sm border border-white/10">
                        <CheckCircle className="h-4 w-4 text-emerald-300" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-base mb-1">Powerful Programs</h4>
                        <p className="text-white/70 leading-relaxed text-sm">Relevant programs designed to equip you with insights and abilities</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 group/item">
                      <div className="w-6 h-6 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 group-hover/item:scale-110 transition-transform backdrop-blur-sm border border-white/10">
                        <CheckCircle className="h-4 w-4 text-emerald-300" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-base mb-1">Lead & Innovate</h4>
                        <p className="text-white/70 leading-relaxed text-sm">Thrive in today's competitive professional landscape</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 group/item">
                      <div className="w-6 h-6 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 group-hover/item:scale-110 transition-transform backdrop-blur-sm border border-white/10">
                        <CheckCircle className="h-4 w-4 text-emerald-300" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-base mb-1">Stay Relevant</h4>
                        <p className="text-white/70 leading-relaxed text-sm">In the fast-evolving landscape, staying relevant is a necessity</p>
                      </div>
                    </div>
                  </div>

                  {/* Premium CTA */}
                  <Link href="#certifications">
                    <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                      Start Your Journey
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Premium Floating Cards */}
              <div className="absolute -top-4 -right-4 bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 p-3 transform rotate-3 hover:rotate-6 transition-all duration-300 group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-lg flex items-center justify-center shadow-md backdrop-blur-sm border border-white/10">
                    <Users className="h-5 w-5 text-cyan-300" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-base">10K+</div>
                    <div className="text-xs text-white/70">Trusted Professionals</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 p-3 transform -rotate-3 hover:-rotate-6 transition-all duration-300 group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-lg flex items-center justify-center shadow-md backdrop-blur-sm border border-white/10">
                    <Award className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-base">95%</div>
                    <div className="text-xs text-white/70">Career Advancement</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
