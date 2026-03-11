import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/useAppDispatch';
import { authApi } from '../api';
import { fetchProfile, logout } from '../store/authSlice';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { getRole } from '../utils/auth';
import { ProfileSkeleton } from '../components/skeletons';
import AdminRoles from './admin/Roles';
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

  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'account' | 'roles'>('account');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        phone: user.phone ?? '',
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
  const accent = getAccentClasses(role);
  const displayName = isDoctor ? `Dr. ${form.firstName} ${form.lastName}`.trim() || 'Doctor' : `${form.firstName} ${form.lastName}`.trim() || '—';
  const roleLabel = role.replace(/([A-Z])/g, ' $1').trim();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleChangePasswordSubmit = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    setPasswordError(null);
    setChangingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success(t('settings.changePasswordSuccess'));
      setShowChangePasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; status?: number };
      const msg = e.response?.data?.message ?? t('settings.currentPasswordIncorrect');
      setPasswordError(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return <ProfileSkeleton />;

  if (isSuperadmin && settingsTab === 'roles') {
    return (
      <div className="max-w-2xl mx-auto pb-8 px-4 sm:px-6">
        <div className="flex border-b border-gray-200 mb-6">
          <button type="button" onClick={() => setSettingsTab('account')} className={`px-4 py-3 text-sm font-medium border-b-2 transition ${settingsTab === 'account' ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t('settings.accountTab')}
          </button>
          <button type="button" onClick={() => setSettingsTab('roles')} className={`px-4 py-3 text-sm font-medium border-b-2 transition ${settingsTab === 'roles' ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t('settings.rolesTab')}
          </button>
        </div>
        <AdminRoles />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-8 px-4 sm:px-6">
      {isSuperadmin && (
        <div className="flex border-b border-gray-200 mb-6">
          <button type="button" onClick={() => setSettingsTab('account')} className={`px-4 py-3 text-sm font-medium border-b-2 transition ${settingsTab === 'account' ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t('settings.accountTab')}
          </button>
          <button type="button" onClick={() => setSettingsTab('roles')} className={`px-4 py-3 text-sm font-medium border-b-2 transition ${settingsTab === 'roles' ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t('settings.rolesTab')}
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 mb-8">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">{t('settings.accountSettings')}</h1>
      </div>

      <div className="flex flex-col items-center mb-8">
        <label className="relative flex cursor-pointer items-center justify-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden ring-2 ring-white shadow ${accent.bg} ${accent.text}`}>
            {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : <span>{form.firstName?.[0] ?? ''}{form.lastName?.[0] ?? ''}</span>}
          </div>
          <span className={`absolute bottom-0 right-0 w-8 h-8 rounded-full ${role === 'doctor' ? 'bg-blue-600' : isSuperadmin || role === 'admin' || role === 'staff' ? 'bg-violet-600' : 'bg-indigo-600'} text-white flex items-center justify-center shadow border-2 border-white`} aria-hidden>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
          </span>
          <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="absolute inset-0 w-full h-full cursor-pointer opacity-0" disabled={uploadingAvatar} onChange={handleAvatarChange} aria-label={t('settings.changeAvatar')} />
        </label>
        <h2 className="mt-3 text-xl font-bold text-gray-900">{displayName}</h2>
        <p className="text-sm text-gray-500 capitalize">{roleLabel}</p>
        <p className="text-sm text-gray-500">{user?.email}</p>
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('settings.personalInformation')}</h3>
          <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
            <div className="p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{t('adminUsers.firstName')}</label>
                  <input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className={`w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 ${accent.ring}`} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{t('adminUsers.lastName')}</label>
                  <input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className={`w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 ${accent.ring}`} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t('adminUsers.email')}</label>
                <input value={user?.email ?? ''} disabled className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t('adminUsers.phone')}</label>
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={`w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 ${accent.ring}`} />
              </div>
              {isDoctor && (
                <Link to="/doctor/certificates" className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100">
                  <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{t('settings.verifyCredentials')}</p>
                    <p className="text-sm text-gray-500">{t('settings.verifyCredentialsDescription')}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              )}
              <div className="flex items-center gap-4">
                <button type="button" onClick={handleSave} disabled={saving} className={`rounded-lg px-6 py-2.5 text-sm font-semibold text-white ${accent.button} disabled:opacity-60 transition`}>
                  {saving ? t('admin.saving') : t('profile.saveChanges')}
                </button>
                {success && <span className="text-sm font-medium text-emerald-600">{t('profile.updateSuccess')}</span>}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('settings.security')}</h3>
          <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
            <button type="button" onClick={() => setShowChangePasswordModal(true)} className="flex items-center gap-3 p-4 w-full hover:bg-gray-50 text-left">
              <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{t('settings.changePassword')}</p>
                <p className="text-sm text-gray-500">{t('settings.changePasswordDescription')}</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('settings.preferences')}</h3>
          <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
            {isSuperadmin && (
              <button type="button" onClick={() => setSettingsTab('roles')} className="flex items-center gap-3 p-4 w-full hover:bg-gray-50 border-b border-gray-100 text-left">
                <span className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{t('settings.rolesTab')}</p>
                  <p className="text-sm text-gray-500">{t('adminUsers.rolesAndPermissions')}</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            )}
            <Link to="/notifications" className="flex items-center gap-3 p-4 hover:bg-gray-50">
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
              <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0h.5a2.5 2.5 0 002.5-2.5V3.935M12 12a2 2 0 100 4 2 2 0 000-4z" /></svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{t('settings.appLanguage')}</p>
                <p className="text-sm text-gray-500">{t('settings.appLanguageDescription')}</p>
              </div>
            </div>
            <button type="button" onClick={handleLogout} className="flex items-center gap-3 p-4 w-full hover:bg-red-50 border-t border-gray-100 text-red-600">
              <span className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </span>
              <span className="font-medium">{t('settings.logOut')}</span>
            </button>
          </div>
        </section>
      </div>

      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="change-password-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="change-password-title" className="text-lg font-semibold text-gray-900">{t('settings.changePassword')}</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t('settings.currentPassword')}</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t('settings.newPassword')}</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t('settings.confirmNewPassword')}</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  autoComplete="new-password"
                />
              </div>
              {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => { setShowChangePasswordModal(false); setPasswordError(null); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                {t('common.cancel')}
              </button>
              <button type="button" onClick={handleChangePasswordSubmit} disabled={changingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {changingPassword ? t('common.loading') : t('settings.changePassword')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
