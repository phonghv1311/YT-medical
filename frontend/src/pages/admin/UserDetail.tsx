import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { adminApi } from '../../api/admin';
import { doctorsApi } from '../../api/doctors';
import type { User } from '../../types';
import type { Doctor } from '../../types';

interface Role {
  id: number;
  name: string;
}

interface UserForm {
  firstName: string;
  lastName: string;
  phone: string;
  roleId: number;
}

type TabId = 'personal' | 'credentials' | 'account';

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { confirm } = useConfirm();
  const userFromState = (location.state as { user?: User })?.user;
  const [user, setUser] = useState<User | null>(userFromState ?? null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('personal');
  const [editModal, setEditModal] = useState(false);
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [form, setForm] = useState<UserForm>({ firstName: '', lastName: '', phone: '', roleId: 0 });
  const [saving, setSaving] = useState(false);
  const [activityLogs, setActivityLogs] = useState<{ action: string; details?: string; createdAt?: string }[]>([]);
  const [loading, setLoading] = useState(!userFromState && !!id);
  const [menuOpen, setMenuOpen] = useState(false);

  const userId = id ? parseInt(id, 10) : NaN;

  useEffect(() => {
    if (!id || Number.isNaN(userId)) {
      setLoading(false);
      return;
    }
    if (userFromState) {
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    setLoading(true);
    adminApi.getUser(userId, { signal })
      .then((r) => {
        if (signal.aborted) return;
        const u = r.data?.data ?? r.data;
        if (u && typeof u === 'object') setUser(u as User);
      })
      .catch(() => { if (!signal.aborted) setUser(null); })
      .finally(() => { if (!signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [id, userId, userFromState]);

  useEffect(() => {
    if (!user) return;
    const roleName = typeof (user as User & { role?: string | { name?: string } }).role === 'string'
      ? (user as User & { role?: string }).role
      : (user as User & { role?: { name?: string } }).role?.name ?? '';
    if (roleName !== 'doctor') return;
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    doctorsApi.getByUserId(user.id, { signal })
      .then((r) => {
        if (signal.aborted) return;
        const d = r.data?.data ?? r.data;
        if (d && typeof d === 'object') setDoctor(d as Doctor);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [user]);

  useEffect(() => {
    if (!userId || Number.isNaN(userId)) return;
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    adminApi.getLogs({ userId, limit: 10 }, { signal })
      .then((r) => {
        if (signal.aborted) return;
        const data = r.data?.logs ?? r.data?.data ?? r.data;
        setActivityLogs(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">{t('onboarding.loading')}</p>
      </div>
    );
  }

  if (!user && !userFromState) {
    return (
      <div className="p-4 space-y-4">
        <p className="text-gray-500">{t('adminUsers.noUsersYet')}</p>
        <Link to="/admin/users" className="text-blue-600 hover:underline">{t('common.back')}</Link>
      </div>
    );
  }

  const u = user ?? userFromState!;
  const roleLabel = typeof (u as User & { role?: string | { name?: string } }).role === 'string'
    ? (u as User & { role?: string }).role
    : (u as User & { role?: { name?: string } }).role?.name ?? '—';
  const isActive = (u as User & { isActive?: boolean }).isActive !== false;
  const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || '—';
  const titleOrRole = roleLabel === 'doctor' && doctor
    ? `${(doctor.specializations ?? []).map((s) => s.name).join(', ') || 'Provider'} • license: #${doctor.licenseNumber ?? '—'}`
    : roleLabel;

  const openEdit = () => {
    adminApi.getRoles().then(({ data }) => {
      const raw = data.data ?? data;
      const list = raw?.roles ?? (Array.isArray(raw) ? raw : []);
      setRoles(list);
      const role = list.find((r: Role) => r.name === roleLabel) ?? list[0];
      setForm({
        firstName: u.firstName ?? '',
        lastName: u.lastName ?? '',
        phone: u.phone ?? '',
        roleId: role?.id ?? list[0]?.id ?? 0,
      });
      setEditModal(true);
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateUser(u.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        roleId: form.roleId,
      });
      setUser((prev) => prev ? { ...prev, firstName: form.firstName, lastName: form.lastName } : null);
      setEditModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) return;
    setSaving(true);
    try {
      await adminApi.resetUserPassword(u.id, newPassword);
      setNewPassword('');
      setResetPasswordModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSuspend = async () => {
    const ok = await confirm({
      title: t('adminUsers.deactivate'),
      message: t('adminUsers.deleteUserConfirm'),
      confirmLabel: t('adminUsers.deactivate'),
      cancelLabel: t('common.cancel'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await adminApi.updateUser(u.id, { isActive: false });
      setUser((prev) => prev ? { ...prev, isActive: false } as User : null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: t('common.delete'),
      message: t('adminUsers.deleteUserConfirm'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await adminApi.deleteUser(u.id);
      navigate('/admin/users');
    } catch (err) {
      console.error('Failed to delete user', err);
    }
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'personal', label: 'Personal Info' },
    { id: 'credentials', label: 'Credentials & Verification' },
    { id: 'account', label: 'Account Status' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-2">
          <button type="button" onClick={() => navigate('/admin/users')} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900 truncate flex-1">User Management</h1>
          <button type="button" onClick={openEdit} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium flex items-center gap-2 hover:bg-blue-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Edit Profile
          </button>
          <div className="relative">
            <button type="button" onClick={() => setMenuOpen((o) => !o)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-700" aria-label="More" aria-expanded={menuOpen}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" aria-hidden onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg py-1 z-20">
                  <button type="button" onClick={() => { setMenuOpen(false); handleSuspend(); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    Suspend Account
                  </button>
                  <button type="button" onClick={() => { setMenuOpen(false); handleDelete(); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    {t('common.delete')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <nav className="max-w-lg mx-auto px-4 flex gap-1 overflow-x-auto border-t border-gray-100" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm mb-6">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-2xl">
                {(u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '') || '?'}
              </div>
              {isActive && <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-white" />}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-gray-900">{fullName}</h2>
              <p className="text-sm text-blue-600 capitalize">{roleLabel}</p>
              <p className="text-xs text-gray-500 mt-0.5">{titleOrRole}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <button type="button" onClick={() => setResetPasswordModal(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Reset Password
                </button>
                <button type="button" onClick={handleSuspend} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                  Suspend Account
                </button>
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'personal' && (
          <section className="space-y-4">
            <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <dd className="text-gray-900">{u.email}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <dd className="text-gray-900">{u.phone || '—'}</dd>
                </div>
                {roleLabel === 'doctor' && doctor && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                    <dd className="text-gray-500 text-xs">Primary practice — see hospital assignment</dd>
                  </div>
                )}
              </dl>
            </div>
          </section>
        )}

        {activeTab === 'credentials' && (
          <section className="space-y-4">
            <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Credentials & Certifications</h3>
                <button type="button" className="text-sm text-blue-600 hover:underline">View Docs</button>
              </div>
              {roleLabel === 'doctor' && doctor && (
                <ul className="space-y-3 text-sm">
                  {doctor.licenseNumber && (
                    <li className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </span>
                      <span>Board Certification • License #{doctor.licenseNumber}</span>
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                    <span>Doctor of Medicine (MD) — Verified</span>
                  </li>
                </ul>
              )}
              {roleLabel !== 'doctor' && <p className="text-sm text-gray-500">No credentials on file.</p>}
            </div>
          </section>
        )}

        {activeTab === 'account' && (
          <section className="space-y-4">
            <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Account Status</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Membership</dt>
                  <dd className="text-gray-900">Standard</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Two-Factor Auth</dt>
                  <dd className="text-gray-500">Not configured</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Status</dt>
                  <dd>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {isActive ? t('admin.active') : t('admin.inactive')}
                    </span>
                  </dd>
                </div>
              </dl>
              <Link to="/admin/roles" className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Manage Permissions
              </Link>
            </div>
          </section>
        )}

        <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm mt-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Recent Activity
          </h3>
          <ul className="space-y-2 text-sm">
            {activityLogs.length === 0 && <p className="text-gray-500">No recent activity.</p>}
            {activityLogs.map((log, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                <span className="text-gray-700">{log.details ?? log.action}</span>
                <span className="text-gray-400 shrink-0">{log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}</span>
              </li>
            ))}
          </ul>
          <Link to="/admin/logs" className="mt-2 inline-block text-sm text-blue-600 hover:underline">View All History</Link>
        </div>
      </main>

      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={() => setEditModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('adminUsers.editUser')}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.firstName')}</label>
                  <input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.lastName')}</label>
                  <input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.phone')}</label>
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.role')}</label>
                <select value={form.roleId} onChange={(e) => setForm((f) => ({ ...f, roleId: Number(e.target.value) }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm">
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{saving ? t('admin.saving') : t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={() => setResetPasswordModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reset Password</h3>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" placeholder="Min 6 characters" required />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setResetPasswordModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
                <button type="submit" disabled={saving || newPassword.length < 6} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">Reset</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
