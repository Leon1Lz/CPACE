"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Award, Briefcase, BookOpen, Users, TrendingUp, Presentation, ArrowRight, Star, Zap, GraduationCap, Globe, CheckCircle } from "lucide-react"

const services = [
  {
    icon: <Award className="w-7 h-7 text-white" />,
    gradient: "from-emerald-500 to-teal-600",
    lightBg: "bg-emerald-50",
    lightText: "text-emerald-700",
    lightBorder: "border-emerald-200",
    badge: "Most Popular",
    number: "01",
    title: "Professional Certification",
    description: "Elevate your career with industry-recognized certifications designed to validate your expertise and boost your professional standing.",
    href: "/services/professional-certification",
  },
  {
    icon: <Briefcase className="w-7 h-7 text-white" />,
    gradient: "from-blue-500 to-cyan-600",
    lightBg: "bg-blue-50",
    lightText: "text-blue-700",
    lightBorder: "border-blue-200",
    badge: null,
    number: "02",
    title: "Business Consultancy",
    description: "Expert guidance for businesses seeking ISO certification, intellectual property protection, and seamless business registration processes.",
    href: "/services/business-consultancy",
  },
  {
    icon: <BookOpen className="w-7 h-7 text-white" />,
    gradient: "from-violet-500 to-purple-600",
    lightBg: "bg-violet-50",
    lightText: "text-violet-700",
    lightBorder: "border-violet-200",
    badge: null,
    number: "03",
    title: "Certificate & Short Courses",
    description: "Acquire new skills or specialize in a field with our flexible diploma and targeted short courses.",
    href: "/services/certificate-courses",
  },
  {
    icon: <Users className="w-7 h-7 text-white" />,
    gradient: "from-orange-500 to-amber-600",
    lightBg: "bg-orange-50",
    lightText: "text-orange-700",
    lightBorder: "border-orange-200",
    badge: null,
    number: "04",
    title: "Management Training",
    description: "Develop essential leadership qualities and strategic thinking to inspire teams and drive organizational success.",
    href: "/services/management-training",
  },
  {
    icon: <TrendingUp className="w-7 h-7 text-white" />,
    gradient: "from-rose-500 to-pink-600",
    lightBg: "bg-rose-50",
    lightText: "text-rose-700",
    lightBorder: "border-rose-200",
    badge: null,
    number: "05",
    title: "Reskilling & Upskilling",
    description: "Enhance individual and organizational capabilities through our diverse and practical training programs.",
    href: "/services/reskilling-upskilling",
  },
  {
    icon: <Presentation className="w-7 h-7 text-white" />,
    gradient: "from-teal-500 to-emerald-600",
    lightBg: "bg-teal-50",
    lightText: "text-teal-700",
    lightBorder: "border-teal-200",
    badge: null,
    number: "06",
    title: "Seminars & Webinars",
    description: "Stay informed and connect with industry experts through our insightful seminars and online webinars.",
    href: "/services/seminars-webinars",
  },
]

const stats = [
  { value: "6+", label: "Service Categories", icon: <Zap className="w-5 h-5" /> },
  { value: "50+", label: "Programs Available", icon: <BookOpen className="w-5 h-5" /> },
  { value: "10K+", label: "Professionals Served", icon: <Users className="w-5 h-5" /> },
  { value: "100%", label: "Industry Recognized", icon: <Award className="w-5 h-5" /> },
]

