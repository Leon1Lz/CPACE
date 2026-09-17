"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  CalendarDays,
  Monitor,
  Building2,
  Zap,
} from "lucide-react"

const upcomingEvents = [
  {
    title: "CFMS® Certification Review & Examination",
    date: "October 18–19, 2026",
    month: "OCT",
    day: "18",
    time: "9:00 AM – 5:00 PM (PHT)",
    location: "Online via LMS + Proctored Exam",
    type: "online" as const,
    certification: "CFMS®",
    color: "from-emerald-500 to-teal-600",
    spots: "Limited slots available",
  },
  {
    title: "CHRA™ Review Lecture — Batch 47",
    date: "November 8–9, 2026",
    month: "NOV",
    day: "08",
    time: "8:30 AM – 5:30 PM (PHT)",
    location: "BGC Taguig City & Online Hybrid",
    type: "hybrid" as const,
    certification: "CHRA™",
    color: "from-orange-500 to-amber-600",
    spots: "Filling up fast",
  },
  {
    title: "CMMS® Certification Review & Examination",
    date: "November 22–23, 2026",
    month: "NOV",
    day: "22",
    time: "9:00 AM – 5:00 PM (PHT)",
    location: "Online via LMS + Proctored Exam",
    type: "online" as const,
    certification: "CMMS®",
    color: "from-blue-500 to-cyan-600",
    spots: "Open for registration",
  },
  {
    title: "DPODPS — Data Privacy Officer Training",
    date: "December 6–7, 2026",
    month: "DEC",
    day: "06",
    time: "9:00 AM – 4:00 PM (PHT)",
    location: "BGC Taguig City (In-Person)",
    type: "in-person" as const,
    certification: "DPODPS",
    color: "from-rose-500 to-pink-600",
    spots: "Early bird pricing available",
  },
]

function EventTypeBadge({ type }: { type: "online" | "hybrid" | "in-person" }) {
  const config = {
    online: {
      icon: <Monitor className="w-3 h-3" />,
      label: "Online",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    hybrid: {
      icon: <Zap className="w-3 h-3" />,
      label: "Hybrid",
      className: "bg-purple-50 text-purple-700 border-purple-200",
    },
    "in-person": {
      icon: <Building2 className="w-3 h-3" />,
      label: "In-Person",
      className: "bg-green-50 text-green-700 border-green-200",
    },
  }

  const { icon, label, className } = config[type]

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border ${className}`}
    >
      {icon}
      {label}
    </span>
  )
}

export function UpcomingEventsSection() {
  return (
    <section className="relative py-16 lg:py-24 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 overflow-hidden">
      {/* Background accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-100/40 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-100/80 text-emerald-800 rounded-full text-xs font-semibold uppercase tracking-wider">
            <CalendarDays className="w-3.5 h-3.5" />
            Upcoming Schedule
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
            Upcoming Training &{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
              Certification Events
            </span>
          </h2>
          <p className="text-lg text-gray-600">
            Secure your slot for our next certification review classes, examinations, and professional training
            programs.
          </p>
        </div>

        {/* Events List */}
        <div className="space-y-6 max-w-4xl mx-auto">
          {upcomingEvents.map((event, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Date Badge */}
                <div
                  className={`sm:w-28 lg:w-32 bg-gradient-to-br ${event.color} p-4 sm:p-6 flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-0 text-white text-center`}
                >
                  <div className="text-sm font-semibold uppercase opacity-90">{event.month}</div>
                  <div className="text-3xl lg:text-4xl font-black leading-none">{event.day}</div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 lg:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 bg-gradient-to-r ${event.color} text-white text-xs font-bold rounded-full`}
                        >
                          {event.certification}
                        </span>
                        <EventTypeBadge type={event.type} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                        {event.title}
                      </h3>
                    </div>
                    <Link href="https://linktr.ee/cpaceph" target="_blank" rel="noopener noreferrer">
                      <Button
                        className={`bg-gradient-to-r ${event.color} hover:opacity-90 text-white font-semibold px-5 py-2 text-sm shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 whitespace-nowrap`}
                      >
                        Register Now
                        <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      {event.date}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-500" />
                      {event.time}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-500" />
                      {event.location}
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-emerald-600 font-semibold">{event.spots}</div>
                </div>
              </div>

              {/* Bottom accent */}
              <div
                className={`h-0.5 bg-gradient-to-r ${event.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}
              ></div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12 space-y-4">
          <p className="text-gray-500 text-sm">
            Can&apos;t find a schedule that works? Contact us for custom training arrangements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/#contact">
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                Inquire About Schedules
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="https://linktr.ee/cpaceph" target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-semibold px-8 py-3"
              >
                View All Programs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
