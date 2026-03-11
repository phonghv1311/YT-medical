/**
 * Decode JWT payload without verification (client-side only for expiry).
 * Do not use for security decisions; backend validates the token.
 */
export function getJwtExpiryMs(token: string | null): number | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const exp = payload.exp;
    if (typeof exp !== 'number') return null;
    return exp * 1000;
  } catch {
    return null;
  }
}

export const SAVED_LOGIN_EMAIL_KEY = 'savedLoginEmail';
export const TOKEN_EXPIRES_AT_KEY = 'tokenExpiresAt';
