"use client"

import { Users, Award, Handshake, Building } from "lucide-react"
import Link from "next/link"
import { cpaceStats } from "@/data/stats"

const partnerLogos = [
  "Arpa Law.jpeg",
  "Batangas State University TNEU.jpeg",
  "Cavite State University - Carmona Campus.png",
  "ePLDT.png",
  "FEU Cavite.webp",
  "FutuReady Asia Philippines.png",
  "Good Samaritan Colleges.png",
  "Holy Angel University.png",
  "HRM Asia.jpeg",
  "Mary the Queen College Pampanga.jpeg",
  "Occidental Mindoro State College.jpg",
  "Panpacific University.webp",
  "PHRI.jpg",
  "Quirino State University - Cabarroguis Campus.jpeg",
  "San Beda University.webp",
  "Screenshot 2026-06-20 at 7.50.08 AM.png",
  "STI College.png",
  "SYFINEX.webp",
  "Trimex Colleges.png",
  "University of Cordilleras.webp",
  "University of St. La Salle.jpeg",
  "VRP Medical Center.png",
  "Western Leyte College of Ormoc.jpeg",
]

// Split logos into rows for the marquee
const row1 = partnerLogos.slice(0, 12)
const row2 = partnerLogos.slice(12)

function getSchoolName(filename: string) {
  return filename.replace(/\.(png|jpg|jpeg|svg|webp)$/i, "")
}

function LogoCard({ filename }: { filename: string }) {
  const name = getSchoolName(filename)
  const src = `/assets/partners/${encodeURIComponent(filename)}`

  return (
    <div
      className="flex-shrink-0 w-36 h-36 md:w-40 md:h-40 bg-white rounded-2xl flex items-center justify-center p-4 shadow-md border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 mx-3 overflow-hidden"
      title={name}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={name}
        className="object-contain max-w-full max-h-full w-auto h-auto"
        loading="lazy"
      />
    </div>
  )
}

function MarqueeRow({ logos, direction = "left", duration = 60 }: { logos: string[]; direction?: "left" | "right"; duration?: number }) {
  const animationClass = direction === "left" ? "animate-marquee-left" : "animate-marquee-right"

  return (
    <div className="relative overflow-hidden py-3">
      {/* Gradient fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-gray-50 via-gray-50/80 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-gray-50 via-gray-50/80 to-transparent z-10 pointer-events-none"></div>

      <div
        className={`flex ${animationClass}`}
        style={{ animationDuration: `${duration}s` }}
      >
        {/* Duplicate the logos for seamless loop */}
        {logos.map((logo, i) => (
          <LogoCard key={`a-${i}`} filename={logo} />
        ))}
        {logos.map((logo, i) => (
          <LogoCard key={`b-${i}`} filename={logo} />
        ))}
      </div>
    </div>
  )
}

const stats = [
  {
    icon: <Award className="w-6 h-6" />,
    value: cpaceStats.certifiedProfessionals.value,
    label: cpaceStats.certifiedProfessionals.label,
    sublabel: cpaceStats.certifiedProfessionals.sublabel,
  },
  {
    icon: <Users className="w-6 h-6" />,
    value: cpaceStats.chraPassers.value,
    label: cpaceStats.chraPassers.label,
    sublabel: cpaceStats.chraPassers.sublabel,
  },
  {
    icon: <Handshake className="w-6 h-6" />,
    value: cpaceStats.institutionalPartners.value,
    label: cpaceStats.institutionalPartners.label,
    sublabel: cpaceStats.institutionalPartners.sublabel,
  }
]

export function InstitutionalPartnersSection() {
  return (
    <section className="relative py-16 lg:py-20 bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/30 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.6'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
        
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/30 via-transparent to-teal-200/30"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-green-200/20 via-transparent to-emerald-200/20"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-16">
          {/* Section Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-100/80 text-emerald-800 rounded-full text-xs font-semibold uppercase tracking-wider">
              <Handshake className="w-3.5 h-3.5" />
              Trusted Network
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Institutional Partners & Clients
            </h2>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed">
              Trusted by leading organizations and academic institutions across various industries for professional development and certification programs.
            </p>
          </div>

          {/* Partners Logo Marquee */}
          <div className="space-y-2">
            <MarqueeRow logos={row1} direction="left" duration={45} />
            <MarqueeRow logos={row2} direction="right" duration={50} />
          </div>

          {/* Statistical Overview */}
          <div className="text-center space-y-8">
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
              A Statistical Overview of Our Impact
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              {stats.map((stat, index) => (
                <div key={index} className="group">
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-md">
                      <div className="text-white">
                        {stat.icon}
                      </div>
                    </div>
                    
                    {/* Value */}
                    <div className="text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
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
              <Link href="/#contact">
                <button className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
                  <Building className="inline-block mr-2 h-4 w-4" />
                  Become a Partner
                </button>
              </Link>
              <Link href="/about">
                <button className="border border-white text-white hover:bg-white hover:text-emerald-600 font-semibold px-8 py-3 rounded-lg transition-all duration-300 cursor-pointer">
                  Learn About Us
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
