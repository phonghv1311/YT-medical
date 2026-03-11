import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { LocaleCode } from '../constants/locales';

const LOCALE_CONFIG: Record<LocaleCode, { flag: string; label: string }> = {
  en: { flag: '🇺🇸', label: 'English' },
  vn: { flag: '🇻🇳', label: 'Tiếng Việt' },
};

interface Props {
  className?: string;
  /** When true, only the flag icon is shown in the trigger (for header use). */
  iconOnly?: boolean;
}

export default function LanguageSwitcher({ className = '', iconOnly = false }: Props) {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const current = LOCALE_CONFIG[locale];

  const handleSelect = (code: LocaleCode) => {
    setLocale(code);
    setOpen(false);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select language"
        className={`inline-flex items-center gap-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 cursor-pointer ${iconOnly ? 'p-2 min-w-0' : 'px-3 py-2 min-w-[7rem] justify-between'}`}
      >
        <span className="flex items-center gap-2">
          <span className="text-xl leading-none select-none" aria-hidden>
            {current.flag}
          </span>
          {!iconOnly && <span>{current.label}</span>}
        </span>
        {!iconOnly && (
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Language options"
          className="absolute top-full left-0 right-0 mt-1 py-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[7rem]"
        >
          {(Object.keys(LOCALE_CONFIG) as LocaleCode[]).map((code) => {
            const { flag, label } = LOCALE_CONFIG[code];
            const isSelected = locale === code;
            return (
              <li key={code} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => handleSelect(code)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors cursor-pointer ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <span className="text-xl leading-none select-none">{flag}</span>
                  <span>{label}</span>
                  {isSelected && (
                    <span className="ml-auto text-blue-600" aria-hidden>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
