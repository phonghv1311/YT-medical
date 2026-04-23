import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/useAppDispatch';
import { authApi } from '../api';
import { fetchProfile, logout } from '../store/authSlice';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { getRole } from '../utils/auth';
import { ProfileSkeleton } from '../components/skeletons';
import type { User } from '../types';

type RoleType = 'customer' | 'doctor' | 'admin' | 'superadmin' | 'staff';

function getAccentClasses(role: RoleType) {
  if (role === 'doctor') return { bg: 'bg-blue-100', text: 'text-blue-600', ring: 'focus:border-blue-500 focus:ring-blue-500', button: 'bg-blue-600 hover:bg-blue-700' };
  if (role === 'admin' || role === 'superadmin' || role === 'staff') return { bg: 'bg-violet-100', text: 'text-violet-600', ring: 'focus:border-violet-500 focus:ring-violet-500', button: 'bg-violet-600 hover:bg-violet-700' };
  return { bg: 'bg-indigo-100', text: 'text-indigo-600', ring: 'focus:border-indigo-500 focus:ring-indigo-500', button: 'bg-indigo-600 hover:bg-indigo-700' };
}

export default function Profile() {
  const { t } = useLanguage();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const auth = useAppSelector((s) => s.auth);
  const user = auth.user;
  const profileFetched = (auth as { profileFetched?: boolean }).profileFetched;
  const accessToken = auth.accessToken;

  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', address: '' });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [customerView, setCustomerView] = useState<'settings' | 'edit'>('settings');
  const [doctorView, setDoctorView] = useState<'main' | 'profile'>('main');
  const [settingsView, setSettingsView] = useState<'main' | 'profile_edit'>('main');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(() => {
    try {
      return localStorage.getItem('twoFactorEnabled') === 'true';
    } catch {
      return false;
    }
  });
  const setTwoFactorEnabledPersist = (value: boolean) => {
    setTwoFactorEnabled(value);
    try {
      if (value) localStorage.setItem('twoFactorEnabled', 'true');
      else localStorage.removeItem('twoFactorEnabled');
    } catch {
      /* ignore */
    }
  };

  const backIcon = (
    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
  );

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        phone: user.phone ?? '',
        address: (user as User & { address?: string }).address ?? '',
      });
      setAvatar(user.avatar ?? null);
    }
    if (!accessToken || user != null || profileFetched) {
      setLoading(false);
      return;
    }
    dispatch(fetchProfile()).finally(() => setLoading(false));
  }, [user, accessToken, profileFetched, dispatch]);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await authApi.updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        address: form.address?.trim() || undefined,
      });
      dispatch(fetchProfile());
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      /* noop */
    } finally {
      setSaving(false);
    }
  };

  const apiUrl = import.meta.env.VITE_API_URL || '';
  const backendOrigin = apiUrl.startsWith('http') ? apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '') : '';
  const avatarUrl = avatar
    ? avatar.startsWith('http')
      ? avatar
      : backendOrigin
        ? `${backendOrigin}${avatar.startsWith('/') ? avatar : `/${avatar}`}`
        : avatar
    : null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5MB.');
      return;
    }
    setUploadingAvatar(true);
    authApi
      .uploadAvatar(file)
      .then((res) => {
        const url = res.data?.data?.avatar ?? (res.data as { avatar?: string })?.avatar;
        if (url) setAvatar(url);
        dispatch(fetchProfile());
      })
      .catch(() => toast.error('Failed to upload avatar.'))
      .finally(() => {
        setUploadingAvatar(false);
        e.target.value = '';
      });
  };

  const role = getRole(user) as RoleType;
  const isSuperadmin = role === 'superadmin';
  const isDoctor = role === 'doctor';
  const isCustomer = role === 'customer';
  const isAdminRole = role === 'admin' || role === 'superadmin' || role === 'staff';
  const accent = getAccentClasses(role);
  const displayName = isDoctor ? `Dr. ${form.firstName} ${form.lastName}`.trim() || 'Doctor' : `${form.firstName} ${form.lastName}`.trim() || '—';
  const roleLabel = role.replace(/([A-Z])/g, ' $1').trim();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  if (loading) return <ProfileSkeleton />;

  if (isCustomer) {
    if (customerView === 'edit') {
      return (
        <div className="min-h-screen bg-white pb-24">
          <header className="sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center h-14 px-3">
            <button type="button" onClick={() => setCustomerView('settings')} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
              {backIcon}
            </button>
            <h1 className="text-lg font-bold text-gray-900 flex-1 text-center -ml-10">{t('customerSettings.personalProfile')}</h1>
          </header>
          <div className="max-w-lg mx-auto px-3 py-6">
            <div className="flex flex-col items-center mb-6">
              <label className="relative cursor-pointer">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-600 overflow-hidden border-2 border-orange-200">
                  {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : (form.firstName?.[0] ?? '') + (form.lastName?.[0] ?? '') || '?'}
                </div>
                <span className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center border-2 border-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                </span>
                <input type="file" accept="image/*" className="sr-only" disabled={uploadingAvatar} onChange={handleAvatarChange} />
              </label>
              <p className="mt-2 text-sm text-blue-600">{t('settings.changeImage')}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.fullName')}</label>
                <input value={`${form.firstName} ${form.lastName}`.trim()} onChange={(e) => { const p = e.target.value.trim().split(/\s+/); setForm((f) => ({ ...f, firstName: p[0] ?? '', lastName: p.slice(1).join(' ') ?? '' })); }} placeholder="Nguyen Van A" className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.dateOfBirth')}</label>
                <input type="text" value={(user as User & { dateOfBirth?: string })?.dateOfBirth ?? ''} placeholder="15/05/1990" className="w-full rounded-xl border border-gray-200 px-4 py-3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.gender')}</label>
                <input type="text" value={(user as User & { gender?: string })?.gender ?? 'Nam'} readOnly className="w-full rounded-xl border border-gray-200 px-4 py-3 bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.phone')}</label>
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="0901234567" className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.address')}</label>
                <textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="123 Đường ABC, Quận 1, TP. HCM" rows={2} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" />
              </div>
              <button type="button" onClick={handleSave} disabled={saving} className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-60">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                {saving ? t('common.loading') : t('settings.saveChanges')}
              </button>
              {success && <p className="text-sm text-emerald-600 text-center">{t('profile.updateSuccess')}</p>}
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-white pb-24">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center h-14 px-3">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
            {backIcon}
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex-1 text-center -ml-10">{t('customerSettings.title')}</h1>
        </header>
        <div className="max-w-lg mx-auto px-3 py-6">
          <section className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('customerSettings.accountSecurity')}</h3>
            <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
              <button type="button" onClick={() => setCustomerView('edit')} className="flex items-center gap-3 p-4 hover:bg-gray-50 w-full text-left">
                <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </span>
                <span className="font-medium text-gray-900">{t('customerSettings.personalProfile')}</span>
                <svg className="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <Link to="/profile/change-password" className="flex items-center gap-3 p-4 hover:bg-gray-50 border-t border-gray-100">
                <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </span>
                <span className="font-medium text-gray-900">{t('customerSettings.accountSettings')}</span>
                <svg className="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
              <div className="flex items-center gap-3 p-4 border-t border-gray-100">
                <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{t('settings.twoFactorAuthentication')}</p>
                  <p className="text-sm text-gray-500">{t('settings.twoFactorDescription')}</p>
                </div>
                <button type="button" role="switch" aria-checked={twoFactorEnabled} onClick={() => setTwoFactorEnabledPersist(!twoFactorEnabled)} className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow mt-0.5 transition-transform ${twoFactorEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <Link to="/customer/payment-methods" className="flex items-center gap-3 p-4 hover:bg-gray-50 border-t border-gray-100">
                <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                </span>
                <span className="font-medium text-gray-900 flex-1">{t('settings.paymentMethods')}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
              <Link to="/customer/documents" className="flex items-center gap-3 p-4 hover:bg-gray-50 border-t border-gray-100">
                <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </span>
                <span className="font-medium text-gray-900 flex-1">{t('settings.uploadDocuments')}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </section>
          <section className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('customerSettings.options')}</h3>
            <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
              <div className="flex items-center gap-3 p-4">
                <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </span>
                <span className="font-medium text-gray-900 flex-1">{t('customerSettings.notifications')}</span>
                <button type="button" role="switch" aria-checked={notificationsOn} onClick={() => setNotificationsOn((v) => !v)} className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${notificationsOn ? 'bg-blue-600' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow mt-0.5 transition-transform ${notificationsOn ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center gap-3 p-4 border-t border-gray-100">
                <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0h.5a2.5 2.5 0 002.5-2.5V3.935M12 12a2 2 0 100 4 2 2 0 000-4z" /></svg>
                </span>
                <span className="font-medium text-gray-900 flex-1">{t('customerSettings.language')}</span>
                <span className="text-sm text-gray-500">Tiếng Việt</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
              <div className="flex items-center gap-3 p-4 border-t border-gray-100">
                <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                </span>
                <span className="font-medium text-gray-900 flex-1">{t('customerSettings.darkMode')}</span>
                <button type="button" role="switch" className="relative inline-flex h-6 w-11 shrink-0 rounded-full bg-gray-200">
                  <span className="inline-block h-5 w-5 rounded-full bg-white shadow mt-0.5 translate-x-0.5" />
                </button>
              </div>
            </div>
          </section>
          <section className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('customerSettings.application')}</h3>
            <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
              <button type="button" className="flex items-center gap-3 p-4 w-full hover:bg-gray-50 text-left">
                <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </span>
                <span className="font-medium text-gray-900 flex-1">{t('customerSettings.aboutApp')}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </section>
          <button type="button" onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            {t('common.logout')}
          </button>
          <p className="text-center text-xs text-gray-400 mt-6">{t('customerSettings.version', { version: '2.4.0', build: '145' })}</p>
        </div>
      </div>
    );
  }

  if (isDoctor) {
    const doctorDisplayName = `BS. ${form.firstName ?? ''} ${form.lastName ?? ''}`.trim() || 'BS. Doctor';
    const specialty = (user as User & { specialty?: string }).specialty ?? 'Nội tổng quát';

    if (doctorView === 'main') {
      return (
        <div className="max-w-lg mx-auto pb-24 px-3">
          <header className="flex items-center gap-3 py-4">
            <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
              {backIcon}
            </button>
            <h1 className="text-xl font-bold text-gray-900 flex-1">{t('doctorSettings.title')}</h1>
          </header>
          <section className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('doctorSettings.accountSecurity')}</h3>
            <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
              <button type="button" onClick={() => setDoctorView('profile')} className="flex items-center gap-3 p-4 hover:bg-gray-50 w-full text-left">
                <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </span>
                <span className="font-medium text-gray-900">{t('settings.profileMenu')}</span>
                <svg className="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <Link to="/profile/change-password" className="flex items-center gap-3 p-4 hover:bg-gray-50 border-t border-gray-100">
                <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </span>
                <span className="font-medium text-gray-900">{t('doctorSettings.changePassword')}</span>
                <svg className="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
              <div className="flex items-center gap-3 p-4 border-t border-gray-100">
                <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{t('settings.twoFactorAuthentication')}</p>
                  <p className="text-sm text-gray-500">{t('settings.twoFactorDescription')}</p>
                </div>
                <button type="button" role="switch" aria-checked={twoFactorEnabled} onClick={() => setTwoFactorEnabledPersist(!twoFactorEnabled)} className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow mt-0.5 transition-transform ${twoFactorEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <Link to="/doctor/schedule" className="flex items-center gap-3 p-4 hover:bg-gray-50 border-t border-gray-100">
                <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </span>
                <span className="font-medium text-gray-900">{t('doctorSettings.workSchedule')}</span>
                <svg className="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
              <Link to="/doctor/payment-methods" className="flex items-center gap-3 p-4 hover:bg-gray-50 border-t border-gray-100">
                <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                </span>
                <span className="font-medium text-gray-900 flex-1">{t('settings.paymentMethods')}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
              <Link to="/doctor/certificates" className="flex items-center gap-3 p-4 hover:bg-gray-50 border-t border-gray-100">
                <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </span>
                <span className="font-medium text-gray-900 flex-1">{t('settings.uploadDocuments')}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </section>
          <section className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('doctorSettings.application')}</h3>
            <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
              <div className="flex items-center gap-3 p-4">
                <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </span>
                <span className="font-medium text-gray-900 flex-1">{t('settings.notifications')}</span>
                <button type="button" role="switch" aria-checked={notificationsOn} onClick={() => setNotificationsOn((v) => !v)} className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${notificationsOn ? 'bg-blue-600' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow mt-0.5 transition-transform ${notificationsOn ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <button type="button" className="flex items-center gap-3 p-4 w-full hover:bg-gray-50 border-t border-gray-100 text-left">
                <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </span>
                <span className="font-medium text-gray-900 flex-1">{t('doctorSettings.aboutApp')}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </section>
          <button type="button" onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-50 text-red-600 font-medium hover:bg-red-100 border border-red-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            {t('doctorSettings.logOut')}
          </button>
          <p className="text-center text-xs text-gray-400 mt-6">{t('doctorSettings.version', { version: '2.4.0', build: '102' })}</p>
        </div>
      );
    }
    return (
      <div className="max-w-lg mx-auto pb-24 px-3">
        <header className="flex items-center gap-3 py-4">
          <button type="button" onClick={() => setDoctorView('main')} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
            {backIcon}
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex-1">{t('settings.profileMenu')}</h1>
        </header>
        <div className="flex items-start gap-4 mb-6 rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
          <label className="relative shrink-0 cursor-pointer">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl overflow-hidden">
              {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : (form.firstName?.[0] ?? '') + (form.lastName?.[0] ?? '') || '?'}
            </div>
            <span className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center border-2 border-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </span>
            <input type="file" accept="image/*" className="sr-only" disabled={uploadingAvatar} onChange={handleAvatarChange} />
          </label>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-gray-900">{doctorDisplayName}</h2>
            <p className="text-sm text-gray-600 mt-0.5">{specialty}</p>
            <p className="text-sm text-gray-500 mt-1">{user?.email ?? ''}</p>
            <p className="text-sm text-gray-500">{form.phone || '—'}</p>
          </div>
        </div>
        <section className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('doctorSettings.accountSecurity')}</h3>
          <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
            <Link to="/profile/change-password" className="flex items-center gap-3 p-4 hover:bg-gray-50">
              <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </span>
              <span className="font-medium text-gray-900">{t('doctorSettings.changePassword')}</span>
              <svg className="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
            <div className="flex items-center gap-3 p-4 border-t border-gray-100">
              <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{t('settings.twoFactorAuthentication')}</p>
                <p className="text-sm text-gray-500">{t('settings.twoFactorDescription')}</p>
              </div>
              <button type="button" role="switch" aria-checked={twoFactorEnabled} onClick={() => setTwoFactorEnabledPersist(!twoFactorEnabled)} className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}>
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow mt-0.5 transition-transform ${twoFactorEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <Link to="/doctor/schedule" className="flex items-center gap-3 p-4 hover:bg-gray-50 border-t border-gray-100">
              <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </span>
              <span className="font-medium text-gray-900">{t('doctorSettings.workSchedule')}</span>
              <svg className="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
            <Link to="/doctor/payment-methods" className="flex items-center gap-3 p-4 hover:bg-gray-50 border-t border-gray-100">
              <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
              </span>
              <span className="font-medium text-gray-900 flex-1">{t('settings.paymentMethods')}</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
            <Link to="/doctor/certificates" className="flex items-center gap-3 p-4 hover:bg-gray-50 border-t border-gray-100">
              <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </span>
              <span className="font-medium text-gray-900 flex-1">{t('settings.uploadDocuments')}</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </section>
        <section className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('doctorSettings.application')}</h3>
          <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
            <div className="flex items-center gap-3 p-4">
              <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </span>
              <span className="font-medium text-gray-900 flex-1">{t('settings.notifications')}</span>
              <button type="button" role="switch" aria-checked={notificationsOn} onClick={() => setNotificationsOn((v) => !v)} className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${notificationsOn ? 'bg-blue-600' : 'bg-gray-200'}`}>
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow mt-0.5 transition-transform ${notificationsOn ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <button type="button" className="flex items-center gap-3 p-4 w-full hover:bg-gray-50 border-t border-gray-100 text-left">
              <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
              <span className="font-medium text-gray-900 flex-1">{t('doctorSettings.aboutApp')}</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </section>
        <button type="button" onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-50 text-red-600 font-medium hover:bg-red-100 border border-red-100">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          {t('doctorSettings.logOut')}
        </button>
        <p className="text-center text-xs text-gray-400 mt-6">{t('doctorSettings.version', { version: '2.4.0', build: '102' })}</p>
      </div>
    );
  }

  if (isAdminRole && settingsView === 'profile_edit') {
    return (
      <div className="min-h-screen bg-white pb-24">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center h-14 px-3">
          <button type="button" onClick={() => setSettingsView('main')} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
            {backIcon}
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex-1 text-center -ml-10">{t('settings.profileMenu')}</h1>
        </header>
        <div className="max-w-lg mx-auto px-3 py-6" id="profile-edit">
          <div className="flex flex-col items-center mb-6">
            <label className="relative cursor-pointer">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-600 overflow-hidden border-2 border-violet-200">
                {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : (form.firstName?.[0] ?? '') + (form.lastName?.[0] ?? '') || '?'}
              </div>
              <span className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center border-2 border-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
              </span>
              <input type="file" accept="image/*" className="sr-only" disabled={uploadingAvatar} onChange={handleAvatarChange} />
            </label>
            <p className="mt-2 text-sm text-blue-600">{t('settings.changeImage')}</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.fullName')}</label>
              <input value={`${form.firstName} ${form.lastName}`.trim()} onChange={(e) => { const p = e.target.value.trim().split(/\s+/); setForm((f) => ({ ...f, firstName: p[0] ?? '', lastName: p.slice(1).join(' ') ?? '' })); }} placeholder="Nguyen Van A" className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.email')}</label>
              <input value={user?.email ?? ''} disabled className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.phone')}</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="0901 234 567" className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.address')}</label>
              <textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="District 1, Ho Chi Minh City" rows={3} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setSettingsView('main')} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50">
                {t('settings.cancel')}
              </button>
              <button type="button" onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60">
                {saving ? t('admin.saving') : t('settings.saveChanges')}
              </button>
            </div>
            {success && <p className="text-sm font-medium text-emerald-600 text-center">{t('profile.updateSuccess')}</p>}
          </div>
          <div className="mt-6">
            <Link to="/profile/change-password" className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50">
              <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{t('settings.changePasswordMenu')}</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-8 px-3">
      <header className="flex items-center gap-4 mb-6">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
          {backIcon}
        </button>
        <h1 className="text-xl font-bold text-gray-900">{t('settings.settingsTitle')}</h1>
      </header>

      <section className="mt-0">
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('settings.preferences')}</h3>
        <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
          {isAdminRole ? (
            <button type="button" onClick={() => setSettingsView('profile_edit')} className="flex items-center gap-3 p-4 hover:bg-gray-50 w-full text-left">
              <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{t('settings.profileMenu')}</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          ) : (
            <button type="button" className="flex items-center gap-3 p-4 hover:bg-gray-50 w-full text-left">
              <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{t('settings.profileMenu')}</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          )}
          <div className="flex items-center gap-3 p-4 border-t border-gray-100">
            <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{t('settings.twoFactorAuthentication')}</p>
              <p className="text-sm text-gray-500">{t('settings.twoFactorDescription')}</p>
            </div>
            <button type="button" role="switch" aria-checked={twoFactorEnabled} onClick={() => setTwoFactorEnabledPersist(!twoFactorEnabled)} className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}>
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow mt-0.5 transition-transform ${twoFactorEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          {isSuperadmin && (
            <Link to="/admin/roles" className="flex items-center gap-3 p-4 hover:bg-gray-50 border-t border-gray-100">
              <span className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{t('settings.rolesTab')}</p>
                <p className="text-sm text-gray-500">{t('adminUsers.rolesAndPermissions')}</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          )}
          <Link to="/notifications" className="flex items-center gap-3 p-4 hover:bg-gray-50 w-full text-left border-t border-gray-100">
            <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{t('settings.notifications')}</p>
              <p className="text-sm text-gray-500">{t('settings.notificationsDescription')}</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
          {role === 'customer' && (
            <Link to="/customer/payment-methods" className="flex items-center gap-3 p-4 hover:bg-gray-50 border-t border-gray-100">
              <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{t('settings.paymentMethods')}</p>
                <p className="text-sm text-gray-500">{t('settings.paymentMethodsDescription')}</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          )}
          <div className="flex items-center gap-3 p-4 border-t border-gray-100">
            <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0h.5a2.5 2.5 0 002.5-2.5V3.935M12 12a2 2 0 100 4 2 2 0 000-4z" /></svg>
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{t('settings.appLanguage')}</p>
              <p className="text-sm text-gray-500">{t('settings.appLanguageDescription')}</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
          <button type="button" className="flex items-center gap-3 p-4 w-full hover:bg-gray-50 border-t border-gray-100 text-left">
            <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{t('settings.aboutApp')}</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          <button type="button" onClick={handleLogout} className="flex items-center gap-3 p-4 w-full bg-red-500 hover:bg-red-600 text-white border-t border-red-400 rounded-b-2xl">
            <span className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </span>
            <span className="font-medium">{t('settings.logOutButton')}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
