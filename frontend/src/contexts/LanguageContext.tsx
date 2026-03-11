import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { en } from '../constants/locales/en';
import { vn } from '../constants/locales/vn';
import {
  type LocaleCode,
  getLocaleFromSearchParams,
  getStoredLocale,
  setStoredLocale,
} from '../constants/locales';

const messages: Record<LocaleCode, Record<string, unknown>> = {
  en: en as Record<string, unknown>,
  vn: vn as Record<string, unknown>,
};

type TKey = string;

const getNested = (obj: Record<string, unknown>, path: string): string | undefined => {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' ? current : undefined;
};

function resolveInitialLocale(searchParams: URLSearchParams): LocaleCode {
  const urlLang = getLocaleFromSearchParams(searchParams);
  if (urlLang) return urlLang;
  return getStoredLocale();
}

type LanguageContextValue = {
  locale: LocaleCode;
  setLocale: (code: LocaleCode) => void;
  t: (key: TKey, params?: Record<string, string>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [locale, setLocaleState] = useState<LocaleCode>(() => resolveInitialLocale(searchParams));

  useEffect(() => {
    const urlLang = getLocaleFromSearchParams(searchParams);
    if (urlLang != null && urlLang !== locale) {
      setLocaleState(urlLang);
      setStoredLocale(urlLang);
    }
  }, [searchParams]);

  const setLocale = useCallback(
    (code: LocaleCode) => {
      setLocaleState(code);
      setStoredLocale(code);
      const next = new URLSearchParams(searchParams);
      next.set('lang', code);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const t = useCallback(
    (key: TKey, params?: Record<string, string>): string => {
      const dict = messages[locale] ?? (en as Record<string, unknown>);
      const value = getNested(dict, key);
      let out = (typeof value === 'string' ? value : key) as string;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          out = out.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v ?? '');
        }
      }
      return out;
    },
    [locale],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
