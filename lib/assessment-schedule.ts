export function assessmentScheduleError(schedule: { startsAt?: Date | null; endsAt?: Date | null }, now = new Date()) {
  if (schedule.startsAt && now < schedule.startsAt) return "This assessment has not opened yet."
  if (schedule.endsAt && now >= schedule.endsAt) return "This assessment is closed for new attempts."
  return null
}

export function localDateTime(value?: string | Date | null) {
  if (!value) return ""
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
