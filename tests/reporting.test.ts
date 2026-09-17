import { describe, expect, it } from "vitest"
import { createCSV, csvCell, dailyActivity, parseReportRange, percentage, reportDay } from "@/lib/reporting"
const now = new Date("2026-09-17T18:00:00Z")
describe("real reporting dates and denominators", () => {
  it("uses Philippine calendar days rather than server-local dates", () => {
    expect(reportDay(now)).toBe("2026-09-18")
    const range = parseReportRange(new URLSearchParams(), now)
    expect(range.start).toBe("2026-08-20")
    expect(range.end).toBe("2026-09-18")
    expect(dailyActivity([], range)).toHaveLength(30)
  })
  it("counts the start boundary and excludes the next-day boundary", () => {
    const range = parseReportRange(new URLSearchParams("start=2026-09-17&end=2026-09-17"), now)
    expect(dailyActivity([new Date("2026-09-16T16:00:00Z"), new Date("2026-09-17T15:59:59Z"), new Date("2026-09-17T16:00:00Z")], range)[0].value).toBe(2)
  })
  it.each(["start=2026-02-30", "start=bad", "start=2026-09-18&end=2026-09-17", "start=2024-01-01&end=2026-09-17", "end=2026-09-19"])("rejects invalid/unbounded ranges: %s", query => {
    expect(() => parseReportRange(new URLSearchParams(query), now)).toThrow()
  })
  it("shows unavailable rather than a fake zero rate when no denominator exists", () => {
    expect(percentage(0, 0)).toBeNull()
    expect(percentage(2, 3)).toBe(66.7)
    expect(percentage(0, 5)).toBe(0)
  })
})
describe("spreadsheet exports", () => {
  it.each(["=SUM(1,2)", "+cmd", "-cmd", "@SUM(1)", " \t=HYPERLINK()", "\nformula"])("neutralizes formula-like user strings: %s", value => {
    expect(csvCell(value)).toBe(`"'${value}"`)
  })
  it("quotes commas, quotes, multiline values, and retains numeric values", () => {
    expect(csvCell('a,"b"')).toBe('"a,""b"""')
    expect(csvCell(-12)).toBe('"-12"')
    expect(createCSV(["Name"], [["José"], ["a\nb"]])).toBe('\uFEFF"Name"\r\n"José"\r\n"a\nb"')
  })
})
