export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  checks: {
    hasMinLength: boolean
    hasUpperCase: boolean
    hasLowerCase: boolean
    hasNumber: boolean
    hasSpecialChar: boolean
  }
}

export function validatePassword(password: string): PasswordValidationResult {
  const str = typeof password === "string" ? password : ""
  const hasMinLength = str.length >= PASSWORD_MIN_LENGTH && str.length <= PASSWORD_MAX_LENGTH
  const hasUpperCase = /[A-Z]/.test(str)
  const hasLowerCase = /[a-z]/.test(str)
  const hasNumber = /[0-9]/.test(str)
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(str)

  const errors: string[] = []
  if (!hasMinLength) {
    errors.push(`Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`)
  }
  if (!hasUpperCase) {
    errors.push("Password must contain at least one uppercase letter (A-Z).")
  }
  if (!hasLowerCase) {
    errors.push("Password must contain at least one lowercase letter (a-z).")
  }
  if (!hasNumber) {
    errors.push("Password must contain at least one number (0-9).")
  }
  if (!hasSpecialChar) {
    errors.push("Password must contain at least one special character (!@#$%...).")
  }

  return {
    isValid: errors.length === 0,
    errors,
    checks: {
      hasMinLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
    },
  }
}

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]).{8,128}$/
export const PASSWORD_COMPLEXITY_MESSAGE =
  "Password must be at least 8 characters long and include a mix of uppercase, lowercase, numbers, and special characters (!@#$%)."
