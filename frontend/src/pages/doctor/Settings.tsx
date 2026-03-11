import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/useAppDispatch';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { authApi } from '../../api';
import { fetchProfile, logout } from '../../store/authSlice';

export default function DoctorSettings() {
  const { t } = useLanguage();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [avatar, setAvatar] = useState<string | null>(user?.avatar ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user?.avatar != null) setAvatar(user.avatar);
  }, [user?.avatar]);

  function handleLogout() {
    dispatch(logout());
    navigate('/login');
  }

  const apiUrl = import.meta.env.VITE_API_URL || '';
  const backendOrigin = apiUrl.startsWith('http') ? apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '') : '';
  const avatarUrl = avatar ? (avatar.startsWith('http') ? avatar : backendOrigin ? `${backendOrigin}${avatar.startsWith('/') ? avatar : `/${avatar}`}` : avatar) : null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5MB.');
      return;
    }
    setUploadingAvatar(true);
    authApi.uploadAvatar(file)
      .then((res) => {
        const url = res.data?.data?.avatar ?? (res.data as { avatar?: string })?.avatar;
        if (url) setAvatar(url);
        dispatch(fetchProfile());
      })
      .catch(() => toast.error('Failed to upload avatar.'))
      .finally(() => { setUploadingAvatar(false); e.target.value = ''; });
  };

  const name = `Dr. ${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Doctor';

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <div className="flex items-center gap-3 mb-8">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">{t('settings.accountSettings')}</h1>
      </div>

      <div className="flex flex-col items-center mb-8">
        <label className="relative flex cursor-pointer items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl overflow-hidden">
            {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : (user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '') || '?'}
          </div>
          <span className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow border-2 border-white" aria-hidden>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
          </span>
          <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="absolute inset-0 w-full h-full cursor-pointer opacity-0" disabled={uploadingAvatar} onChange={handleAvatarChange} aria-label={t('settings.changeAvatar')} />
        </label>
        <h2 className="mt-3 text-xl font-bold text-gray-900">{name}</h2>
        <p className="text-sm text-gray-500">Cardiology • Specialist</p>
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Personal Information</h3>
          <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
            <Link to="/profile" className="flex items-center gap-3 p-4 hover:bg-gray-50">
              <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">Edit Profile</p>
                <p className="text-sm text-gray-500">Update name, bio and professional info</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
            <Link to="/doctor/certificates" className="flex items-center gap-3 p-4 hover:bg-gray-50 border-t border-gray-100">
              <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">Verify Credentials</p>
                <p className="text-sm text-gray-500">Manage medical licenses and certificates</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Security</h3>
          <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
            <Link to="/profile" className="flex items-center gap-3 p-4 hover:bg-gray-50">
              <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">Change Password</p>
                <p className="text-sm text-gray-500">Last changed 3 months ago</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
            <div className="flex items-center gap-3 p-4 border-t border-gray-100">
              <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                <span className="text-[10px] font-bold text-gray-500">2FA</span>
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">Authenticator (2FA)</p>
                <p className="text-sm text-green-600 font-medium">2FA Authenticator Current: Enabled</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Preferences</h3>
          <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
            <Link to="/notifications" className="flex items-center gap-3 p-4 hover:bg-gray-50">
              <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">Notifications</p>
                <p className="text-sm text-gray-500">Email, Push and SMS settings</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
            <div className="flex items-center gap-3 p-4 border-t border-gray-100">
              <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0h.5a2.5 2.5 0 002.5-2.5V3.935M12 12a2 2 0 100 4 2 2 0 000-4z" /></svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">App Language</p>
                <p className="text-sm text-gray-500">English (United States)</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
            <Link to="/doctor/settings/support" className="flex items-center gap-3 p-4 hover:bg-gray-50 border-t border-gray-100">
              <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">Support & FAQ</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
            <button type="button" onClick={handleLogout} className="flex items-center gap-3 p-4 w-full hover:bg-red-50 border-t border-gray-100 text-red-600">
              <span className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </span>
              <span className="font-medium">Log Out</span>
            </button>
          </div>
        </section>
      </div>

      <p className="text-center text-xs text-gray-400 mt-8">Version 2.4.1 (Build 890) • TELEMED</p>
    </div>
  );
}
