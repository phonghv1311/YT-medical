import type { User } from '../types';

/**
 * Returns the role as a string. Handles backend returning role as { name: string } or string.
 */
export function getRole(user: User | null | undefined): string {
  if (!user) return 'customer';
  const r = (user as User & { role?: string | { name?: string } }).role;
  if (typeof r === 'string') return r;
  if (r != null && typeof r === 'object' && typeof (r as { name?: string }).name === 'string') {
    return (r as { name: string }).name;
  }
  return 'customer';
}
