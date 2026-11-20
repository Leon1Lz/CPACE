import { describe, it, expect } from "vitest"
import { validatePassword, PASSWORD_COMPLEXITY_MESSAGE } from "@/lib/password-validator"

describe("Password Validator & Complexity", () => {
  it("accepts valid passwords meeting all criteria", () => {
    const result = validatePassword("Cpace@2026!")
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.checks.hasMinLength).toBe(true)
    expect(result.checks.hasUpperCase).toBe(true)
    expect(result.checks.hasLowerCase).toBe(true)
    expect(result.checks.hasNumber).toBe(true)
    expect(result.checks.hasSpecialChar).toBe(true)
  })

  it("rejects passwords shorter than 8 characters", () => {
    const result = validatePassword("Aa1!xyz")
    expect(result.isValid).toBe(false)
    expect(result.checks.hasMinLength).toBe(false)
    expect(result.errors.some(e => e.includes("between 8 and 128"))).toBe(true)
  })

  it("rejects passwords missing uppercase letters", () => {
    const result = validatePassword("cpace@2026!")
    expect(result.isValid).toBe(false)
    expect(result.checks.hasUpperCase).toBe(false)
  })

  it("rejects passwords missing lowercase letters", () => {
    const result = validatePassword("CPACE@2026!")
    expect(result.isValid).toBe(false)
    expect(result.checks.hasLowerCase).toBe(false)
  })

  it("rejects passwords missing numbers", () => {
    const result = validatePassword("Cpace@Password!")
    expect(result.isValid).toBe(false)
    expect(result.checks.hasNumber).toBe(false)
  })

  it("rejects passwords missing special characters", () => {
    const result = validatePassword("Cpace2026NoSym")
    expect(result.isValid).toBe(false)
    expect(result.checks.hasSpecialChar).toBe(false)
  })
})
