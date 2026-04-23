import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAppDispatch, useAppSelector } from '../../../hooks/useAppDispatch';
import { logout } from '../../../store/authSlice';

export default function DoctorPendingApproval() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email ?? '—';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="flex items-center justify-center px-4 h-14 border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-900">{t('auth.signupSuccessTitle')}</h1>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-8 max-w-md mx-auto text-center">
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-amber-600 mb-2">{t('auth.signupSuccess')}</h2>
        <p className="text-gray-700 text-sm mb-1">{t('auth.accountPendingReview')}</p>
        <p className="text-gray-500 text-sm mb-4">{t('auth.reviewTime')}</p>

        <div className="w-full rounded-xl bg-sky-50 border border-sky-100 px-4 py-3 mb-8 text-sky-700 text-sm">
          {t('auth.weWillNotify')}
        </div>

        <div className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-4 text-left mb-8">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">{t('auth.doctorInfo')}</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{t('auth.name')}:</span>
              <span className="font-medium text-gray-900">{displayName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('auth.hospital')}:</span>
              <span className="font-medium text-gray-900">—</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('auth.departmentRequired')}:</span>
              <span className="font-medium text-gray-900">—</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">{t('auth.status')}:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {t('auth.pendingReview')}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/doctor', { replace: true })}
          className="w-full py-3.5 rounded-xl bg-gray-700 text-white font-bold uppercase tracking-wide interactive-btn mb-4"
        >
          {t('auth.goToHome')}
        </button>
        <button
          type="button"
          onClick={() => dispatch(logout())}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          {t('common.logout')}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </main>
    </div>
  );
}
