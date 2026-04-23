import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { authApi } from '../api';

export default function ChangePassword() {
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }
    if (newPassword.length < 8) {
      setError(t('settings.min8Chars'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
      });
      toast.success(t('settings.changePasswordSuccess'));
      navigate('/profile', { replace: true });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? t('settings.currentPasswordIncorrect'));
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ show, onClick }: { show: boolean; onClick: () => void }) => (
    <button type="button" onClick={onClick} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
      {show ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center gap-4 px-4 h-14 border-b border-gray-100">
        <Link to="/profile" className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-900">{t('settings.changePassword')}</h1>
      </header>

      <main className="px-4 max-w-md mx-auto py-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">{t('settings.currentPassword')}</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('settings.enterCurrentPassword')}
                className="w-full rounded-xl border border-gray-300 pl-4 pr-11 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-gray-50"
                autoComplete="current-password"
              />
              <EyeIcon show={showCurrent} onClick={() => setShowCurrent((s) => !s)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">{t('settings.newPassword')}</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('settings.enterNewPassword')}
                className="w-full rounded-xl border border-gray-300 pl-4 pr-11 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-gray-50"
                autoComplete="new-password"
              />
              <EyeIcon show={showNew} onClick={() => setShowNew((s) => !s)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">{t('settings.confirmNewPassword')}</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('settings.reEnterNewPassword')}
                className="w-full rounded-xl border border-gray-300 pl-4 pr-11 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-gray-50"
                autoComplete="new-password"
              />
              <EyeIcon show={showConfirm} onClick={() => setShowConfirm((s) => !s)} />
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('settings.securityRequirements')}</p>
            <ul className="space-y-1.5 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                  {newPassword.length >= 8 && <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                </span>
                {t('settings.min8Chars')}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                  {/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) && <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                </span>
                {t('settings.atLeastOneUpper')}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                  {/\d/.test(newPassword) && <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                </span>
                {t('settings.atLeastOneDigit')}
              </li>
            </ul>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('settings.updatePassword')}
          </button>
        </form>

        <p className="mt-6 text-center">
          <Link to="/profile" className="text-sm text-gray-500 hover:text-gray-700">
            {t('settings.cancelAction')}
          </Link>
        </p>
      </main>
    </div>
  );
}
