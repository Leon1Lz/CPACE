/** Require an explicit delivery acknowledgement before clearing a public form. */
export async function submitPublicForm(url: string, payload: unknown): Promise<void> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const result: unknown = await response.json().catch(() => null)
  const data = result && typeof result === "object"
    ? result as Record<string, unknown>
    : null

  if (!response.ok || data?.success !== true || data?.mock === true) {
    throw new Error(
      typeof data?.error === "string"
        ? data.error
        : "Your submission could not be confirmed. Please try again or email info@cpaceph.com.",
    )
  }
}
