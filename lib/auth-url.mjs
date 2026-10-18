/**
 * @param {string | undefined} value
 * @param {boolean} [allowHostname]
 * @returns {string | undefined}
 */
function httpUrl(value, allowHostname = false) {
  const trimmed = value?.trim()
  if (!trimmed) return undefined

  try {
    const candidate = allowHostname && !trimmed.includes('://') ? `https://${trimmed}` : trimmed
    const url = new URL(candidate)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined
    return url.href.replace(/\/$/, '')
  } catch {
    return undefined
  }
}

/**
 * NextAuth initializes its React module on the server too, and its URL parser
 * treats an empty environment value as a URL. Run before loading that module.
 * @param {Record<string, string | undefined>} environment
 */
export function normalizeAuthUrls(environment) {
  environment.NEXTAUTH_URL = httpUrl(environment.NEXTAUTH_URL)
    || httpUrl(environment.VERCEL_PROJECT_PRODUCTION_URL, true)
    || httpUrl(environment.VERCEL_URL, true)
    || (environment.NODE_ENV === 'production' ? 'https://cpace-three.vercel.app' : 'http://localhost:3000')

  const internalUrl = httpUrl(environment.NEXTAUTH_URL_INTERNAL)
  if (internalUrl) {
    environment.NEXTAUTH_URL_INTERNAL = internalUrl
  } else {
    delete environment.NEXTAUTH_URL_INTERNAL
  }
}
