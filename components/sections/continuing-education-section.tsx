"use client"

/* eslint-disable react/no-unescaped-entities */

import { Button } from "@/components/ui/button"
import { useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronUp, BookOpen, Users, Award, TrendingUp, Target, Lightbulb } from "lucide-react"

export function ContinuingEducationSection() {
  const [showMore, setShowMore] = useState(false)

  return (
    <section className="relative py-16 lg:py-20 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 overflow-hidden">
      {/* Enhanced Green Background with Multiple Layers */}
      <div className="absolute inset-0">
        {/* Subtle Pattern */}
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.6'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
        
        {/* Enhanced Green Gradient Mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/30 via-transparent to-teal-200/30"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-green-200/20 via-transparent to-emerald-200/20"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-teal-200/25 via-transparent to-green-200/25"></div>
      </div>

      {/* Enhanced Green Floating Elements */}
      <div className="absolute top-8 right-8 w-24 h-24 bg-gradient-to-br from-emerald-400/30 to-green-400/30 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute top-16 left-12 w-32 h-32 bg-gradient-to-br from-green-400/25 to-teal-400/25 rounded-full blur-2xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-16 right-16 w-28 h-28 bg-gradient-to-br from-teal-400/30 to-emerald-400/30 rounded-full blur-2xl animate-pulse delay-2000"></div>
      <div className="absolute bottom-24 left-8 w-20 h-20 bg-gradient-to-br from-green-400/25 to-emerald-400/25 rounded-full blur-2xl animate-pulse delay-500"></div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-4 lg:space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
              <Lightbulb className="w-3.5 h-3.5 mr-2" />
              Transform Your Career
            </div>

            {/* Enhanced Main Heading */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              <span className="block text-gray-900">Continuing Education &</span>
              <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Professional Certifications
              </span>
              <span className="block text-gray-900">in the Philippines</span>
            </h2>

            {/* Enhanced Content */}
            <div className="space-y-3 lg:space-y-4">
              <p className="text-base lg:text-lg text-gray-700 leading-relaxed font-medium">
                Your journey to impact starts here. Continuing education isn't just about gaining credentials; it's about seizing new opportunities and making a lasting difference.
              </p>
              
              <p className="text-base lg:text-lg text-gray-700 leading-relaxed font-medium">
                CPACE Philippines delivers powerful, relevant programs designed to equip you with the insights and abilities to lead, innovate, and thrive.
              </p>
              
              <p className="text-base lg:text-lg text-gray-700 leading-relaxed font-medium">
                Outpace the ordinary. In the fast-evolving professional landscape, staying relevant isn't an option – it's a necessity.
              </p>
            </div>

            {/* Enhanced Read More Button */}
            <div className="pt-2">
              <Button 
                variant="outline" 
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white font-semibold px-6 py-2.5 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                onClick={() => setShowMore(!showMore)}
              >
                {showMore ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Read More
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Column - Visual Asset */}
          <div className="relative lg:pl-6">
            {/* Main Image Card */}
            <div className="relative group">
              {/* Enhanced Green Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/30 to-green-400/30 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
              
              {/* Image Container */}
              <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-emerald-100">
                <div className="aspect-[4/3] relative">
                  <img 
                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                    alt="Professional Education"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                </div>
                
                {/* Overlay Content */}
                <div className="absolute bottom-3 lg:bottom-4 left-3 lg:left-4 right-3 lg:right-4">
                  <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 lg:p-4 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">Industry Recognized</h4>
                        <p className="text-xs text-gray-600">Trusted by 10,000+ professionals</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Stat Cards */}
              <div className="absolute -top-2 -right-2 lg:-top-3 lg:-right-3 bg-white rounded-lg shadow-lg p-2.5 lg:p-3 border border-emerald-100 transform rotate-3 hover:rotate-6 transition-all duration-300">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">10K+</div>
                    <div className="text-xs text-gray-600">Graduates</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-2 -left-2 lg:-bottom-3 lg:-left-3 bg-white rounded-lg shadow-lg p-2.5 lg:p-3 border border-emerald-100 transform -rotate-3 hover:-rotate-6 transition-all duration-300">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">95%</div>
                    <div className="text-xs text-gray-600">Success Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Expandable Content */}
        {showMore && (
          <div className="mt-16 transition-all duration-500">
            <div className="bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white">
                <h3 className="text-3xl font-bold mb-4">Why Choose CPACE Philippines?</h3>
                <p className="text-emerald-100 leading-relaxed max-w-3xl">
                  At CPACE Philippines, we believe in transformative education that goes beyond traditional learning. Our programs are meticulously designed to bridge the gap between academic knowledge and real-world application.
                </p>
              </div>

              {/* Feature Cards */}
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="group">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <BookOpen className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="font-bold text-gray-900 text-xl mb-3">Industry-Driven Curriculum</h4>
                      <p className="text-gray-600 leading-relaxed">
                        Programs developed in collaboration with industry experts and leading organizations to ensure real-world applicability.
                      </p>
                    </div>
                  </div>

                  <div className="group">
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Users className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="font-bold text-gray-900 text-xl mb-3">Expert Faculty</h4>
                      <p className="text-gray-600 leading-relaxed">
                        Learn from seasoned professionals with decades of combined industry experience and proven track records.
                      </p>
                    </div>
                  </div>

                  <div className="group">
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Target className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="font-bold text-gray-900 text-xl mb-3">Globally Recognized</h4>
                      <p className="text-gray-600 leading-relaxed">
                        Certifications acknowledged and respected by employers worldwide, opening doors to global opportunities.
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA Section */}
                <div className="mt-12 text-center bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-8">
                  <h4 className="text-2xl font-bold text-gray-900 mb-4">Ready to Transform Your Career?</h4>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    Join thousands of professionals who have advanced their careers with our industry-recognized certification programs.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/services">
                      <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                        Explore Programs
                      </Button>
                    </Link>
                    <Link href="/#contact">
                      <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-semibold px-8 py-3">
                        Inquire Now
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
