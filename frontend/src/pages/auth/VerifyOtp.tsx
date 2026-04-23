import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

const OTP_LENGTH = 6;

export default function VerifyOtp() {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [rememberDevice, setRememberDevice] = useState(true);
  const [countdown, setCountdown] = useState(60);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const phone = (location.state as { phone?: string })?.phone ?? '+84 xxx xxxx';

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const next = [...otp];
      digits.forEach((d, i) => {
        if (index + i < OTP_LENGTH) next[index + i] = d;
      });
      setOtp(next);
      const nextFocus = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputRefs.current[nextFocus]?.focus();
      return;
    }
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) return;
    setLoading(true);
    // TODO: verify OTP with backend
    setTimeout(() => {
      setLoading(false);
      navigate('/forgot-password/reset', { state: { phone } });
    }, 500);
  };

  const canResend = countdown <= 0;

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center gap-4 px-4 h-14 border-b border-gray-100">
        <Link to="/forgot-password" className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="flex-1 text-center text-sm font-bold text-gray-900 uppercase tracking-wide pr-10">
          {t('auth.verifyOtp')}
        </h1>
      </header>

      <main className="px-4 max-w-md mx-auto py-8 text-center">
        <div className="w-16 h-16 rounded-full bg-sky-100 border border-sky-200 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('auth.enter6Digits')}</h2>
        <p className="text-sm text-gray-600 mb-6">
          {t('auth.codeSentTo')} {phone}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={OTP_LENGTH}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-11 h-12 text-center text-lg font-semibold rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              />
            ))}
          </div>

          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-gray-500">{t('auth.codeExpiresIn')}</span>
            <span className="text-sm font-mono font-semibold text-blue-600">
              {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
            </span>
          </div>

          <label className="flex items-center justify-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{t('auth.rememberDevice')}</span>
          </label>

          <button
            type="submit"
            disabled={loading || otp.join('').length !== OTP_LENGTH}
            className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50 interactive-btn"
          >
            {loading ? t('common.loading') : t('auth.confirm')}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-500">
          {t('auth.resendCode')}{' '}
          {canResend ? (
            <button
              type="button"
              onClick={() => setCountdown(60)}
              className="text-blue-600 font-medium hover:underline"
            >
              {t('auth.resendCode')}
            </button>
          ) : (
            <span className="text-gray-400">{t('auth.resendCodeAfter')}</span>
          )}
        </p>

        <p className="mt-8 text-xs text-gray-400">{t('auth.agreeTermsOnConfirm')}</p>
      </main>
    </div>
  );
}
