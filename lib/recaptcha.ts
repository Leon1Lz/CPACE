/**
 * Server-side Google reCAPTCHA v2 verification utility.
 *
 * Validates a reCAPTCHA response token against the Google verification API
 * using the secret key stored in RECAPTCHA_SECRET_KEY.
 *
 * If no secret key is configured the check is silently skipped so that
 * local development is not blocked.
 */

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

interface RecaptchaVerifyResult {
  success: boolean;
  "error-codes"?: string[];
}

/**
 * Verify a reCAPTCHA v2 token server-side.
 *
 * @returns `true` when the token is valid (or when the secret key is not
 *          configured, for development convenience).
 */
export async function verifyRecaptcha(
  token: string | undefined | null,
): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  // Skip verification in development when no secret key is configured.
  if (!secret) return true;
  if (!token) return false;

  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const result: RecaptchaVerifyResult = await response.json();
    return result.success === true;
  } catch (error) {
    console.error("reCAPTCHA verification failed:", error);
    return false;
  }
}
