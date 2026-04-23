import { useState, type FormEvent } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppSelector } from '../../hooks/useAppDispatch';

export default function ForgotPassword() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, accessToken } = useAppSelector((s) => s.auth);

  if (accessToken && user) {
    return <Navigate to="/home" replace />;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: call API to send OTP to phone when backend supports it
    setTimeout(() => {
      setLoading(false);
      navigate('/forgot-password/verify-otp', { state: { phone: phone || '+84 xxx xxxx' } });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center gap-4 px-4 h-14 border-b border-gray-100">
        <Link to="/login" className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold text-gray-900 pr-10">{t('auth.forgotPasswordTitle')}</h1>
      </header>

      <main className="px-4 max-w-md mx-auto py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('auth.resetPassword')}</h2>
        <p className="text-sm text-gray-500 mb-6">{t('auth.enterPhoneForOtp')}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-800 mb-1">
              {t('auth.phoneNumber')}
            </label>
            <div className="flex rounded-xl border border-gray-300 overflow-hidden bg-white">
              <span className="flex items-center gap-1.5 px-3 bg-gray-50 text-gray-600 text-sm border-r border-gray-200">
                <span className="text-lg">🇻🇳</span> +84
              </span>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="000 000 000"
                className="flex-1 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold uppercase tracking-wide disabled:opacity-50 interactive-btn"
          >
            {loading ? t('common.loading') : t('auth.getOtpCode')}
          </button>
        </form>

        <div className="mt-6 flex justify-center gap-2">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-gray-500 text-sm font-mono">00</span>
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-gray-500 text-sm font-mono">60</span>
        </div>
        <p className="text-center text-sm text-gray-500 mt-2">{t('auth.resendAfterSeconds')}</p>

        <p className="mt-8 text-center text-sm text-gray-500">
          {t('auth.alreadyHaveCodeLogin')}{' '}
          <Link to="/login" className="text-blue-600 font-semibold">{t('auth.loginLink')}</Link>
        </p>
      </main>
    </div>
  );
}
