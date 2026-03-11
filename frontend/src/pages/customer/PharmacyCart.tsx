import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

export default function PharmacyCart() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center justify-between h-14 px-4 safe-area-pt">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full interactive-btn hover:bg-gray-100"
          aria-label={t('common.back')}
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">{t('pharmacy.cart')}</h1>
        <div className="w-10" />
      </header>
      <div className="p-4 max-w-lg mx-auto">
        <div className="rounded-2xl bg-white border border-gray-100 p-8 text-center interactive-card">
          <p className="text-gray-500">{t('pharmacy.cartEmpty')}</p>
          <Link to="/customer/pharmacy" className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-sky-500 text-white font-semibold interactive-btn">
            {t('pharmacy.shopNow')}
          </Link>
        </div>
      </div>
    </div>
  );
}
