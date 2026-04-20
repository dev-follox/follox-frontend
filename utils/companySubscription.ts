import type { Company } from '../types';

/**
 * Company is allowed full write access when:
 * - `subscription_expires_at` is null/undefined (trial / not configured yet), or
 * - it is a datetime strictly in the future.
 * Past expiry ⇒ inactive (read-only UX, hidden from designer catalog — list is API-driven).
 */
export function isCompanySubscriptionActive(company: Company | null | undefined): boolean {
  if (!company) return false;
  const expires = company.subscription_expires_at;
  if (expires == null || expires === '') return true;
  return new Date(expires) > new Date();
}
