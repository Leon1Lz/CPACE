import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { EvidenceImage, SessionEvidencePanel } from "@/components/proctoring/session-evidence-panel"
import { loadProctorSessionList } from "@/lib/proctor-session-list"

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe("proctor evidence presentation", () => {
  it("fetches identity images from the authorized detail endpoint, not the list", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({
      session: { identityPhoto: "data:image/jpeg;base64,face", idPhoto: "data:image/jpeg;base64,id" },
      liveSnapshot: null, snapshotAt: null,
    }))
    vi.stubGlobal("fetch", fetcher)
    render(<SessionEvidencePanel sessionId="exam-1" isActive={false} liveSnapshot={null} />)
    expect(screen.getByRole("status")).toHaveTextContent("Loading protected evidence")
    const face = await screen.findByAltText("Captured examinee face photo")
    expect(face).toHaveAttribute("src", "data:image/jpeg;base64,face")
    expect(fetcher).toHaveBeenCalledWith("/api/proctor/sessions/exam-1/live", expect.objectContaining({ cache: "no-store" }))
    expect(screen.getByText(/requires human review|requires human|requires|require human review/i)).toBeInTheDocument()
    expect(screen.queryByText("VERIFIED")).not.toBeInTheDocument()
    expect(screen.queryByText("PASSED")).not.toBeInTheDocument()
  })

  it("uses explicit empty states without requesting broken placeholder images", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      session: { identityPhoto: null, idPhoto: null }, liveSnapshot: null, snapshotAt: null,
    })))
    render(<SessionEvidencePanel sessionId="exam-2" isActive={false} liveSnapshot={null} />)
    await screen.findAllByText("No image available")
    expect(screen.queryAllByRole("img")).toHaveLength(0)
  })

  it("provides a retry after an authorization or loading failure", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(Response.json({ error: "Unauthorized" }, { status: 401 }))
      .mockResolvedValueOnce(Response.json({ session: { identityPhoto: null, idPhoto: null }, liveSnapshot: null, snapshotAt: null }))
    vi.stubGlobal("fetch", fetcher)
    render(<SessionEvidencePanel sessionId="exam-3" isActive={false} liveSnapshot={null} />)
    expect(await screen.findByRole("alert")).toHaveTextContent("Unauthorized")
    fireEvent.click(screen.getByRole("button", { name: "Retry evidence" }))
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument())
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it("handles image decoding failures without displaying a broken image", () => {
    render(<EvidenceImage source="broken-image" label="ID evidence" />)
    fireEvent.error(screen.getByAltText("ID evidence"))
    expect(screen.getByText("Image unavailable")).toBeInTheDocument()
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
  })

  it("does not present stale realtime snapshots as a current camera frame", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      session: { identityPhoto: null, idPhoto: null },
      liveSnapshot: "stale-frame",
      snapshotAt: new Date(Date.now() - 60_000).toISOString(),
    })))
    render(<SessionEvidencePanel sessionId="exam-4" isActive={true} liveSnapshot="old-pusher-frame" />)
    expect(await screen.findByText("Waiting for a fresh camera frame.")).toBeInTheDocument()
    expect(screen.queryByAltText("Latest examinee camera frame")).not.toBeInTheDocument()
  })
})

describe("complete exam history loading", () => {
  it("loads subsequent cursor pages rather than silently stopping at 100", async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => ({ id: `exam-${index}` }))
    const fetcher = vi.fn()
      .mockResolvedValueOnce(Response.json({ data: firstPage, nextCursor: "exam-99" }))
      .mockResolvedValueOnce(Response.json({ data: [{ id: "exam-100" }], nextCursor: null }))
    const result = await loadProctorSessionList<{ id: string }>(fetcher)
    expect(result).toHaveLength(101)
    expect(fetcher).toHaveBeenNthCalledWith(2, "/api/proctor/sessions?pagination=true&cursor=exam-99", { cache: "no-store" })
  })

  it("rejects failed page loads instead of presenting incomplete history", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({}, { status: 500 }))
    await expect(loadProctorSessionList(fetcher)).rejects.toThrow("Unable to load exam sessions")
  })

  it("stops if a cursor repeats rather than entering an endless loading loop", async () => {
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(Response.json({ data: [], nextCursor: "same" })))
    await expect(loadProctorSessionList(fetcher)).rejects.toThrow("pagination could not advance")
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})
