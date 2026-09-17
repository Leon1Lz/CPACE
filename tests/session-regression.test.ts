import { beforeEach, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ user: vi.fn() }))
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: mocks.user } } }))
import { authOptions } from "@/lib/auth"
beforeEach(() => { mocks.user.mockReset() })
const jwt = authOptions.callbacks!.jwt!
const input = () => ({ token: { userId: "user", sessionToken: "current", role: "LEARNER" } } as unknown as Parameters<typeof jwt>[0])
it.each([[null, "UserSuspended"], [{ isActive: false }, "UserSuspended"], [{ isActive: true, activeSessionToken: "replaced" }, "SessionExpired"]])("invalidates missing, suspended, and replaced sessions", async (user, error) => {
  mocks.user.mockResolvedValue(user)
  expect((await jwt(input())).error).toBe(error)
})
it("keeps an active verified session intact", async () => {
  mocks.user.mockResolvedValue({ isActive: true, activeSessionToken: "current", email: "current@example.com", firstName: "Current", lastName: "User", role: "LEARNER" })
  expect((await jwt(input())).error).toBeUndefined()
})

it("refreshes stale email, name, and role from the original ID-verified account", async () => {
  mocks.user.mockResolvedValue({ isActive: true, activeSessionToken: "current", email: "new@example.com", firstName: "New", lastName: "Name", role: "LEARNER" })
  const token = await jwt({ token: { userId: "user", sessionToken: "current", email: "reassigned@example.com", name: "Old Name", role: "ADMIN" } } as unknown as Parameters<typeof jwt>[0])
  expect(token).toMatchObject({ userId: "user", email: "new@example.com", name: "New Name", role: "LEARNER" })
  expect(mocks.user.mock.calls[0][0].where).toEqual({ id: "user" })
  const callback = authOptions.callbacks!.session!
  const session = await callback({ session: { user: { email: "reassigned@example.com" } }, token } as unknown as Parameters<typeof callback>[0])
  expect(session?.user).toMatchObject({ id: "user", email: "new@example.com", name: "New Name", role: "LEARNER" })
})

it.each([undefined, "", 123])("fails closed when immutable identity is missing or malformed: %s", async userId => {
  const token = await jwt({ token: { userId, email: "known@example.com" } } as unknown as Parameters<typeof jwt>[0])
  expect(token.error).toBe("SessionVerificationFailed")
  expect(mocks.user).not.toHaveBeenCalled()
})
it("fails closed when session verification cannot reach the database", async () => {
  mocks.user.mockRejectedValue(new Error("Simulated database failure"))
  const silence = vi.spyOn(console, "error").mockImplementation(() => undefined)
  try { expect((await jwt(input())).error).toBe("SessionVerificationFailed") }
  finally { silence.mockRestore() }
})
