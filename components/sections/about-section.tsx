"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookOpen, Target, Award, TrendingUp, Users, ArrowRight, CheckCircle, GraduationCap, Lightbulb, Rocket, Star, Globe } from "lucide-react"

export function AboutSection() {
  const benefits = [
    "Expand Knowledge and Skills",
    "Gain Competitive Advantage", 
    "Boost Productivity",
    "Increase Earning Potential",
    "Establish Professional Credibility"
  ]

  const stats = [
    { value: "10,000+", label: "Graduates", icon: <Users className="w-5 h-5" /> },
    { value: "95%", label: "Success Rate", icon: <TrendingUp className="w-5 h-5" /> },
    { value: "50+", label: "Programs", icon: <BookOpen className="w-5 h-5" /> },
    { value: "500+", label: "Partners", icon: <Globe className="w-5 h-5" /> }
  ]

  return (
    <section className="relative py-16 lg:py-20 bg-gradient-to-br from-slate-50 via-emerald-50/40 to-teal-50/40 overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0">
        {/* Animated Pattern */}
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px'
        }}></div>
        
        {/* Enhanced Gradient Mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/40 via-transparent to-teal-200/40"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-green-200/30 via-transparent to-emerald-200/30"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-teal-200/25 via-transparent to-cyan-200/25"></div>
      </div>

      {/* Enhanced Floating Elements */}
      <div className="absolute top-12 right-12 w-32 h-32 bg-gradient-to-br from-emerald-400/40 to-green-400/40 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute top-24 left-16 w-40 h-40 bg-gradient-to-br from-green-400/35 to-teal-400/35 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-teal-400/40 to-emerald-400/40 rounded-full blur-3xl animate-pulse delay-2000"></div>
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-br from-cyan-400/30 to-blue-400/30 rounded-full blur-2xl animate-pulse delay-3000"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-20">
          {/* Hero Section with Visual */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold border border-emerald-200">
                <Lightbulb className="w-4 h-4 mr-2" />
                Who We Are
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Start your journey to professional excellence with CPACE Philippines
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed">
                We provide professional development and continuing education opportunities to individuals and organizations. CPACE Philippines offers a variety of courses and programs including training, seminars, conventions, conferences, webinars, workshops, and other learning development activities designed to help professionals stay up-to-date on the latest trends in business and administration.
              </p>

              <Link href="/programs">
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-8 py-4 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-lg">
                  Learn More
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Visual Asset */}
            <div className="relative">
              <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl p-8 shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  {stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <div className="text-white">{stat.icon}</div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-emerald-400 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-teal-400 rounded-full animate-pulse delay-1000"></div>
            </div>
          </div>

          {/* Enhanced About Us, Vision, Mission Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* About Us */}
            <div className="group bg-white rounded-3xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="space-y-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">About Us</h3>
                <p className="text-gray-600 leading-relaxed">
                  Our professional organization offers various continuing education opportunities for individuals and organizations who want to advance their career and professional growth. Whether you want to acquire new skills, update your knowledge or earn certification, we have the right courses and programs for you.
                </p>
                <div className="pt-4">
                  <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                </div>
              </div>
            </div>

            {/* Our Vision */}
            <div className="group bg-white rounded-3xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="space-y-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Our Vision</h3>
                <p className="text-gray-600 leading-relaxed">
                  To become the prime institution for professional advancement and continuing education in the Philippines.
                </p>
                <div className="pt-4">
                  <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                </div>
              </div>
            </div>

            {/* Our Mission */}
            <div className="group bg-white rounded-3xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="space-y-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Our Mission</h3>
                <p className="text-gray-600 leading-relaxed">
                  CPACE Philippines is committed to providing excellent and quality-assured continuing education programs for individuals seeking career advancement, personal enrichment, and professional development through learning opportunities.
                </p>
                <div className="pt-4">
                  <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Why Further Your Education with Image */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-12 lg:p-16 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold border border-white/30">
                  <Rocket className="w-4 h-4 mr-2" />
                  Why Further Your Education?
                </div>
                <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                  Step into a world where education meets opportunity
                </h2>
                <p className="text-xl text-emerald-100 leading-relaxed">
                  Discover how furthering your education can open doors to new possibilities, elevate your career, and bring out the best version of yourself. Your journey to excellence starts here.
                </p>
                <p className="text-xl text-emerald-100 leading-relaxed">
                  With CPACE Philippines, you're not just acquiring knowledge; you're cultivating a mindset that embraces change, nurtures innovation, and ultimately leads to sustainable growth and success.
                </p>
              </div>
              
              {/* Visual Asset */}
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
                  alt="Professional Education"
                  className="rounded-2xl shadow-2xl w-full h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/50 to-transparent rounded-2xl"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <GraduationCap className="w-8 h-8 text-emerald-600" />
                      <div>
                        <h4 className="font-bold text-gray-900">Professional Excellence</h4>
                        <p className="text-sm text-gray-600">Achieve your career goals</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Benefits Grid */}
          <div className="text-center space-y-12">
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                <Star className="w-4 h-4 mr-2" />
                Benefits of Further Education
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
                Transform Your Career Today
              </h3>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Discover the endless possibilities that await you with our comprehensive professional development programs.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="group bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{benefit}</h4>
                      <p className="text-gray-600 text-sm">
                        Unlock new opportunities and accelerate your professional growth with our expert-led programs.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced CTA Section */}
          <div className="text-center">
            <div className="bg-gradient-to-br from-gray-50 to-emerald-50 rounded-3xl shadow-2xl p-12 lg:p-16 border border-emerald-100 relative overflow-hidden">
              {/* Background Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-200/30 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-200/30 rounded-full blur-2xl"></div>
              
              <div className="relative z-10 space-y-8">
                <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                  <Rocket className="w-4 h-4 mr-2" />
                  Ready to Start Your Journey?
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold text-gray-900">
                  Join Thousands of Successful Professionals
                </h3>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Transform your career with our industry-recognized certification programs and expert-led training.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Link href="/programs">
                    <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-10 py-4 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-lg">
                      Explore Programs
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white font-semibold px-10 py-4 transition-all duration-300 text-lg">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
