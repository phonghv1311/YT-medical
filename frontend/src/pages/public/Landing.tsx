import { Link, useLocation, Navigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { useAppSelector } from '../../hooks/useAppDispatch';

export default function Landing() {
  const { t } = useLanguage();
  const location = useLocation();
  const message = (location.state as { message?: string } | null)?.message;
  const { user, accessToken } = useAppSelector((s) => s.auth);

  if (accessToken && user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {message && (
        <div className="mx-4 mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.485 2.495c.032-.037.069-.074.11-.108A2.25 2.25 0 0111.21 2h.585a2.25 2.25 0 012.258 2.25 2.25 2.25 0 01-.123.32c-.086.2-.196.406-.322.617A14.93 14.93 0 0112 6.5c-.416.657-.784 1.314-1.09 1.943a14.023 14.023 0 01-.383.67 2.25 2.25 0 01-.658.506 2.25 2.25 0 01-.657.506 2.25 2.25 0 01-.657-.506 14.023 14.023 0 01-.383-.67c-.307-.629-.674-1.286-1.09-1.943a14.93 14.93 0 01-.322-.617 2.25 2.25 0 01-.123-.32A2.25 2.25 0 016.205 2h.585a2.25 2.25 0 011.617.607c.04.034.078.071.11.108l.002.001.006.005.022.016a13.151 13.151 0 00.636.445c.395.26.944.582 1.534.943 1.18.721 2.535 1.508 3.09 2.5.555-.992 1.91-1.779 3.09-2.5.59-.36 1.14-.682 1.534-.943a13.151 13.151 0 00.636-.445l.022-.016.006-.005.002-.001zM12 14.5a2.25 2.25 0 10-4.5 0 2.25 2.25 0 004.5 0z" clipRule="evenodd" />
          </svg>
          {message}
        </div>
      )}
      <header className="px-4 pt-6 sm:pt-8 pb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <svg className="w-4 h-4 text-blue-600 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-gray-900 truncate">{t('common.appName')}</span>
        </div>
        <LanguageSwitcher className="shrink-0" />
      </header>

      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 pt-4 sm:pt-6 pb-8">
        <div className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-sky-50 to-blue-50/50 p-6 sm:p-8 flex justify-center">
          <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-blue-100/80 flex items-center justify-center">
            <svg className="w-20 h-20 sm:w-24 sm:h-24 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mt-6 sm:mt-8 leading-tight px-2">
          {t('landing.headline')}
        </h1>
        <p className="text-gray-500 text-center mt-3 text-sm sm:text-base max-w-sm leading-relaxed px-2">
          {t('landing.description')}
        </p>

        <div className="w-full max-w-sm mt-8 sm:mt-10 space-y-3 px-4">
          <Link
            to="/login"
            className="block w-full py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-center transition"
          >
            {t('landing.login')}
          </Link>
          <Link
            to="/register"
            className="block w-full py-3.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-cyan-600 font-bold text-center border border-sky-100 transition"
          >
            {t('landing.register')}
          </Link>
        </div>
      </main>

      <footer className="px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500 border-t border-gray-100">
        <Link to="/help" className="flex items-center gap-2 hover:text-gray-700">
          <span className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-xs">?</span>
          {t('common.helpCenter')}
        </Link>
        <span className="text-gray-400">{t('landing.language')}</span>
      </footer>
    </div>
  );
}
