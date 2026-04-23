import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

export default function RegisterCustomerSuccess() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="flex items-center px-4 h-14 border-b border-gray-100">
        <Link to="/customer" className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold text-gray-900 pr-10">{t('auth.successTitle')}</h1>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-8 max-w-md mx-auto text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('auth.registrationSuccess')}</h2>
        <p className="text-gray-500 text-sm mb-8">{t('auth.welcomeToApp')}</p>

        <div className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-4 text-left mb-8">
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm mb-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
            {t('auth.giftTitle')}
          </div>
          <p className="font-bold text-gray-900">{t('auth.giftSubtitle')}</p>
          <p className="text-sm text-gray-500 mt-0.5">{t('auth.giftDetail')}</p>
        </div>

        <Link
          to="/customer"
          className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 interactive-btn"
        >
          {t('auth.startUsing')}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
        <Link to="/customer" className="mt-4 text-sm text-gray-500 hover:text-gray-700">
          {t('auth.viewUserGuide')}
        </Link>
      </main>
    </div>
  );
}
