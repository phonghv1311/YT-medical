import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminApi } from '../../api/admin';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { doctorsApi } from '../../api/doctors';
import type { User } from '../../types';
import type { Doctor } from '../../types';

interface Role {
  id: number;
  name: string;
}

interface Hospital {
  id: number;
  name: string;
}

interface UserForm {
  firstName: string;
  lastName: string;
  phone: string;
  roleId: number;
  hospitalId: number | '';
}

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const currentUser = useAppSelector((s) => s.auth.user);
  const userFromState = (location.state as { user?: User })?.user;
  const [user, setUser] = useState<User | null>(userFromState ?? null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [form, setForm] = useState<UserForm>({ firstName: '', lastName: '', phone: '', roleId: 0, hospitalId: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!userFromState && !!id);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [deactivating, setDeactivating] = useState(false);

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
      .catch(() => { });
    return () => ctrl.abort();
  }, [user]);

  useEffect(() => {
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    Promise.all([adminApi.getRoles({ signal }), adminApi.getHospitals({ signal })])
      .then(([rolesRes, hospitalsRes]) => {
        if (signal.aborted) return;
        const rolesData = rolesRes.data?.data ?? rolesRes.data;
        const rolesList = rolesData?.roles ?? (Array.isArray(rolesData) ? rolesData : []);
        setRoles(rolesList);
        const hospitalsData = hospitalsRes.data?.data ?? hospitalsRes.data;
        const hospitalsList = Array.isArray(hospitalsData) ? hospitalsData : hospitalsData?.hospitals ?? [];
        setHospitals(hospitalsList);
      })
      .catch(() => { });
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    const u = user ?? userFromState;
    if (!u || roles.length === 0) return;
    const roleName = typeof (u as User & { role?: string | { name?: string } }).role === 'string'
      ? (u as User & { role?: string }).role
      : (u as User & { role?: { name?: string } }).role?.name ?? '';
    const role = roles.find((r: Role) => r.name === roleName) ?? roles[0];
    const hospitalId = (u as User & { hospitalId?: number }).hospitalId ?? (u as User & { hospital?: { id?: number } }).hospital?.id ?? '';
    setForm({
      firstName: u.firstName ?? '',
      lastName: u.lastName ?? '',
      phone: u.phone ?? '',
      roleId: role?.id ?? roles[0]?.id ?? 0,
      hospitalId: hospitalId ? Number(hospitalId) : '',
    });
  }, [user, userFromState, roles]);

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
  const targetRoleName = roleLabel?.toString().toLowerCase();
  const isTargetDoctorOrCustomer = targetRoleName === 'doctor' || targetRoleName === 'customer';
  const isTargetSuperadmin = targetRoleName === 'superadmin';
  const currentRole = (currentUser as User & { role?: string | { name?: string } })?.role;
  const currentRoleName = typeof currentRole === 'string' ? currentRole : (currentRole as { name?: string })?.name;
  const isCurrentSuperadmin = currentRoleName === 'superadmin';
  const refetchUser = async () => {
    if (!u?.id) return;
    try {
      const r = await adminApi.getUser(u.id);
      const updated = r.data?.data ?? r.data;
      if (updated && typeof updated === 'object') setUser(updated as User);
    } catch {
      // keep current state on error
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isTargetDoctorOrCustomer) return;
    setSaving(true);
    try {
      const payload: Parameters<typeof adminApi.updateUser>[1] = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        isActive,
      };
      if (!isTargetSuperadmin) payload.roleId = form.roleId;
      await adminApi.updateUser(u.id, payload);
      await refetchUser();
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = () => {
    if (isActive) {
      setShowDeactivateModal(true);
      setDeactivateReason('');
    } else {
      adminApi.updateUser(u.id, { isActive: true })
        .then(() => refetchUser())
        .catch((err) => console.error(err));
    }
  };

  const handleDelete = () => {
    setShowDeactivateModal(true);
    setDeactivateReason('');
  };

  const confirmDeactivate = async () => {
    if (!deactivateReason.trim()) return;
    setDeactivating(true);
    try {
      await adminApi.deactivateUser(u.id, { reason: deactivateReason.trim() });
      navigate('/admin/users');
    } catch (err) {
      console.error('Failed to deactivate user', err);
    } finally {
      setDeactivating(false);
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
          <h1 className="text-lg font-bold text-gray-900 truncate flex-1">
            {isTargetDoctorOrCustomer ? t('admin.viewUser') : t('admin.editUser')}
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="flex flex-col items-center mb-6">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-2xl">
              {(form.firstName?.[0] ?? '') + (form.lastName?.[0] ?? '') || (u.email?.[0] ?? '?')}
            </div>
            <span className="absolute bottom-0 right-0 w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center" aria-hidden>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7" /></svg>
            </span>
          </div>
          <p className="text-sm text-blue-600 mt-2">{t('settings.changeImage')}</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.fullName')} *</label>
            <input
              value={[form.firstName, form.lastName].filter(Boolean).join(' ')}
              onChange={(e) => {
                const parts = e.target.value.trim().split(/\s+/);
                setForm((f) => ({ ...f, firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') ?? '' }));
              }}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900"
              required
              disabled={isTargetDoctorOrCustomer}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" value={u.email ?? ''} readOnly className="w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-gray-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.phone')}</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900"
              disabled={isTargetDoctorOrCustomer}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.role')}</label>
            <select
              value={form.roleId}
              onChange={(e) => setForm((f) => ({ ...f, roleId: Number(e.target.value) }))}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900"
              disabled={isTargetDoctorOrCustomer || isTargetSuperadmin}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.hospital')}</label>
            <select
              value={form.hospitalId === '' ? '' : form.hospitalId}
              onChange={(e) => setForm((f) => ({ ...f, hospitalId: e.target.value === '' ? '' : Number(e.target.value) }))}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900"
              disabled={isTargetDoctorOrCustomer}
            >
              <option value="">—</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">{t('admin.status')}</p>
              <p className="text-sm text-gray-500">{t('admin.active')}</p>
            </div>
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={isTargetSuperadmin}
              className={`shrink-0 w-12 h-7 rounded-full transition ${isActive ? 'bg-blue-600' : 'bg-gray-200'} ${isTargetSuperadmin ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label={isActive ? t('admin.active') : t('admin.inactive')}
            >
              <span className={`block w-5 h-5 rounded-full bg-white shadow mt-1 transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          {!isTargetDoctorOrCustomer && (
            <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50">
              {saving ? t('common.loading') : t('common.save')}
            </button>
          )}
        </form>

        {(!isTargetDoctorOrCustomer || isCurrentSuperadmin) && !isTargetSuperadmin && (
          <button type="button" onClick={handleDelete} className="mt-4 w-full text-center text-sm text-red-600 hover:underline">
            {t('admin.deleteAccount')}
          </button>
        )}
      </main>

      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => !deactivating && setShowDeactivateModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">{t('adminUsers.deactivateTitle')}</h3>
            <p className="text-sm text-gray-600">{t('adminUsers.deactivateMessage', { name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email })}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.deactivateReasonLabel')} *</label>
              <textarea
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder={t('adminUsers.deactivateReasonPlaceholder')}
                rows={3}
                className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500">{t('adminUsers.deactivateNotify')}</p>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowDeactivateModal(false)} disabled={deactivating} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">{t('common.cancel')}</button>
              <button type="button" onClick={confirmDeactivate} disabled={deactivating || !deactivateReason.trim()} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                {deactivating ? t('common.loading') : t('adminUsers.deactivateConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
