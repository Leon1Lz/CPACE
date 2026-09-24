"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Critical root application error:", error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: "1rem",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#090d16",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          color: "#f8fafc",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            width: "100%",
            textAlign: "center",
            padding: "2.5rem 2rem",
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            borderRadius: "1.5rem",
            border: "1px solid #1e293b",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div
            style={{
              width: "4rem",
              height: "4rem",
              margin: "0 auto 1.5rem",
              borderRadius: "1rem",
              background: "linear-gradient(135deg, #e11d48, #be123c)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.75rem",
            }}
          >
            ⚠️
          </div>

          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              margin: "0 0 0.75rem",
              letterSpacing: "-0.025em",
            }}
          >
            Application Error
          </h1>

          <p
            style={{
              fontSize: "0.875rem",
              color: "#94a3b8",
              lineHeight: 1.6,
              margin: "0 0 1.5rem",
            }}
          >
            A critical system error occurred while loading the application. Please try reloading the page.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => reset()}
              type="button"
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "0.75rem",
                background: "linear-gradient(to right, #059669, #0d9488)",
                color: "#ffffff",
                border: "none",
                fontWeight: 700,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>

            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/"
                }
              }}
              type="button"
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "0.75rem",
                backgroundColor: "transparent",
                color: "#cbd5e1",
                border: "1px solid #334155",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Go to Home
            </button>
          </div>

          {error.digest && (
            <p
              style={{
                fontSize: "0.7rem",
                color: "#64748b",
                fontFamily: "monospace",
                marginTop: "1.5rem",
                marginBottom: 0,
              }}
            >
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
