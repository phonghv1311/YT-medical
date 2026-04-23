import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { adminApi } from '../../api/admin';
import { doctorsApi } from '../../api/doctors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { getRole } from '../../utils/auth';
import { DashboardSkeleton } from '../../components/skeletons';
import type { Department, Hospital, Specialization, User } from '../../types';

interface Role {
  id: number;
  name: string;
  permissions?: { id: number; name: string }[];
}

type PendingKind = 'pending' | 'active' | 'inactive';
type UserRoleName = 'doctor' | 'staff';

type UserRow = User & {
  // These fields exist on backend but aren't included in the narrow `User` type.
  isActive?: boolean;
  deactivatedReason?: string | null;
  deactivatedAt?: string | null;
  phone?: string;
  doctor?: {
    specializations?: Specialization[];
    doctorDepartments?: Array<{ department?: Department }>;
  };
  staff?: {
    department?: Department;
    position?: string | null;
    hospital?: Hospital;
  };
};

function getRoleName(u: UserRow): string {
  const roleVal = (u as any).role;
  if (typeof roleVal === 'string') return roleVal;
  if (roleVal && typeof roleVal === 'object' && 'name' in roleVal) return String((roleVal as any).name);
  return '';
}

function initialsFromName(u: Pick<User, 'firstName' | 'lastName'>) {
  return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() || '?';
}

