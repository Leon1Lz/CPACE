// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest"
import { execFileSync } from "node:child_process"
import { pathToFileURL } from "node:url"
import path from "node:path"
import { normalizeAuthUrls } from "@/lib/auth-url.mjs"
import { register } from "@/instrumentation"

afterEach(() => vi.unstubAllEnvs())

describe("authentication URL initialization", () => {
  it("prefers the canonical production hostname when the auth URL is blank", () => {
    const environment = {
      NEXTAUTH_URL: " ",
      VERCEL_PROJECT_PRODUCTION_URL: "cpace-three.vercel.app",
      VERCEL_URL: "cpace-preview.vercel.app",
    }
    normalizeAuthUrls(environment)
    expect(environment.NEXTAUTH_URL).toBe("https://cpace-three.vercel.app")
  })

  it("preserves configured public and internal auth paths after trimming whitespace", () => {
    const environment = {
      NEXTAUTH_URL: "  https://certifications.cpaceph.com/api/auth/  ",
      NEXTAUTH_URL_INTERNAL: " http://127.0.0.1:3000/api/auth/ ",
    }
    normalizeAuthUrls(environment)
    expect(environment.NEXTAUTH_URL).toBe("https://certifications.cpaceph.com/api/auth")
    expect(environment.NEXTAUTH_URL_INTERNAL).toBe("http://127.0.0.1:3000/api/auth")
  })

  it.each(["", " ", "http://", "javascript:alert(1)"])("removes an invalid internal URL: %j", internalUrl => {
    const environment = { NEXTAUTH_URL: "https://cpace-three.vercel.app", NEXTAUTH_URL_INTERNAL: internalUrl }
    normalizeAuthUrls(environment)
    expect(environment).not.toHaveProperty("NEXTAUTH_URL_INTERNAL")
  })

  it("rejects malformed public URLs and falls back to the deployment hostname", () => {
    const environment = { NEXTAUTH_URL: "http://", VERCEL_URL: "cpace-preview.vercel.app" }
    normalizeAuthUrls(environment)
    expect(environment.NEXTAUTH_URL).toBe("https://cpace-preview.vercel.app")
  })

  it("provides a localhost fallback for development", () => {
    const environment: Record<string, string | undefined> = { NODE_ENV: "development" }
    normalizeAuthUrls(environment)
    expect(environment.NEXTAUTH_URL).toBe("http://localhost:3000")
  })

  it("normalizes runtime environment values in Next's startup hook", () => {
    vi.stubEnv("NEXTAUTH_URL", "")
    vi.stubEnv("NEXTAUTH_URL_INTERNAL", "")
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "cpace-three.vercel.app")
    register()
    expect(process.env.NEXTAUTH_URL).toBe("https://cpace-three.vercel.app")
    expect(process.env.NEXTAUTH_URL_INTERNAL).toBeUndefined()
  })

  it("loads the real NextAuth session module with the production blank-variable regression", () => {
    const helperUrl = pathToFileURL(path.resolve("lib/auth-url.mjs")).href
    const script = `
      import { normalizeAuthUrls } from ${JSON.stringify(helperUrl)};
      normalizeAuthUrls(process.env);
      await import('next-auth/react');
      console.log('Session module initialized');
    `
    const result = execFileSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: process.cwd(),
      encoding: "utf8",
      timeout: 10000,
      env: {
        ...process.env,
        NODE_ENV: "production",
        NEXTAUTH_URL: "",
        NEXTAUTH_URL_INTERNAL: "",
        VERCEL_PROJECT_PRODUCTION_URL: "cpace-three.vercel.app",
      },
    })
    expect(result).toContain("Session module initialized")
  })
})
