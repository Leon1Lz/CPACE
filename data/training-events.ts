export type TrainingEvent = {
  id: string
  title: string
  certification: string
  startDate: string
  endDate: string | null
  time: string
  location: string
  deliveryMode: "online" | "hybrid" | "in-person"
  color: string
  spots: string
  registrationUrl: string
  isPublished: boolean
  sortOrder: number
}

export const eventColors = [
  { value: "from-emerald-500 to-teal-600", label: "Emerald" },
  { value: "from-orange-500 to-amber-600", label: "Orange" },
  { value: "from-blue-500 to-cyan-600", label: "Blue" },
  { value: "from-rose-500 to-pink-600", label: "Rose" },
  { value: "from-violet-500 to-purple-600", label: "Violet" },
]

export const defaultTrainingEvents: TrainingEvent[] = [
  { id: "default-cfms-2026", title: "CFMS® Certification Review & Examination", certification: "CFMS®", startDate: "2026-10-18", endDate: "2026-10-19", time: "9:00 AM – 5:00 PM (PHT)", location: "Online via LMS + Proctored Exam", deliveryMode: "online", color: eventColors[0].value, spots: "Limited slots available", registrationUrl: "https://linktr.ee/cpaceph", isPublished: true, sortOrder: 0 },
  { id: "default-chra-2026", title: "CHRA™ Review Lecture — Batch 47", certification: "CHRA™", startDate: "2026-11-08", endDate: "2026-11-09", time: "8:30 AM – 5:30 PM (PHT)", location: "BGC Taguig City & Online Hybrid", deliveryMode: "hybrid", color: eventColors[1].value, spots: "Filling up fast", registrationUrl: "https://linktr.ee/cpaceph", isPublished: true, sortOrder: 1 },
  { id: "default-cmms-2026", title: "CMMS® Certification Review & Examination", certification: "CMMS®", startDate: "2026-11-22", endDate: "2026-11-23", time: "9:00 AM – 5:00 PM (PHT)", location: "Online via LMS + Proctored Exam", deliveryMode: "online", color: eventColors[2].value, spots: "Open for registration", registrationUrl: "https://linktr.ee/cpaceph", isPublished: true, sortOrder: 2 },
  { id: "default-dpodps-2026", title: "DPODPS — Data Privacy Officer Training", certification: "DPODPS", startDate: "2026-12-06", endDate: "2026-12-07", time: "9:00 AM – 4:00 PM (PHT)", location: "BGC Taguig City (In-Person)", deliveryMode: "in-person", color: eventColors[3].value, spots: "Early bird pricing available", registrationUrl: "https://linktr.ee/cpaceph", isPublished: true, sortOrder: 3 },
]

function asLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function eventDateParts(event: Pick<TrainingEvent, "startDate" | "endDate">) {
  const start = asLocalDate(event.startDate)
  const end = event.endDate ? asLocalDate(event.endDate) : null
  const month = start.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
  const day = start.toLocaleDateString("en-US", { day: "2-digit" })
  const startLabel = start.toLocaleDateString("en-US", { month: "long", day: "numeric" })
  const endLabel = end?.toLocaleDateString("en-US", {
    month: end.getMonth() === start.getMonth() ? undefined : "long",
    day: "numeric",
  })
  return { month, day, dateLabel: `${startLabel}${endLabel ? `–${endLabel}` : ""}, ${start.getFullYear()}` }
}
