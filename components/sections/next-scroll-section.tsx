"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Award, Briefcase, BookOpen, Users, TrendingUp, Monitor } from "lucide-react"

export function NextScrollSection() {
  const services = [
    {
      icon: <Award className="h-6 w-6" />,
      title: "Professional Certification",
      description: "Elevate your career with industry-recognized certifications designed to validate your expertise and boost your professional standing.",
      color: "from-emerald-500 to-teal-500"
    },
    {
      icon: <Briefcase className="h-6 w-6" />,
      title: "Business Consultancy",
      description: "Expert guidance for businesses seeking ISO certification, intellectual property protection, and seamless business registration processes.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Certificate & Short Courses",
      description: "Acquire new skills or specialize in a field with our flexible diploma and targeted short courses.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Management Training",
      description: "Develop essential leadership qualities and strategic thinking to inspire teams and drive organizational success.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Reskilling & Upskilling",
      description: "Enhance individual and organizational capabilities through our diverse and practical training and workshops.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Monitor className="h-6 w-6" />,
      title: "Seminars & Webinars",
      description: "Stay informed and connect with industry experts through our insightful seminars and online webinars.",
      color: "from-indigo-500 to-purple-500"
    }
  ]

  return (
    <section className="relative py-16 lg:py-20 bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/30 overflow-hidden">
      {/* Background with Green Accents */}
      <div className="absolute inset-0">
        {/* Subtle Pattern */}
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.6'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
        
        {/* Green Gradient Mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/30 via-transparent to-teal-200/30"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-green-200/20 via-transparent to-emerald-200/20"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-12 right-12 w-24 h-24 bg-gradient-to-br from-emerald-400/30 to-green-400/30 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute top-24 left-16 w-32 h-32 bg-gradient-to-br from-green-400/25 to-teal-400/25 rounded-full blur-2xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-20 right-20 w-28 h-28 bg-gradient-to-br from-teal-400/30 to-emerald-400/30 rounded-full blur-2xl animate-pulse delay-2000"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8">
          {/* Main Heading */}
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-100/80 text-emerald-800 rounded-full text-xs font-semibold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              Comprehensive Programs
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              <span className="block text-gray-900">Skills Development That</span>
              <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Employers & Businesses Value
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Professional Advancement & Continuing Education with CPACE Philippines
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mt-12 text-left">
            {services.map((service, index) => (
              <Link 
                href="/services" 
                key={index} 
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5 overflow-hidden border border-gray-100 flex flex-col justify-between"
              >
                <div className="p-6 lg:p-8">
                  {/* Icon */}
                  <div className={`w-14 h-14 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                    <div className="text-white">
                      {service.icon}
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors">
                    {service.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-600 leading-relaxed text-sm">
                    {service.description}
                  </p>
                </div>

                <div className="px-6 lg:px-8 pb-6 pt-2 flex items-center text-sm font-semibold text-emerald-600 group-hover:text-emerald-700">
                  <span>Learn More</span>
                  <span className="ml-2 transform group-hover:translate-x-1.5 transition-transform duration-200">→</span>
                </div>
                
                {/* Hover Effect Bottom Border */}
                <div className={`h-1 bg-gradient-to-r ${service.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
              </Link>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 lg:p-12 text-white">
            <h3 className="text-2xl lg:text-3xl font-bold mb-4">
              Ready to Advance Your Career?
            </h3>
            <p className="text-emerald-100 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who have transformed their careers with our industry-recognized programs and expert-led training.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/#contact">
                <Button className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  Get Started Today
                </Button>
              </Link>
              <Link href="/services">
                <Button variant="ghost" className="border-2 border-white text-white hover:bg-white hover:text-emerald-600 font-semibold px-8 py-3 transition-all duration-300">
                  View All Programs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
