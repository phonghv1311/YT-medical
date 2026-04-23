import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { useLanguage } from '../../contexts/LanguageContext';
import { getRole } from '../../utils/auth';
import { register, clearError } from '../../store/authSlice';
import { notificationsApi } from '../../api/notifications';

const ID_LENGTH = 12;

export default function RegisterCustomer() {
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [idCard, setIdCard] = useState('');
  const [healthInsurance, setHealthInsurance] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, loading, error, accessToken } = useAppSelector((s) => s.auth);

  const idCardValid = !idCard || idCard.replace(/\D/g, '').length === ID_LENGTH;
  const idCardError = idCard && !idCardValid;

  if (accessToken && user && getRole(user) !== 'customer') {
    return <Navigate to="/home" replace />;
  }

  useEffect(() => {
    if (user && accessToken && getRole(user) === 'customer') {
      navigate('/register/customer/success', { replace: true });
    }
  }, [user, accessToken, navigate]);

  useEffect(() => {
    return () => { dispatch(clearError()); };
  }, [dispatch]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword || !idCardValid) return;
    const [firstName, ...lastParts] = fullName.trim().split(/\s+/);
    const lastName = lastParts.join(' ') || firstName;
    const result = await dispatch(register({
      firstName: firstName || fullName,
      lastName,
      email,
      password,
      phone: phone || undefined,
      role: 'customer',
    }));
    if (register.fulfilled.match(result)) {
      try {
        await notificationsApi.create({
          type: 'system',
          title: 'Registration successful',
          body: 'Your account has been created successfully. Welcome!',
        });
      } catch {
        /* ignore */
      }
      navigate('/register/customer/success', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center gap-4 px-4 h-14 border-b border-gray-100">
        <Link to="/register" className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold text-gray-900 pr-10">{t('auth.patientInfoTitle')}</h1>
      </header>

      <main className="px-4 max-w-md mx-auto py-6 pb-24">
        <p className="text-sm text-gray-600 mb-1">{t('auth.step1PersonalInfo')}</p>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1">
          <div className="h-full w-1/3 bg-blue-600 rounded-full" />
        </div>
        <p className="text-sm text-gray-500 mb-6">1/3</p>

        <div className="flex flex-col items-center mb-6">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="relative w-24 h-24 rounded-full bg-amber-100 border-2 border-white shadow-inner overflow-hidden"
          >
            {avatarFile ? (
              <img src={URL.createObjectURL(avatarFile)} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-amber-600">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
            </span>
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
          />
          <p className="text-sm font-medium text-gray-700 mt-2">{t('auth.profilePicture')}</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">{t('auth.fullName')} *</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('auth.enterFullName')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">{t('auth.dateOfBirth')} *</label>
            <div className="relative">
              <input
                type="text"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                placeholder={t('auth.datePlaceholder')}
                className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">{t('auth.gender')} *</label>
            <div className="relative">
              <select
                required
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
              >
                <option value="">{t('auth.selectGender')}</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">{t('auth.phone')} *</label>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden">
              <span className="flex items-center px-3 bg-gray-50 text-gray-600 text-sm border-r border-gray-200">+84</span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('auth.enterPhone')}
                className="flex-1 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">{t('auth.idCard')} *</label>
            <input
              required
              value={idCard}
              onChange={(e) => setIdCard(e.target.value.replace(/\D/g, '').slice(0, ID_LENGTH))}
              placeholder={t('auth.enter12Digits')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {idCardError && <p className="text-red-500 text-xs mt-1">{t('auth.idMustBe12Digits')}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">{t('auth.healthInsuranceOptional')}</label>
            <input
              value={healthInsurance}
              onChange={(e) => setHealthInsurance(e.target.value)}
              placeholder={t('auth.healthInsurancePlaceholder')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">{t('common.address')} *</label>
            <textarea
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t('auth.permanentAddress')}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">{t('auth.emailAddress')} *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.enterEmail')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">{t('auth.password')} *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.enterPassword')}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <span className="text-xs">Hide</span> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">{t('auth.confirmPassword')} *</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('auth.reEnterNewPasswordPlaceholder')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {confirmPassword && password !== confirmPassword && <p className="text-red-500 text-xs mt-1">{t('auth.passwordsDoNotMatch')}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || !idCardValid || (!!confirmPassword && password !== confirmPassword)}
            className="w-full py-3.5 rounded-xl bg-blue-500 text-white font-semibold disabled:opacity-50 interactive-btn"
          >
            {loading ? t('auth.creatingAccount') : t('auth.continue')}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">{t('auth.fillRequiredFields')}</p>
      </main>
    </div>
  );
}
