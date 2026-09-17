export const REPORT_TIME_ZONE = "Asia/Manila"
const DAY_MS = 86400000
const OFFSET_MS = 8 * 3600000
export const MAX_EXPORT_ROWS = 10000
export type ReportRange = { start: string; end: string; from: Date; until: Date }
export type ActivityPoint = { date: string; day: string; value: number }
export function reportDay(value: Date) { return new Date(value.getTime() + OFFSET_MS).toISOString().slice(0, 10) }
function calendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Use YYYY-MM-DD dates")
  const parsed = new Date(`${value}T00:00:00+08:00`)
  if (!Number.isFinite(parsed.getTime()) || reportDay(parsed) !== value) throw new Error("Invalid calendar date")
  return parsed
}
export function parseReportRange(params: URLSearchParams, now = new Date()): ReportRange {
  const end = params.get("end") ?? reportDay(now)
  const endDate = calendarDate(end)
  const start = params.get("start") ?? reportDay(new Date(endDate.getTime() - 29 * DAY_MS))
  const from = calendarDate(start), until = new Date(endDate.getTime() + DAY_MS)
  if (from > endDate || until.getTime() - from.getTime() > 366 * DAY_MS || end > reportDay(now)) throw new Error("Choose an ordered date range of up to 366 days ending no later than today")
  return { start, end, from, until }
}
export function dailyActivity(dates: Date[], range: ReportRange): ActivityPoint[] {
  const counts = new Map<string, number>()
  for (const date of dates) {
    if (date < range.from || date >= range.until) continue
    const day = reportDay(date); counts.set(day, (counts.get(day) ?? 0) + 1)
  }
  const result: ActivityPoint[] = []
  for (let cursor = range.from.getTime(); cursor < range.until.getTime(); cursor += DAY_MS) {
    const date = new Date(cursor), key = reportDay(date)
    result.push({ date: key, day: new Intl.DateTimeFormat("en", { weekday: "short", timeZone: REPORT_TIME_ZONE }).format(date), value: counts.get(key) ?? 0 })
  }
  return result
}
export function percentage(numerator: number, denominator: number) { return denominator ? Math.round(numerator / denominator * 1000) / 10 : null }
export function csvCell(value: unknown): string {
  if (value == null) return '""'
  if (typeof value === "number" || typeof value === "boolean") return `"${value}"`
  if (value instanceof Date) return `"${value.toISOString()}"`
  let text = String(value)
  // Quoting alone does not prevent spreadsheet formula execution.
  let prefix = 0
  while (prefix < text.length && (/\s/.test(text[prefix]) || text.charCodeAt(prefix) < 32)) prefix += 1
  if ((prefix < text.length && "=+@-".includes(text[prefix])) || /^[\t\r\n]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}
export function createCSV(headers: string[], rows: unknown[][]) { return "\uFEFF" + [headers, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n") }
export type ReportSummary = {
  role: "ADMIN" | "INSTRUCTOR" | "LEARNER"
  range: { start: string; end: string; timeZone: string }
  summary: { enrollments: number; completed: number; completionRate: number | null; attempts: number; gradedAttempts: number; passed: number; passRate: number | null; averageScore: number | null; manualReviewSubmissions: number }
  activity: ActivityPoint[]
  courses: { id: string; title: string; enrollments: number; completed: number; completionRate: number | null; attempts: number; gradedAttempts: number; passRate: number | null }[]
  results: { id: string; title: string; courseTitle: string; completedAt: string; score: number | null; passed: boolean | null; scoresReleased: boolean; manualReview: boolean; feedback?: { question: string; points: number; maximum: number; feedback: string | null }[] }[]
}
