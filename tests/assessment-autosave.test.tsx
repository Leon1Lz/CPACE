import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { useAssessmentAutosave, type DraftAnswers } from "@/lib/use-assessment-autosave"

const fetchMock = vi.fn()
beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal("fetch", fetchMock); fetchMock.mockReset() })
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })
const advance = () => act(async () => { await vi.advanceTimersByTimeAsync(1000) })
const initial: DraftAnswers = { q: { content: "first" } }

it("debounces saves and displays confirmed save status", async () => {
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ version: 1 }) })
  const { result } = renderHook(() => useAssessmentAutosave("exam", "session", initial, true))
  expect(fetchMock).not.toHaveBeenCalled()
  await advance()
  expect(result.current.status).toBe("Answers saved")
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ version: 0, answers: initial })
})

it("retries an uncertain write identically before saving newer edits", async () => {
  fetchMock.mockRejectedValueOnce(new Error("Network disconnected"))
    .mockResolvedValueOnce({ ok: true, json: async () => ({ version: 1 }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ version: 2 }) })
  const { result, rerender } = renderHook(({ answers }) => useAssessmentAutosave("exam", "session", answers, true), { initialProps: { answers: initial } })
  await advance()
  expect(result.current.status).toContain("Keep this page open")
  rerender({ answers: { q: { content: "second" } } })
  await advance()
  expect(fetchMock.mock.calls[1][1].body).toBe(fetchMock.mock.calls[0][1].body)
  await advance()
  expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toMatchObject({ version: 1, answers: { q: { content: "second" } } })
})

it("stops writes after a conflict instead of overwriting another tab", async () => {
  fetchMock.mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: "Attempt changed" }) })
  const { result } = renderHook(() => useAssessmentAutosave("exam", "session", initial, true))
  await advance()
  await advance()
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(result.current.status).toContain("Attempt changed")
})

it("restores a saved draft without rewriting it and stops saving outside taking", async () => {
  const { result, rerender } = renderHook(({ enabled }) => useAssessmentAutosave("exam", "session", initial, enabled), { initialProps: { enabled: true } })
  act(() => result.current.restore(5, initial))
  await advance()
  expect(fetchMock).not.toHaveBeenCalled()
  rerender({ enabled: false })
  await advance()
  expect(fetchMock).not.toHaveBeenCalled()
})
