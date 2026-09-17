import { describe, it, expect } from 'vitest'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

describe('Rate Limiter (lib/rate-limit.ts)', () => {
  it('allows requests within limit and returns correct remaining counts', () => {
    const key = `test-ip-${Date.now()}`
    const limit = 3
    const windowMs = 60 * 1000

    const res1 = rateLimit(key, limit, windowMs)
    expect(res1.success).toBe(true)
    expect(res1.remaining).toBe(2)
    expect(res1.limit).toBe(3)

    const res2 = rateLimit(key, limit, windowMs)
    expect(res2.success).toBe(true)
    expect(res2.remaining).toBe(1)

    const res3 = rateLimit(key, limit, windowMs)
    expect(res3.success).toBe(true)
    expect(res3.remaining).toBe(0)
  })

  it('blocks requests once the threshold is exceeded', () => {
    const key = `blocked-ip-${Date.now()}`
    const limit = 2
    const windowMs = 60 * 1000

    rateLimit(key, limit, windowMs) // 1st
    rateLimit(key, limit, windowMs) // 2nd

    const resBlocked = rateLimit(key, limit, windowMs) // 3rd (exceeds)
    expect(resBlocked.success).toBe(false)
    expect(resBlocked.remaining).toBe(0)
    expect(resBlocked.reset).toBeGreaterThan(Date.now())
  })

  it('extracts client IP from x-forwarded-for header', () => {
    const mockReqWithForwarded = {
      headers: new Headers({
        'x-forwarded-for': '203.0.113.195, 70.41.3.18',
      }),
    } as unknown as Request

    expect(getClientIp(mockReqWithForwarded)).toBe('203.0.113.195')
  })

  it('falls back to 127.0.0.1 when no forwarded header exists', () => {
    const mockReqLocal = {
      headers: new Headers(),
    } as unknown as Request

    expect(getClientIp(mockReqLocal)).toBe('127.0.0.1')
  })
})
