/**
 * Password rules (aligned with backend):
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */

const MIN_LENGTH = 8;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_LOWERCASE = /[a-z]/;
const HAS_NUMBER = /\d/;
const HAS_SPECIAL = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

export interface PasswordValidationResult {
  valid: boolean;
  message?: string;
}

export type TranslateFn = (key: string) => string;

export function validatePassword(password: string, t: TranslateFn): PasswordValidationResult {
  if (!password || password.length < MIN_LENGTH) {
    return { valid: false, message: t('auth.passwordMinLength') };
  }
  const missing: string[] = [];
  if (!HAS_UPPERCASE.test(password)) missing.push(t('auth.passwordReqUppercase'));
  if (!HAS_LOWERCASE.test(password)) missing.push(t('auth.passwordReqLowercase'));
  if (!HAS_NUMBER.test(password)) missing.push(t('auth.passwordReqNumber'));
  if (!HAS_SPECIAL.test(password)) missing.push(t('auth.passwordReqSpecial'));
  if (missing.length > 0) {
    return {
      valid: false,
      message: t('auth.passwordMustHavePrefix') + missing.join(', '),
    };
  }
  return { valid: true };
}

/** Backend 422 detail item shape */
interface ValidationDetailItem {
  type?: string;
  loc?: (string | number)[];
  msg?: string;
  ctx?: { error?: string };
}

/**
 * Extract password error message from backend 422 response body.
 * Body shape: { detail: [{ type, loc, msg, input, ctx }] }
 */
export function getPasswordErrorFrom422(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const detail = (data as { detail?: ValidationDetailItem[] }).detail;
  if (!Array.isArray(detail)) return null;
  const passwordError = detail.find(
    (d) => Array.isArray(d.loc) && d.loc.includes('body') && d.loc.includes('password')
  );
  if (!passwordError) return null;
  // Prefer ctx.error (clean message), fallback to msg (may include "Value error, " prefix)
  const msg = passwordError.ctx?.error ?? passwordError.msg ?? null;
  if (typeof msg === 'string') {
    return msg.replace(/^Value error,\s*/i, '').trim() || msg;
  }
  return null;
}
