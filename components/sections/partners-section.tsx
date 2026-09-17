"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Handshake, Award, Users, Building, Star, ArrowRight } from "lucide-react"
import { cpaceStats } from "@/data/stats"

export function PartnersSection() {
  return (
    <section id="partners" className="relative py-16 lg:py-20 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30 overflow-hidden">
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
          
          {/* Partnership Programs */}
          <div className="space-y-12">
            {/* Institutional Partnerships */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-8 lg:p-12 border border-emerald-100">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                {/* Left Content */}
                <div className="space-y-6">
                  <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                    <Handshake className="w-4 h-4 mr-2" />
                    Institutional Partnerships
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                    Partner with Us for Institutional & Strategic Programs
                  </h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    Let&apos;s drive professional excellence. We welcome media, institutional, and diverse strategic partnerships that advance continuing education and empower careers. Let&apos;s create impactful opportunities together.
                  </p>
                  <Link href="/#contact">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                      Contact Us
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {/* Right Visual */}
                <div className="relative">
                  <div className="bg-white rounded-2xl shadow-xl p-8 border border-emerald-100">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <Building className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{cpaceStats.institutionalPartners.value}</div>
                        <div className="text-sm text-gray-600">Partners</div>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{cpaceStats.certifiedProfessionals.value}</div>
                        <div className="text-sm text-gray-600">Professionals</div>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <Award className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{cpaceStats.programsOffered.value}</div>
                        <div className="text-sm text-gray-600">Programs</div>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <Star className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{cpaceStats.successRate.value}</div>
                        <div className="text-sm text-gray-600">Success Rate</div>
                      </div>
                    </div>
                  </div>
                  {/* Floating Elements */}
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-emerald-400 rounded-full animate-pulse"></div>
                  <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-teal-400 rounded-full animate-pulse delay-1000"></div>
                </div>
              </div>
            </div>

            {/* Branded Training Programs */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl p-8 lg:p-12 border border-blue-100">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                {/* Left Visual */}
                <div className="relative order-2 lg:order-1">
                  <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
                    <img 
                      src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
                      alt="Branded Training Programs"
                      className="w-full h-48 object-cover rounded-xl mb-6 shadow-sm"
                    />
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Custom Program Development</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Brand Integration</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Strategic Partnership</span>
                      </div>
                    </div>
                  </div>
                  {/* Floating Elements */}
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-cyan-400 rounded-full animate-pulse delay-1000"></div>
                </div>

                {/* Right Content */}
                <div className="space-y-6 order-1 lg:order-2">
                  <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    <Award className="w-4 h-4 mr-2" />
                    Branded Programs
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                    Develop Branded Training Programs Together
                  </h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    Join CPACE Philippines in crafting tailored, branded programs designed to elevate your organization&apos;s impact. Together, we develop customized initiatives that enhance professional skills and reinforce your brand, ensuring a strategic and mutually beneficial partnership.
                  </p>
                  <Link href="/#contact">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                      Contact Us
                      <ArrowRight className="ml-2 h-4 w-4" />
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
