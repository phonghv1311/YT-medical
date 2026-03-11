export { en } from './en';
export { vn } from './vn';
export type { LocaleKeys } from './en';

export type LocaleCode = 'en' | 'vn';

const STORAGE_KEY = 'app_lang';

export function getStoredLocale(): LocaleCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'vn') return stored;
  } catch {
    /* ignore */
  }
  return 'en';
}

export function setStoredLocale(code: LocaleCode): void {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* ignore */
  }
}

export function getLocaleFromSearchParams(searchParams: URLSearchParams): LocaleCode | null {
  const lang = searchParams.get('lang');
  if (lang === 'en' || lang === 'vn') return lang;
  return null;
}
