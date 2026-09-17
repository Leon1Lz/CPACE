import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['ADMIN', 'INSTRUCTOR', 'LEARNER', 'PROCTOR']).default('LEARNER'),
})

describe('Registration & Auth Input Validation', () => {
  it('accepts valid registration input', () => {
    const input = {
      email: 'learner@cpace.ph',
      password: 'password123',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      role: 'LEARNER',
    }

    const result = registerSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('learner@cpace.ph')
      expect(result.data.role).toBe('LEARNER')
    }
  })

  it('rejects invalid email addresses', () => {
    const input = {
      email: 'not-an-email',
      password: 'password123',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
    }

    const result = registerSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects passwords shorter than 8 characters', () => {
    const input = {
      email: 'test@cpace.ph',
      password: '123',
      firstName: 'Test',
      lastName: 'User',
    }

    const result = registerSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('defaults role to LEARNER when not provided', () => {
    const input = {
      email: 'newuser@cpace.ph',
      password: 'securepassword',
      firstName: 'Maria',
      lastName: 'Clara',
    }

    const result = registerSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.role).toBe('LEARNER')
    }
  })
})