export default function AdminUsersV2() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const currentUser = useAppSelector((s) => s.auth.user);
  const role = getRole(currentUser);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [myHospitalId, setMyHospitalId] = useState<number | null>(null);
  const [myHospitalName, setMyHospitalName] = useState<string>('—');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;

  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<PendingKind>('active');

  const [deactivateTarget, setDeactivateTarget] = useState<UserRow | null>(null);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [deactivating, setDeactivating] = useState(false);

  // Create modal
  const [modalOpen, setModalOpen] = useState(false);
  const [createRole, setCreateRole] = useState<UserRoleName>('doctor');
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    khoaId: '' as number | '',
    departmentId: '' as number | '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  const doctorRoleId = useMemo(() => roles.find((r) => r.name === 'doctor')?.id, [roles]);
  const staffRoleId = useMemo(() => roles.find((r) => r.name === 'staff')?.id, [roles]);

  const computePendingKind = useCallback((u: UserRow): PendingKind => {
    const active = u.isActive !== false;
    const hasDeactivateMeta = Boolean(u.deactivatedReason && String(u.deactivatedReason).trim()) || Boolean(u.deactivatedAt);
    if (active) return 'active';
    if (!hasDeactivateMeta) return 'pending';
    return 'inactive';
  }, []);

  const khoaLabelForUser = useCallback((u: UserRow): string => {
    const roleName = getRoleName(u).toLowerCase();
    if (roleName === 'doctor') return u.doctor?.specializations?.[0]?.name ?? '—';
    if (roleName === 'staff') return u.staff?.department?.name ?? '—';
    return '—';
  }, []);

  const departmentLabelForUser = useCallback((u: UserRow): string => {
    const roleName = getRoleName(u).toLowerCase();
    if (roleName === 'doctor') return u.doctor?.doctorDepartments?.[0]?.department?.name ?? '—';
    if (roleName === 'staff') return u.staff?.department?.name ?? '—';
    return '—';
  }, []);

  const isDoctorOrStaff = useCallback((u: UserRow) => {
    const rn = getRoleName(u).toLowerCase();
    return rn === 'doctor' || rn === 'staff';
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (!isDoctorOrStaff(u)) return false;
      const kind = computePendingKind(u);
      if (statusTab !== kind) return false;
      if (!q) return true;
      const haystack = [u.firstName, u.lastName, u.email, u.phone].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [computePendingKind, isDoctorOrStaff, search, statusTab, users]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getUsers({ page, limit });
      const payload = data?.data ?? data;
      const list = (payload?.users ?? payload?.data ?? payload) as UserRow[] | undefined;
      setUsers(Array.isArray(list) ? list : []);
      setTotal(payload?.total ?? (Array.isArray(list) ? list.length : 0));
    } catch {
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const loadMyHospital = useCallback(async () => {
    try {
      const res = await adminApi.getStaffMe();
      const data = res.data?.data ?? res.data;
      const hid = data?.hospitalId ?? data?.hospital?.id ?? null;
      const hname = data?.hospital?.name ?? '—';
      setMyHospitalId(hid);
      setMyHospitalName(hname);
    } catch {
      setMyHospitalId(null);
      setMyHospitalName('—');
    }
  }, []);

  useEffect(() => {
    // Only hospital-scoped admin needs this; superadmin can manage all.
    void loadMyHospital();
  }, [loadMyHospital]);

  useEffect(() => {
    const ctrl = new AbortController();
    const run = async () => {
      try {
        const [rolesRes, specsRes] = await Promise.all([
          adminApi.getRoles({ signal: ctrl.signal }),
          doctorsApi.getSpecializations({ signal: ctrl.signal }),
        ]);
        const rolePayload = rolesRes.data?.data ?? rolesRes.data;
        const roleList: Role[] = rolePayload?.roles ?? (Array.isArray(rolePayload) ? rolePayload : rolePayload?.roleList ?? []);
        setRoles(roleList);

        // doctorsApi.getSpecializations returns an array of { id, name } directly.
        const specList = (specsRes.data ?? specsRes.data ?? []) as any[];
        if (Array.isArray(specList)) setSpecializations(specList as Specialization[]);
      } catch {
        // ignore
      }
    };
    void run();
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    const run = async () => {
      try {
        const hospitalIdToLoad = role === 'superadmin' ? undefined : myHospitalId ?? undefined;
        if (role !== 'superadmin' && !hospitalIdToLoad) return;

        const departmentsRes = await adminApi.getDepartments(
          hospitalIdToLoad as number,
          { signal: ctrl.signal },
        );
        const depPayload = departmentsRes.data?.data ?? departmentsRes.data ?? [];
        if (Array.isArray(depPayload)) setDepartments(depPayload);
      } catch {
        setDepartments([]);
      }
    };
    void run();
    return () => ctrl.abort();
  }, [myHospitalId, role]);

  useEffect(() => {
    void refresh();
  }, [refresh, page]);

  const openCreate = (nextRole?: UserRoleName) => {
    setCreateRole(nextRole ?? 'doctor');
    setForm({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      khoaId: '',
      departmentId: '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validateCreate = (): boolean => {
    const errs: Partial<Record<keyof typeof form, string>> = {};
    if (!form.email.trim()) errs.email = t('adminUsers.emailRequired');
    if (!form.password.trim()) errs.password = t('adminUsers.passwordRequired');
    if (form.password.trim() && form.password.trim().length < 6) errs.password = t('adminUsers.passwordMin');
    if (!form.firstName.trim()) errs.firstName = t('adminUsers.firstNameRequired');
    if (!form.lastName.trim()) errs.lastName = t('adminUsers.lastNameRequired');
    if (!form.departmentId) errs.departmentId = 'Phòng ban is required';

    if (createRole === 'doctor' && !form.khoaId) errs.khoaId = 'Khoa is required';

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateCreate()) return;
    if (!myHospitalId && role !== 'superadmin') return;

    if (createRole === 'staff' && !staffRoleId) return;
    if (createRole === 'doctor' && !doctorRoleId) return;

    setSaving(true);
    try {
      if (createRole === 'staff') {
        await adminApi.createStaff({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || undefined,
          hospitalId: myHospitalId ?? undefined,
          departmentId: Number(form.departmentId),
        });
      } else {
        const khoaId = Number(form.khoaId);
        await adminApi.createUser({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || undefined,
          roleId: doctorRoleId!,
          hospitalId: myHospitalId ?? undefined,
          departmentId: Number(form.departmentId),
          specializationIds: [khoaId],
        });
      }
      setModalOpen(false);
      await refresh();
    } catch {
      setFormErrors({ email: 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (u: UserRow) => {
    try {
      await adminApi.updateUser(u.id, { isActive: true });
      await refresh();
    } catch {
      // ignore
    }
  };

  const handleActivate = async (u: UserRow) => {
    try {
      await adminApi.updateUser(u.id, { isActive: true });
      await refresh();
    } catch {
      // ignore
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget || !deactivateReason.trim()) return;
    setDeactivating(true);
    try {
      await adminApi.deactivateUser(deactivateTarget.id, { reason: deactivateReason.trim() });
      setDeactivateTarget(null);
      setDeactivateReason('');
      await refresh();
    } catch {
      // ignore
    } finally {
      setDeactivating(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading && users.length === 0) return <DashboardSkeleton />;

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between gap-3 pt-4 max-w-lg mx-auto px-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 shrink-0"
            aria-label={t('common.back')}
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900 truncate">{t('admin.userManagement')}</h1>
        </div>

        <button
          type="button"
          onClick={() => openCreate(statusTab === 'pending' ? 'doctor' : createRole)}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('adminDashboard.addUser')}
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4">
        <div className="relative mt-2">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="search"
            placeholder={t('admin.searchUsers')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pt-3">
          {(
            [
              { key: 'pending' as const, label: 'Chờ duyệt' },
              { key: 'active' as const, label: t('admin.active') },
              { key: 'inactive' as const, label: t('admin.inactive') },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusTab(tab.key)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition ${statusTab === tab.key ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="pt-3 pb-2 text-xs text-gray-500">
          {role === 'superadmin' ? 'All hospitals' : `Hospital: ${myHospitalName}`}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4">
        {filteredUsers.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">{t('employeeDirectory.noMatch')}</p>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((u) => {
              const isActive = u.isActive !== false;
              const kind = computePendingKind(u);
              const roleName = getRoleName(u).toLowerCase() as UserRoleName;
              const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;
              const khoa = khoaLabelForUser(u);
              const phongBan = departmentLabelForUser(u);
              const phone = u.phone ?? '—';

              const badgeClass =
                roleName === 'doctor'
                  ? 'bg-emerald-100 text-emerald-800'
                  : roleName === 'staff'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700';

              const badgeLabel = roleName === 'doctor' ? t('auth.doctor') : t('employeeDirectory.employees') ?? 'Employees';

              return (
                <div key={u.id} className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm relative group">
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/users/${u.id}`, { state: { user: u } })}
                    className="absolute inset-0 rounded-xl cursor-pointer z-0 focus:outline-none"
                    aria-label={fullName}
                  />

                  <div className="relative z-10 flex items-start gap-3">
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                        {initialsFromName(u)}
                      </div>
                      {kind !== 'pending' && isActive && (
                        <span className="absolute bottom-0 left-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-gray-900 truncate">{fullName}</h2>
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold uppercase ${badgeClass}`}>
                          {badgeLabel}
                        </span>
                      </div>

                      <p className="text-sm text-blue-600 mt-0.5">Khoa: {khoa}</p>

                      <ul className="text-xs text-gray-500 mt-1.5 space-y-0.5">
                        <li>
                          <span className="text-gray-400">SDT:</span> {phone}
                        </li>
                        <li>
                          <span className="text-gray-400">Phòng ban:</span> {phongBan}
                        </li>
                        <li>
                          <span className="text-gray-400">Trạng thái:</span>{' '}
                          {kind === 'pending' ? 'Chờ duyệt' : isActive ? t('admin.active') : t('admin.inactive')}
                        </li>
                      </ul>
                    </div>

                    <div className="pointer-events-auto shrink-0 flex items-center gap-2">
                      {kind === 'pending' ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleApprove(u);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
                        >
                          Duyệt
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isActive) setDeactivateTarget(u);
                            else void handleActivate(u);
                          }}
                          className={`shrink-0 w-11 h-6 rounded-full transition ${isActive ? 'bg-blue-600' : 'bg-gray-200'}`}
                          aria-label={isActive ? t('admin.active') : t('admin.inactive')}
                        >
                          <span
                            className={`block w-5 h-5 rounded-full bg-white shadow mt-0.5 transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0.5'
                              }`}
                          />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeactivateTarget(u);
                          setDeactivateReason('');
                        }}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                        aria-label={t('common.delete')}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6 pb-10">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50 transition"
            >
              Prev
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Deactivate modal */}
      {deactivateTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={() => !deactivating && setDeactivateTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900">{t('adminUsers.deactivateTitle')}</h3>
            <p className="text-sm text-gray-600">
              {t('adminUsers.deactivateMessage', {
                name: [deactivateTarget.firstName, deactivateTarget.lastName].filter(Boolean).join(' ') || deactivateTarget.email,
              })}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('adminUsers.deactivateReasonLabel')} *
              </label>
              <textarea
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder={t('adminUsers.deactivateReasonPlaceholder')}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500">{t('adminUsers.deactivateNotify')}</p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeactivateTarget(null)}
                disabled={deactivating}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={deactivating || !deactivateReason.trim()}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deactivating ? t('common.loading') : t('adminUsers.deactivateConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={() => !saving && setModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-5">
              <h3 className="text-lg font-semibold text-gray-900">{t('adminUsers.createUser')}</h3>

              <form onSubmit={submitCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.firstName')}</label>
                    <input
                      value={form.firstName}
                      onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                      className={`w-full rounded-lg border shadow-sm text-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.firstName ? 'border-red-400' : 'border-gray-300'
                        }`}
                    />
                    {formErrors.firstName && <p className="text-red-600 text-xs mt-1">{formErrors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.lastName')}</label>
                    <input
                      value={form.lastName}
                      onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                      className={`w-full rounded-lg border shadow-sm text-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.lastName ? 'border-red-400' : 'border-gray-300'
                        }`}
                    />
                    {formErrors.lastName && <p className="text-red-600 text-xs mt-1">{formErrors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.email')}</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className={`w-full rounded-lg border shadow-sm text-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.email ? 'border-red-400' : 'border-gray-300'
                      }`}
                  />
                  {formErrors.email && <p className="text-red-600 text-xs mt-1">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.password')}</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    className={`w-full rounded-lg border shadow-sm text-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.password ? 'border-red-400' : 'border-gray-300'
                      }`}
                  />
                  {formErrors.password && <p className="text-red-600 text-xs mt-1">{formErrors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.phone')}</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 shadow-sm text-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.role')}</label>
                    <select
                      value={createRole}
                      onChange={(e) => {
                        const next = e.target.value as UserRoleName;
                        setCreateRole(next);
                        // For staff, we treat "khoa" as derived from department selection.
                        setForm((f) => ({ ...f, khoaId: next === 'staff' ? f.departmentId : '' }));
                      }}
                      className="w-full rounded-lg border border-gray-300 shadow-sm text-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500 capitalize"
                    >
                      <option value="doctor">{t('auth.doctor')}</option>
                      <option value="staff">{t('employeeDirectory.employees') ?? 'Employees'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phòng ban làm việc</label>
                    <select
                      value={form.departmentId === '' ? '' : String(form.departmentId)}
                      onChange={(e) => {
                        const v = e.target.value;
                        setForm((f) => ({
                          ...f,
                          departmentId: v === '' ? '' : Number(v),
                          khoaId: createRole === 'staff' ? (v === '' ? '' : Number(v)) : f.khoaId,
                        }));
                      }}
                      className={`w-full rounded-lg border shadow-sm text-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.departmentId ? 'border-red-400' : 'border-gray-300'
                        }`}
                    >
                      <option value="">{t('adminUsers.selectDepartment')} ({myHospitalName})</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.departmentId && <p className="text-red-600 text-xs mt-1">{formErrors.departmentId}</p>}
                  </div>
                </div>

                {createRole === 'doctor' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Khoa</label>
                    <select
                      value={form.khoaId === '' ? '' : String(form.khoaId)}
                      onChange={(e) => {
                        const v = e.target.value;
                        setForm((f) => ({ ...f, khoaId: v === '' ? '' : Number(v) }));
                      }}
                      className={`w-full rounded-lg border shadow-sm text-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.khoaId ? 'border-red-400' : 'border-gray-300'
                        }`}
                    >
                      <option value="">{t('common.select')}</option>
                      {specializations.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.khoaId && <p className="text-red-600 text-xs mt-1">{formErrors.khoaId}</p>}
                  </div>
                )}

                {createRole === 'staff' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Khoa</label>
                    <select
                      value={form.khoaId === '' ? '' : String(form.khoaId)}
                      onChange={(e) => {
                        const v = e.target.value;
                        setForm((f) => ({ ...f, khoaId: v === '' ? '' : Number(v), departmentId: v === '' ? '' : Number(v) }));
                      }}
                      className="w-full rounded-lg border border-gray-300 shadow-sm text-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">{t('adminUsers.selectDepartment')}</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {saving ? t('admin.saving') : t('common.save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

