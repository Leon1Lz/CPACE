"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Building2, Calendar, CalendarDays, Clock, MapPin, Monitor, Zap } from "lucide-react"
import { defaultTrainingEvents, eventDateParts, type TrainingEvent } from "@/data/training-events"

function EventTypeBadge({ type }: { type: TrainingEvent["deliveryMode"] }) {
  const config = {
    online: { icon: <Monitor className="h-3 w-3" />, label: "Online", className: "bg-blue-50 text-blue-700 border-blue-200" },
    hybrid: { icon: <Zap className="h-3 w-3" />, label: "Hybrid", className: "bg-purple-50 text-purple-700 border-purple-200" },
    "in-person": { icon: <Building2 className="h-3 w-3" />, label: "In-Person", className: "bg-green-50 text-green-700 border-green-200" },
  }
  const badge = config[type]

  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.className}`}>{badge.icon}{badge.label}</span>
}

export function UpcomingEventsSection() {
  const [upcomingEvents, setUpcomingEvents] = useState<TrainingEvent[]>(defaultTrainingEvents)

  useEffect(() => {
    fetch("/api/training-events")
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(events => {
        if (Array.isArray(events)) setUpcomingEvents(events)
      })
      .catch(() => {
        // Keep the bundled schedule visible if the API is temporarily unavailable.
      })
  }, [])

  return (
    <section id="upcoming-events" className="relative scroll-mt-24 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 py-16 lg:py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-emerald-100/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-teal-100/40 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100/80 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800">
            <CalendarDays className="h-3.5 w-3.5" /> Upcoming Schedule
          </div>
          <h2 className="text-3xl font-bold leading-tight text-gray-900 md:text-4xl lg:text-5xl">
            Upcoming Training &amp; <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Certification Events</span>
          </h2>
          <p className="text-lg text-gray-600">Secure your slot for our next certification review classes, examinations, and professional training programs.</p>
        </div>

        <div className="mx-auto max-w-4xl space-y-6">
          {upcomingEvents.map(event => {
            const { month, day, dateLabel } = eventDateParts(event)
            return (
              <div key={event.id} className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
                <div className="flex flex-col sm:flex-row">
                  <div className={`flex flex-row items-center justify-center gap-2 bg-gradient-to-br p-4 text-center text-white sm:w-28 sm:flex-col sm:gap-0 sm:p-6 lg:w-32 ${event.color}`}>
                    <div className="text-sm font-semibold uppercase opacity-90">{month}</div>
                    <div className="text-3xl font-black leading-none lg:text-4xl">{day}</div>
                  </div>

                  <div className="flex-1 p-6 lg:p-8">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full bg-gradient-to-r px-2.5 py-0.5 text-xs font-bold text-white ${event.color}`}>{event.certification}</span>
                          <EventTypeBadge type={event.deliveryMode} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 transition-colors group-hover:text-emerald-700">{event.title}</h3>
                      </div>
                      <Button asChild className={`bg-gradient-to-r px-5 py-2 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:scale-105 hover:opacity-90 hover:shadow-lg ${event.color}`}>
                        <Link href={event.registrationUrl} target="_blank" rel="noopener noreferrer">Register Now<ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-emerald-500" />{dateLabel}</div>
                      <div className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-emerald-500" />{event.time}</div>
                      <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-emerald-500" />{event.location}</div>
                    </div>
                    <div className="mt-3 text-xs font-semibold text-emerald-600">{event.spots}</div>
                  </div>
                </div>
                <div className={`h-0.5 origin-left scale-x-0 bg-gradient-to-r transition-transform duration-500 group-hover:scale-x-100 ${event.color}`} />
              </div>
            )
          })}
        </div>

        <div className="mt-12 space-y-4 text-center">
          <p className="text-sm text-gray-500">Can&apos;t find a schedule that works? Contact us for custom training arrangements.</p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl">
              <Link href="/#contact">Inquire About Schedules<ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="border-emerald-600 px-8 py-3 font-semibold text-emerald-600 hover:bg-emerald-50">
              <Link href="https://linktr.ee/cpaceph" target="_blank" rel="noopener noreferrer">View All Programs</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
