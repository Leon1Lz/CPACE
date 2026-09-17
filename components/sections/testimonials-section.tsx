"use client"

import { useState, useEffect, useCallback } from "react"
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react"

const testimonials = [
  {
    name: "Maria Santos",
    designation: "HR Manager",
    company: "Ayala Corporation",
    quote:
      "The CFMS® certification from CPACE Philippines has been a game-changer for my career. The comprehensive curriculum and expert instructors gave me the confidence to lead financial strategy at my organization. Highly recommended!",
    rating: 5,
    certification: "CFMS®",
    avatar: "MS",
    color: "from-emerald-500 to-teal-500",
  },
  {
    name: "Juan Dela Cruz",
    designation: "Marketing Director",
    company: "SM Investments",
    quote:
      "Earning my CMMS® credential was one of the best professional decisions I've made. The program is well-structured, industry-relevant, and the knowledge I gained directly improved our marketing campaigns and ROI.",
    rating: 5,
    certification: "CMMS®",
    avatar: "JD",
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "Ana Reyes",
    designation: "Operations Head",
    company: "Globe Telecom",
    quote:
      "CPACE's COMS® program gave me the tools to streamline operations and implement lean processes. The result? A 30% improvement in operational efficiency within the first quarter of applying what I learned.",
    rating: 5,
    certification: "COMS®",
    avatar: "AR",
    color: "from-violet-500 to-purple-500",
  },
  {
    name: "Ricardo Mendoza",
    designation: "HR Business Partner",
    company: "BDO Unibank",
    quote:
      "The CHRA™ review program prepared me thoroughly for the HR profession. The faculty's expertise in Philippine labor law and talent management is unmatched. I passed with flying colors!",
    rating: 5,
    certification: "CHRA™",
    avatar: "RM",
    color: "from-orange-500 to-amber-500",
  },
  {
    name: "Patricia Lim",
    designation: "Academic Dean",
    company: "FEU Cavite",
    quote:
      "As an institutional partner, we've seen firsthand how CPACE elevates our students' professional readiness. The certification programs seamlessly integrate with our curriculum, adding tremendous value.",
    rating: 5,
    certification: "Partner",
    avatar: "PL",
    color: "from-rose-500 to-pink-500",
  },
]

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length)
  }, [])

  const goToPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }, [])

  useEffect(() => {
    if (!isAutoPlaying) return
    const interval = setInterval(goToNext, 6000)
    return () => clearInterval(interval)
  }, [isAutoPlaying, goToNext])

  const current = testimonials[activeIndex]

  return (
    <section className="relative py-16 lg:py-24 bg-gradient-to-br from-gray-900 via-slate-900 to-emerald-950 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.6'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }}
        ></div>
      </div>
      <div className="absolute top-10 left-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-full text-sm font-semibold backdrop-blur-sm">
            <Star className="w-4 h-4" />
            What Our Professionals Say
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Trusted by{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              Thousands
            </span>{" "}
            of Professionals
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Hear from certified professionals and institutional partners who have experienced the CPACE difference.
          </p>
        </div>

        {/* Testimonial Card */}
        <div
          className="relative"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 lg:p-12 shadow-2xl">
            {/* Quote Icon */}
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 rounded-2xl flex items-center justify-center mb-8 border border-emerald-400/20">
              <Quote className="w-7 h-7 text-emerald-300" />
            </div>

            {/* Quote */}
            <blockquote className="text-xl lg:text-2xl text-white/90 leading-relaxed font-light mb-10 min-h-[120px]">
              &ldquo;{current.quote}&rdquo;
            </blockquote>

            {/* Author */}
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${current.color} rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                >
                  {current.avatar}
                </div>
                <div>
                  <div className="font-bold text-white text-lg">{current.name}</div>
                  <div className="text-white/60 text-sm">
                    {current.designation} • {current.company}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Certification Badge */}
                <span
                  className={`px-3 py-1.5 bg-gradient-to-r ${current.color} text-white text-xs font-bold rounded-full shadow-md`}
                >
                  {current.certification}
                </span>

                {/* Stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: current.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    i === activeIndex
                      ? "bg-emerald-400 w-8"
                      : "bg-white/30 w-2 hover:bg-white/50"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>

            {/* Arrows */}
            <div className="flex gap-3">
              <button
                onClick={goToPrev}
                className="w-10 h-10 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all duration-200 cursor-pointer"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToNext}
                className="w-10 h-10 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all duration-200 cursor-pointer"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
