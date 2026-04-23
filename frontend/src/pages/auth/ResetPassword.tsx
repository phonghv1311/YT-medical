import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

function validatePassword(p: string): { valid: boolean; hasLength: boolean; hasUpperLower: boolean; hasDigit: boolean } {
  const hasLength = p.length >= 8;
  const hasUpperLower = /[a-z]/.test(p) && /[A-Z]/.test(p);
  const hasDigit = /\d/.test(p);
  return {
    valid: hasLength && hasUpperLower && hasDigit,
    hasLength,
    hasUpperLower,
    hasDigit,
  };
}

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const validation = validatePassword(newPassword);
  const match = !confirmPassword || newPassword === confirmPassword;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validation.valid || !match) return;
    setLoading(true);
    // TODO: call API to reset password when backend supports it
    setTimeout(() => {
      setLoading(false);
      navigate('/login', { replace: true });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center gap-4 px-4 h-14 border-b border-gray-100">
        <Link to="/forgot-password/verify-otp" className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold text-gray-900 pr-10">{t('auth.resetPassword')}</h1>
      </header>

      <main className="px-4 max-w-md mx-auto py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('auth.enterNewPassword')}</h2>
        <p className="text-sm text-gray-500 mb-6">{t('auth.enterNewPasswordDesc')}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-800 mb-1">
              {t('auth.newPassword')}
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('auth.enterNewPasswordPlaceholder')}
                className="w-full rounded-xl border border-gray-300 pl-4 pr-11 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-800 mb-1">
              {t('auth.confirmNewPassword')}
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('auth.reEnterNewPasswordPlaceholder')}
                className="w-full rounded-xl border border-gray-300 pl-4 pr-11 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
            {confirmPassword && !match && <p className="text-red-500 text-xs mt-1">{t('auth.passwordsDoNotMatch')}</p>}
          </div>

          <div className="rounded-xl bg-sky-50 border border-sky-100 px-4 py-3 flex gap-3">
            <span className="text-blue-600 flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900">{t('auth.passwordRequirements')}</p>
              <ul className="mt-1 text-sm text-gray-600 space-y-0.5">
                <li className={validation.hasLength ? 'text-green-600' : ''}>• {t('auth.atLeast8Chars')}</li>
                <li className={validation.hasUpperLower ? 'text-green-600' : ''}>• {t('auth.upperAndLower')}</li>
                <li className={validation.hasDigit ? 'text-green-600' : ''}>• {t('auth.atLeast1Digit')}</li>
              </ul>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !validation.valid || !match}
            className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50 interactive-btn"
          >
            {loading ? t('common.loading') : t('auth.resetPasswordButton')}
          </button>
        </form>
      </main>
    </div>
  );
}
