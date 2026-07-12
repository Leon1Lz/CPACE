"use client"

import { useState, useEffect } from "react"
import { Building, Users, Award, Handshake, ChevronLeft, ChevronRight } from "lucide-react"

export function InstitutionalPartnersSection() {
  const [currentSlide, setCurrentSlide] = useState(0)

  // Placeholder partner logos - you can replace these with actual logos
  const partnerLogos = [
    { name: "Partner 1", logo: "🏛️" },
    { name: "Partner 2", logo: "🏢" },
    { name: "Partner 3", logo: "🏭" },
    { name: "Partner 4", logo: "🏦" },
    { name: "Partner 5", logo: "🏛️" },
    { name: "Partner 6", logo: "🏢" },
  ]

  const stats = [
    {
      icon: <Award className="w-6 h-6" />,
      value: "9,280+",
      label: "Certified Professionals",
      sublabel: "CFMS® | CMMS® | COMS®"
    },
    {
      icon: <Users className="w-6 h-6" />,
      value: "3,160+",
      label: "Happy Clients",
      sublabel: "Review Lecture CHRA™ Review Passers"
    },
    {
      icon: <Handshake className="w-6 h-6" />,
      value: "20+",
      label: "Happy Clients",
      sublabel: "Collaborations Institutional & Industry Partners"
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.ceil(partnerLogos.length / 3))
    }, 4000) // Change slide every 4 seconds

    return () => clearInterval(timer)
  }, [partnerLogos.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(partnerLogos.length / 3))
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(partnerLogos.length / 3)) % Math.ceil(partnerLogos.length / 3))
  }

  const getVisiblePartners = () => {
    const startIndex = currentSlide * 3
    return partnerLogos.slice(startIndex, startIndex + 3)
  }

  return (
    <section className="relative py-16 lg:py-20 bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/30 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        {/* Subtle Pattern */}
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.6'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
        
        {/* Gradient Mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/30 via-transparent to-teal-200/30"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-green-200/20 via-transparent to-emerald-200/20"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-12 right-12 w-24 h-24 bg-gradient-to-br from-emerald-400/30 to-green-400/30 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute top-24 left-16 w-32 h-32 bg-gradient-to-br from-green-400/25 to-teal-400/25 rounded-full blur-2xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-20 right-20 w-28 h-28 bg-gradient-to-br from-teal-400/30 to-emerald-400/30 rounded-full blur-2xl animate-pulse delay-2000"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-16">
          {/* Section Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">
              Institutional Partners & Clients
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Trusted by leading organizations and institutions across various industries for professional development and certification programs.
            </p>
          </div>

          {/* Partners Logo Slideshow */}
          <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-12 border border-gray-100">
            <div className="relative">
              {/* Slideshow Container */}
              <div className="overflow-hidden">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {Array.from({ length: Math.ceil(partnerLogos.length / 3) }).map((_, slideIndex) => (
                    <div key={slideIndex} className="w-full flex-shrink-0 px-4">
                      <div className="grid grid-cols-3 gap-8 items-center">
                        {partnerLogos.slice(slideIndex * 3, (slideIndex + 1) * 3).map((partner, index) => (
                          <div key={index} className="text-center group">
                            <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg hover:shadow-xl">
                              {partner.logo}
                            </div>
                            <p className="text-sm font-semibold text-gray-700">{partner.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>

              {/* Slide Indicators */}
              <div className="flex justify-center mt-6 space-x-2">
                {Array.from({ length: Math.ceil(partnerLogos.length / 3) }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      currentSlide === index ? 'bg-emerald-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Statistical Overview */}
          <div className="text-center space-y-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
              A Statistical Overview of Our Impact
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              {stats.map((stat, index) => (
                <div key={index} className="group">
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      <div className="text-white">
                        {stat.icon}
                      </div>
                    </div>
                    
                    {/* Value */}
                    <div className="text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
                      {stat.value}
                    </div>
                    
                    {/* Label */}
                    <div className="text-lg font-semibold text-gray-900 mb-2">
                      {stat.label}
                    </div>
                    
                    {/* Sublabel */}
                    <div className="text-sm text-gray-600 leading-relaxed">
                      {stat.sublabel}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 lg:p-12 text-white text-center">
            <h3 className="text-2xl lg:text-3xl font-bold mb-4">
              Join Our Growing Network of Partners
            </h3>
            <p className="text-emerald-100 mb-8 max-w-2xl mx-auto">
              Become part of our success story and collaborate with us to deliver world-class professional development programs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <Building className="inline-block mr-2 h-4 w-4" />
                Become a Partner
              </button>
              <button className="border border-white text-white hover:bg-white hover:text-emerald-600 font-semibold px-8 py-3 transition-all duration-300">
                View All Partners
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