export function ServicesSection() {
  return (
    <section id="services" className="relative overflow-hidden">

      {/* ── Hero Banner ── */}
      <div className="relative py-20 lg:py-28 bg-gradient-to-br from-gray-900 via-emerald-950 to-slate-900 overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{
            backgroundImage: `url("https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80")`
          }}></div>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-emerald-950/80 to-slate-900/90"></div>
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.07]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.6'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        {/* Floating orbs */}
        <div className="absolute top-10 left-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-56 h-56 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-800/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-full text-sm font-semibold backdrop-blur-sm">
                <Zap className="w-4 h-4" />
                Professional Advancement, Industry Standards
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Elevate Your Expertise.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  Embrace Industry Excellence.
                </span>
              </h2>
              <p className="text-lg text-white/70 leading-relaxed">
                At CPACE Philippines, we provide strategic learning pathways, industry-recognized certifications, and innovative training programs designed to elevate your career and position you at the forefront of your field.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold px-8 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                    Get Started
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 font-semibold px-8 py-3 backdrop-blur-sm transition-all duration-300">
                    Learn About Us
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right — Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, i) => (
                <div key={i} className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 rounded-xl flex items-center justify-center mb-4 text-emerald-300 group-hover:scale-110 transition-transform duration-300">
                    {stat.icon}
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Services Grid ── */}
      <div className="relative py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
        {/* Background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-100/60 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-teal-100/60 to-transparent rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

          {/* Sub-header */}
          <div className="text-center space-y-5 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-semibold text-gray-700 shadow-sm">
              <Star className="w-4 h-4 text-emerald-500" />
              Lifelong Learning Solutions for Growth
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
              Discover a dynamic suite of{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                professional development services
              </span>
            </h3>
            <p className="text-gray-600 text-lg leading-relaxed">
              Designed to empower individuals, elevate expertise, and meet evolving career goals with confidence and purpose.
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-3xl shadow-lg border border-gray-100/80 p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
              >
                {/* Hover glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300 rounded-3xl`}></div>

                {/* Number watermark */}
                <div className="absolute top-4 right-5 text-6xl font-black text-gray-100 group-hover:text-gray-50 transition-colors duration-300 select-none">
                  {service.number}
                </div>

                {/* Badge */}
                {service.badge && (
                  <div className="absolute top-4 left-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 ${service.lightBg} ${service.lightText} text-xs font-bold rounded-full border ${service.lightBorder}`}>
                      <Star className="w-3 h-3" />
                      {service.badge}
                    </span>
                  </div>
                )}

                <div className="relative z-10 space-y-5 mt-4">
                  {/* Icon */}
                  <div className={`w-14 h-14 bg-gradient-to-br ${service.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    {service.icon}
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors duration-200">
                      {service.title}
                    </h3>
                    <p className="text-gray-500 leading-relaxed text-sm">
                      {service.description}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gray-100 group-hover:bg-emerald-100 transition-colors duration-300"></div>

                  {/* CTA */}
                  <Link href={service.href}>
                    <button className={`flex items-center gap-2 text-sm font-semibold ${service.lightText} group/btn`}>
                      Learn More
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-200" />
                    </button>
                  </Link>
                </div>

                {/* Bottom accent */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${service.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-b-3xl`}></div>
              </div>
            ))}
          </div>

          {/* Bottom CTA Banner */}
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-cover bg-center" style={{
                backgroundImage: `url("https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80")`
              }}></div>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/95 via-teal-900/90 to-emerald-900/95"></div>
            </div>
            <div className="relative z-10 px-10 py-12 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left space-y-3">
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  <GraduationCap className="w-6 h-6 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">Join the community</span>
                </div>
                <h4 className="text-3xl font-bold text-white">Ready to Start Your Journey?</h4>
                <p className="text-white/70 max-w-xl">
                  Join thousands of professionals who have elevated their careers with CPACE Philippines' industry-recognized programs.
                </p>
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-2">
                  {["Certified Programs", "Expert Instructors", "Flexible Schedule"].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-white/80 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                <Link href="/services">
                  <Button className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-8 py-4 shadow-xl text-base whitespace-nowrap">
                    View All Services
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" className="border-white/40 text-white hover:bg-white/10 font-semibold px-8 py-4 text-base whitespace-nowrap backdrop-blur-sm">
                    Register Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>

    </section>
  )
}
