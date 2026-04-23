import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { getRole } from '../../utils/auth';

function getRoleRedirect(role: string): string {
  switch (role) {
    case 'customer': return '/customer';
    case 'doctor': return '/doctor';
    default: return '/admin';
  }
}

type Role = 'customer' | 'doctor';

export default function Register() {
  const [role, setRole] = useState<Role>('doctor');
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, accessToken } = useAppSelector((s) => s.auth);

  if (accessToken && user) {
    return <Navigate to={getRoleRedirect(getRole(user))} replace />;
  }

  const handleContinue = () => {
    if (role === 'customer') {
      navigate('/register/customer');
    } else {
      navigate('/register/doctor/create');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center gap-4 px-4 h-14 border-b border-gray-100">
        <Link to="/" className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold text-gray-900 truncate pr-10">{t('auth.signUpTitle')}</h1>
      </header>

      <main className="px-4 sm:px-6 pt-8 pb-12 max-w-md mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-2">
          {t('auth.selectRoleToContinue')}
        </h2>
        <p className="text-sm text-gray-500 text-center mb-8">
          {t('auth.selectAccountType')}
        </p>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setRole('doctor')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition ${role === 'doctor'
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-sky-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-gray-900">{t('auth.doctorCardTitle')}</p>
              <p className="text-sm text-gray-500 mt-0.5">{t('auth.doctorCardDesc')}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setRole('customer')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition ${role === 'customer'
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-gray-900">{t('auth.patientCardTitle')}</p>
              <p className="text-sm text-gray-500 mt-0.5">{t('auth.patientCardDesc')}</p>
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={handleContinue}
          className="w-full mt-8 py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition interactive-btn"
        >
          {t('auth.continue')}
        </button>

        <p className="mt-6 text-center text-sm text-gray-500">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">
            {t('auth.loginLink')}
          </Link>
        </p>
      </main>
    </div>
  );
}
