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
  {
    id: "default-cfms-b35",
    title: "CFMS® Assessment Examination – Batch 35",
    certification: "CFMS®",
    startDate: "2026-10-17",
    endDate: null,
    time: "8:00 AM – 11:00 AM (PHT)",
    location: "Online via LMS + Proctored Exam (Online, In-person, Hybrid)",
    deliveryMode: "online",
    color: eventColors[0].value,
    spots: "Open for registration",
    registrationUrl: "https://bit.ly/cpaceprograms",
    isPublished: true,
    sortOrder: 0,
  },
  {
    id: "default-cmms-b25",
    title: "CMMS® Assessment Examination – Batch 25",
    certification: "CMMS®",
    startDate: "2026-10-17",
    endDate: null,
    time: "12:00 PM – 3:00 PM (PHT)",
    location: "Online via LMS + Proctored Exam (Online, In-person, Hybrid)",
    deliveryMode: "online",
    color: eventColors[2].value,
    spots: "Open for registration",
    registrationUrl: "https://bit.ly/cpaceprograms",
    isPublished: true,
    sortOrder: 1,
  },
  {
    id: "default-coms-b25",
    title: "COMS® Assessment Examination – Batch 25",
    certification: "COMS®",
    startDate: "2026-10-17",
    endDate: null,
    time: "8:00 AM – 11:00 AM (PHT)",
    location: "Online via LMS + Proctored Exam (Online, In-person, Hybrid)",
    deliveryMode: "online",
    color: eventColors[4].value,
    spots: "Open for registration",
    registrationUrl: "https://bit.ly/cpaceprograms",
    isPublished: true,
    sortOrder: 2,
  },
  {
    id: "default-chms-b1",
    title: "CHMS® Assessment Examination – Batch 1",
    certification: "CHMS®",
    startDate: "2026-10-24",
    endDate: null,
    time: "8:00 AM – 11:00 AM (PHT)",
    location: "Online via LMS + Proctored Exam (Online, In-person, Hybrid)",
    deliveryMode: "online",
    color: eventColors[1].value,
    spots: "Temporary date and time • Open for registration",
    registrationUrl: "https://bit.ly/cpaceprograms",
    isPublished: true,
    sortOrder: 3,
  },
  {
    id: "default-chra-b47",
    title: "CHRA® Review Lecture — Batch 47",
    certification: "CHRA®",
    startDate: "2026-10-17",
    endDate: null,
    time: "1:00 PM – 3:00 PM (PHT)",
    location: "Online via LMS + Live Session (Online, In-person, Hybrid)",
    deliveryMode: "online",
    color: eventColors[3].value,
    spots: "Filling up fast",
    registrationUrl: "https://bit.ly/chraonlinereview",
    isPublished: true,
    sortOrder: 4,
  },
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
