import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { useLanguage } from '../../contexts/LanguageContext';
import { clearError, setAuth } from '../../store/authSlice';
import { authApi } from '../../api/auth';
import { getRole } from '../../utils/auth';
import { notificationsApi } from '../../api/notifications';
import { SAVED_LOGIN_EMAIL_KEY } from '../../utils/jwt';

const HARDCODED_OTP_PASS = '123456';

function getRoleRedirect(role: string): string {
  switch (role) {
    case 'customer':
      return '/customer';
    case 'doctor':
      return '/doctor';
    default:
      return '/admin';
  }
}

type AuthPayload = { user: unknown; accessToken: string; refreshToken: string };

function parseLoginPayload(data: unknown): AuthPayload | null {
  const raw = (data as { data?: AuthPayload })?.data ?? data as AuthPayload;
  if (raw && typeof raw === 'object' && raw.user != null && raw.accessToken) {
    return raw as AuthPayload;
  }
  return null;
}

export default function Login() {
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem(SAVED_LOGIN_EMAIL_KEY) || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [pendingAuth, setPendingAuth] = useState<AuthPayload | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, accessToken } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (user && accessToken && !showOtpStep) {
      navigate(getRoleRedirect(getRole(user)), { replace: true });
    }
  }, [user, accessToken, navigate, showOtpStep]);

  if (user && accessToken && !showOtpStep) {
    return <Navigate to={getRoleRedirect(getRole(user))} replace />;
  }

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const completeLogin = (authPayload: AuthPayload) => {
    try {
      if (rememberMe && email) {
        localStorage.setItem(SAVED_LOGIN_EMAIL_KEY, email);
      } else {
        localStorage.removeItem(SAVED_LOGIN_EMAIL_KEY);
      }
    } catch {
      /* ignore */
    }
    notificationsApi.create({
      type: 'system',
      title: 'Login successful',
      body: 'You have signed in successfully.',
    }).catch(() => { });
    const u = authPayload.user as { role?: string | { name?: string } };
    const role = typeof u.role === 'string' ? u.role : (u.role as { name?: string })?.name ?? 'customer';
    navigate(getRoleRedirect(role), { replace: true });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setOtpError(null);
    setLoginLoading(true);
    try {
      const { data } = await authApi.login({ email, password });
      const payload = parseLoginPayload(data);
      if (!payload) {
        setLoginError(t('auth.invalidVerificationCode') || 'Invalid response');
        return;
      }
      const role = getRole(payload.user as Parameters<typeof getRole>[0]);
      if (role === 'admin' || role === 'superadmin') {
        setPendingAuth(payload);
        setShowOtpStep(true);
        return;
      }
      dispatch(setAuth(payload as { user: import('../../types').User; accessToken: string; refreshToken: string }));
      completeLogin(payload);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setLoginError(msg || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleOtpSubmit = (e: FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    if (!pendingAuth) return;
    if (otpCode.trim() !== HARDCODED_OTP_PASS) {
      setOtpError(t('auth.invalidVerificationCode'));
      return;
    }
    dispatch(setAuth(pendingAuth as { user: import('../../types').User; accessToken: string; refreshToken: string }));
    setPendingAuth(null);
    setShowOtpStep(false);
    setOtpCode('');
    completeLogin(pendingAuth);
  };

  if (showOtpStep) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-6 sm:py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 text-blue-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">{t('auth.verifyLoginCodeTitle')}</h1>
              <p className="text-gray-500 mt-2 text-sm">{t('auth.enterVerificationCode')}</p>
            </div>
            {otpError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2" role="alert">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                <span>{otpError}</span>
              </div>
            )}
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div>
                <label htmlFor="otp-code" className="block text-sm font-medium text-gray-800 mb-1">
                  {t('auth.verificationCode')}
                </label>
                <input
                  id="otp-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="123456"
                  className="w-full rounded-lg border border-gray-300 pl-4 pr-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition text-center font-mono text-lg tracking-widest"
                />
              </div>
              <button
                type="submit"
                disabled={!otpCode.trim()}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed interactive-btn"
              >
                {t('auth.confirm')}
              </button>
              <button
                type="button"
                onClick={() => { setShowOtpStep(false); setPendingAuth(null); setOtpCode(''); setOtpError(null); }}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-700 font-medium hover:bg-gray-50"
              >
                {t('common.back')}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-6 sm:py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500 text-white mb-4">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{t('auth.loginAppName')}</h1>
            <p className="text-gray-500 mt-2 text-sm">{t('auth.welcomeBack')}</p>
          </div>

          {loginError && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2" role="alert">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-1">
                {t('auth.emailAddress')}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.enterEmail')}
                  className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-800 mb-1">
                {t('auth.password')}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.enterPassword')}
                  className="w-full rounded-lg border border-gray-300 pl-10 pr-11 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{t('auth.rememberMe')}</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed interactive-btn"
            >
              {loginLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('auth.signingIn')}
                </span>
              ) : (
                t('common.signIn')
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
              {t('common.signUp')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
