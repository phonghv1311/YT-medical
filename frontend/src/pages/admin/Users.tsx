import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { getRole } from '../../utils/auth';
import { adminApi } from '../../api/admin';
import { useLanguage } from '../../contexts/LanguageContext';
import type { User } from '../../types';
import type { Hospital } from '../../types';
import type { Department } from '../../types';

interface Role {
  id: number;
  name: string;
  permissions?: { id: number; name: string }[];
}

interface UserForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  roleId: number;
  hospitalId: number | '';
  departmentId: number | '';
}

/** Role names allowed when adding staff; all must be assigned to a hospital/department. */
const STAFF_ROLE_NAMES = ['admin', 'doctor', 'staff'] as const;

const emptyForm: UserForm = { email: '', password: '', firstName: '', lastName: '', phone: '', roleId: 2, hospitalId: '', departmentId: '' };

type RoleTab = 'all' | 'doctor' | 'staff' | 'admin' | 'customer';

export default function AdminUsers() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = useAppSelector((s) => s.auth.user);
  const isSuperadmin = getRole(currentUser) === 'superadmin';
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 50;
  const [search, setSearch] = useState('');
  const roleTabParam = searchParams.get('roleTab') as RoleTab | null;
  const [roleTab, setRoleTabState] = useState<RoleTab>(roleTabParam && ['all', 'admin', 'doctor', 'staff', 'customer'].includes(roleTabParam) ? roleTabParam : 'all');
  const setRoleTab = (tab: RoleTab) => {
    setRoleTabState(tab);
    const next = new URLSearchParams(searchParams);
    if (tab === 'all') next.delete('roleTab'); else next.set('roleTab', tab);
    setSearchParams(next, { replace: true });
  };
  useEffect(() => {
    if (roleTabParam && roleTabParam !== roleTab && ['all', 'admin', 'doctor', 'staff', 'customer'].includes(roleTabParam)) setRoleTabState(roleTabParam as RoleTab);
  }, [roleTabParam]);
  const [hospitalFilterId, setHospitalFilterId] = useState<number | ''>('');
  const [departmentFilterId, setDepartmentFilterId] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState<string>(''); // '', 'active', 'inactive'

  const [roles, setRoles] = useState<Role[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; id?: number } | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof UserForm, string>>>({});
  const [saving, setSaving] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [deactivating, setDeactivating] = useState(false);

  async function loadUsers(p = page, signal?: AbortSignal) {
    setLoading(true);
    try {
      const { data } = await adminApi.getUsers({ page: p, limit }, signal ? { signal } : undefined);
      if (signal?.aborted) return;
      const payload = data?.data ?? data;
      if (Array.isArray(payload)) {
        setUsers(payload);
        setTotal(payload.length);
      } else {
        setUsers(payload?.data ?? payload?.users ?? []);
        setTotal(payload?.total ?? 0);
      }
    } catch (err) {
      if (!signal?.aborted) console.error('Failed to load users', err);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const ctrl = new AbortController();
    loadUsers(page, ctrl.signal);
    return () => ctrl.abort();
  }, [page]);

  useEffect(() => {
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    adminApi.getRoles({ signal }).then(({ data }) => {
      if (signal.aborted) return;
      const raw = data?.data ?? data;
      const list = raw?.roles ?? (Array.isArray(raw) ? raw : []);
      setRoles(list);
    }).catch(() => { });
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    adminApi.getHospitals({ signal }).then(({ data }) => {
      if (signal.aborted) return;
      const list = data?.data ?? data;
      setHospitals(Array.isArray(list) ? list : []);
    }).catch(() => { });
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    if (form.hospitalId === '') {
      setDepartments([]);
      return;
    }
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    adminApi.getDepartments(form.hospitalId as number, { signal }).then(({ data }) => {
      if (signal.aborted) return;
      const list = data?.data ?? data;
      setDepartments(Array.isArray(list) ? list : []);
    }).catch(() => { if (!signal.aborted) setDepartments([]); });
    return () => ctrl.abort();
  }, [form.hospitalId]);

  const [filterDepartments, setFilterDepartments] = useState<Department[]>([]);
  useEffect(() => {
    if (hospitalFilterId === '') {
      setFilterDepartments([]);
      return;
    }
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    adminApi.getDepartments(hospitalFilterId, { signal }).then(({ data }) => {
      if (signal.aborted) return;
      const list = data?.data ?? data;
      setFilterDepartments(Array.isArray(list) ? list : []);
    }).catch(() => { if (!signal.aborted) setFilterDepartments([]); });
    return () => ctrl.abort();
  }, [hospitalFilterId]);

  function openCreate() {
    const adminRole = roles.find((r) => r.name === 'admin');
    const doctorRole = roles.find((r) => r.name === 'doctor');
    const staffRole = roles.find((r) => r.name === 'staff');
    const customerRole = roles.find((r) => r.name === 'customer');
    const staffRolesForSelect = [adminRole, doctorRole, staffRole].filter(Boolean);
    let defaultRoleId: number;
    if (roleTab === 'admin') defaultRoleId = adminRole?.id ?? roles[0]?.id ?? 2;
    else if (roleTab === 'doctor') defaultRoleId = doctorRole?.id ?? roles[0]?.id ?? 2;
    else if (roleTab === 'staff') defaultRoleId = staffRole?.id ?? roles[0]?.id ?? 2;
    else if (roleTab === 'customer') defaultRoleId = customerRole?.id ?? roles[0]?.id ?? 2;
    else defaultRoleId = adminRole?.id ?? staffRolesForSelect[0]?.id ?? roles[0]?.id ?? 2;
    setForm({ ...emptyForm, roleId: defaultRoleId, hospitalId: '', departmentId: '' });
    setFormErrors({});
    setModal({ mode: 'create' });
  }

  function openEdit(u: User) {
    const roleName = (u as User & { role?: string | { name?: string } }).role;
    const name = typeof roleName === 'string' ? roleName : (roleName as { name?: string })?.name;
    const role = roles.find((r) => r.name === name) ?? roles[0];
    setForm({
      email: u.email,
      password: '',
      firstName: u.firstName ?? '',
      lastName: u.lastName ?? '',
      phone: u.phone ?? '',
      roleId: role?.id ?? (u as User & { roleId?: number }).roleId ?? 2,
      hospitalId: '',
      departmentId: '',
    });
    setFormErrors({});
    setModal({ mode: 'edit', id: u.id });
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof UserForm, string>> = {};
    if (!form.email.trim()) errs.email = t('adminUsers.emailRequired');
    if (modal?.mode === 'create' && !form.password) errs.password = t('adminUsers.passwordRequired');
    if (modal?.mode === 'create' && form.password.length < 6) errs.password = t('adminUsers.passwordMin');
    if (!form.firstName.trim()) errs.firstName = t('adminUsers.firstNameRequired');
    if (!form.lastName.trim()) errs.lastName = t('adminUsers.lastNameRequired');
    const role = roles.find((r) => r.id === form.roleId);
    const isStaffRole = role && STAFF_ROLE_NAMES.includes(role.name as (typeof STAFF_ROLE_NAMES)[number]);
    const isAdminRole = role?.name === 'admin';
    if (modal?.mode === 'create' && isStaffRole && !isAdminRole && (form.hospitalId === '' || form.hospitalId == null)) {
      errs.hospitalId = t('adminUsers.hospitalRequired');
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (modal?.mode === 'create') {
        const role = roles.find((r) => r.id === form.roleId);
        const isStaff = role?.name === 'staff';
        if (isStaff) {
          await adminApi.createStaff({
            email: form.email,
            password: form.password,
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone || undefined,
            hospitalId: form.hospitalId !== '' ? (form.hospitalId as number) : undefined,
            departmentId: form.departmentId !== '' ? (form.departmentId as number) : undefined,
          });
        } else {
          await adminApi.createUser({
            email: form.email,
            password: form.password,
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone || undefined,
            roleId: form.roleId,
            hospitalId: form.hospitalId !== '' ? (form.hospitalId as number) : undefined,
            departmentId: form.departmentId !== '' ? (form.departmentId as number) : undefined,
          });
        }
      } else if (modal?.mode === 'edit' && modal.id) {
        await adminApi.updateUser(modal.id, {
          firstName: form.firstName,
          lastName: form.lastName,
          roleId: form.roleId,
        });
      }
      setModal(null);
      loadUsers();
    } catch {
      setFormErrors({ email: t('admin.failedToSaveHospital') });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u: User) {
    const isActive = (u as User & { isActive?: boolean }).isActive !== false;
    if (isActive) {
      setDeactivateTarget(u);
      setDeactivateReason('');
    } else {
      try {
        await adminApi.updateUser(u.id, { isActive: true });
        loadUsers();
      } catch (err) {
        console.error('Failed to activate user', err);
      }
    }
  }

  function openDeactivateModal(u: User) {
    setDeactivateTarget(u);
    setDeactivateReason('');
  }

  async function confirmDeactivate() {
    if (!deactivateTarget || !deactivateReason.trim()) return;
    setDeactivating(true);
    try {
      await adminApi.deactivateUser(deactivateTarget.id, { reason: deactivateReason.trim() });
      setDeactivateTarget(null);
      setDeactivateReason('');
      loadUsers();
    } catch (err) {
      console.error('Failed to deactivate user', err);
    } finally {
      setDeactivating(false);
    }
  }

  async function handleDeleteUser(u: User) {
    openDeactivateModal(u);
  }

  function updateField<K extends keyof UserForm>(field: K, value: UserForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'roleId') {
      const role = roles.find((r) => r.id === value);
      const keepAssignment = role && STAFF_ROLE_NAMES.includes(role.name as (typeof STAFF_ROLE_NAMES)[number]);
      if (!keepAssignment) setForm((prev) => ({ ...prev, hospitalId: '', departmentId: '' }));
    }
    if (field === 'hospitalId') setForm((prev) => ({ ...prev, departmentId: '' }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  const selectedRole = roles.find((r) => r.id === form.roleId);
  const isStaffRoleSelected = selectedRole && STAFF_ROLE_NAMES.includes(selectedRole.name as (typeof STAFF_ROLE_NAMES)[number]);
  const totalPages = Math.ceil(total / limit);

  const getRoleName = (u: User) => {
    const r = (u as User & { role?: string | { name?: string } }).role;
    return typeof r === 'string' ? r : (r as { name?: string })?.name ?? '';
  };

  const getStaffHospitalId = (u: User) => (u as User & { staff?: { hospitalId?: number } }).staff?.hospitalId;
  const getStaffDepartmentId = (u: User) => (u as User & { staff?: { departmentId?: number } }).staff?.departmentId;
  const getDoctorHospitalId = (u: User) =>
    (u as User & { doctor?: { doctorDepartments?: { department?: { hospitalId?: number } }[] } }).doctor?.doctorDepartments?.[0]?.department?.hospitalId;
  const getDoctorDepartmentId = (u: User) =>
    (u as User & { doctor?: { doctorDepartments?: { department?: { id?: number } }[] } }).doctor?.doctorDepartments?.[0]?.department?.id;

  const filteredUsers = users.filter((u) => {
    const roleName = getRoleName(u).toLowerCase();
    if (roleName === 'superadmin') return false;
    if (roleTab !== 'all') {
      if (roleTab === 'doctor' && roleName !== 'doctor') return false;
      if (roleTab === 'staff' && roleName !== 'staff') return false;
      if (roleTab === 'admin' && roleName !== 'admin') return false;
      if (roleTab === 'customer' && roleName !== 'customer') return false;
    }
    if (hospitalFilterId !== '') {
      const uHospitalId = getStaffHospitalId(u) ?? getDoctorHospitalId(u);
      if (uHospitalId !== hospitalFilterId) return false;
    }
    if (departmentFilterId !== '') {
      const uDeptId = getStaffDepartmentId(u) ?? getDoctorDepartmentId(u);
      if (uDeptId !== departmentFilterId) return false;
    }
    const isActive = (u as User & { isActive?: boolean }).isActive !== false;
    if (statusFilter === 'active' && !isActive) return false;
    if (statusFilter === 'inactive' && isActive) return false;
    const fullName = [u.firstName, u.lastName, u.email].filter(Boolean).join(' ').toLowerCase();
    if (search.trim() && !fullName.includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading && users.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 w-32 rounded bg-gray-200 animate-pulse" />
          <div className="h-10 w-36 rounded-lg bg-gray-200 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 h-48 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const hasFilters = roleTab !== 'all' || statusFilter !== '' || search.trim() !== '' || hospitalFilterId !== '' || departmentFilterId !== '';

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/admin" className="p-2 -ml-2 rounded-lg hover:bg-gray-100 shrink-0" aria-label={t('common.back')}>
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 truncate">{t('admin.userManagement')}</h1>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          {t('adminDashboard.addUser')}
        </button>
      </div>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </span>
        <input
          type="search"
          placeholder={t('admin.searchUsers')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {(['all', 'admin', 'doctor', 'staff', 'customer'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setRoleTab(tab === 'all' ? 'all' : tab)}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition ${roleTab === tab ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            {tab === 'all' && t('admin.allFilter')}
            {tab === 'admin' && 'Admin'}
            {tab === 'doctor' && t('auth.doctor')}
            {tab === 'staff' && (t('employeeDirectory.employees') || 'Employees')}
            {tab === 'customer' && t('auth.patient')}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 bg-white">
          <option value="">{t('employeeDirectory.status')}</option>
          <option value="active">{t('admin.active')}</option>
          <option value="inactive">{t('admin.inactive')}</option>
        </select>
        <select value={hospitalFilterId === '' ? '' : hospitalFilterId} onChange={(e) => { const v = e.target.value; setHospitalFilterId(v === '' ? '' : Number(v)); setDepartmentFilterId(''); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 bg-white">
          <option value="">{t('admin.hospital')} — {t('common.select')}</option>
          {hospitals.filter((h) => (h as Hospital & { isActive?: boolean }).isActive !== false).map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
        <select value={departmentFilterId === '' ? '' : departmentFilterId} onChange={(e) => { const v = e.target.value; setDepartmentFilterId(v === '' ? '' : Number(v)); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 bg-white">
          <option value="">{t('adminUsers.department')} — {t('common.select')}</option>
          {filterDepartments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        {hasFilters && (
          <button type="button" onClick={() => { setSearch(''); setRoleTab('all'); setStatusFilter(''); setHospitalFilterId(''); setDepartmentFilterId(''); }} className="text-sm text-blue-600 hover:underline">
            {t('employeeDirectory.clearAll')}
          </button>
        )}
      </div>

      {users.length === 0 ? (
        <p className="text-gray-500 py-8">{t('adminUsers.noUsersYet')}</p>
      ) : filteredUsers.length === 0 ? (
        <p className="text-gray-500 py-8">{t('employeeDirectory.noMatch')}</p>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((u) => {
            const isActive = (u as User & { isActive?: boolean }).isActive !== false;
            const roleName = getRoleName(u).toLowerCase();
            const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || '—';
            const roleBadgeClass = roleName === 'admin' || roleName === 'superadmin' ? 'bg-blue-100 text-blue-800' : roleName === 'doctor' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700';
            const roleBadgeLabel = roleName === 'customer' ? t('auth.patient') : roleName === 'doctor' ? t('auth.doctor') : 'Admin';
            const hospitalName = (u as User & { staff?: { hospital?: { name?: string } }; doctor?: { doctorDepartments?: { department?: { hospital?: { name?: string } } }[] } }).staff?.hospital?.name
              ?? (u as User & { doctor?: { doctorDepartments?: { department?: { hospital?: { name?: string } } }[] } }).doctor?.doctorDepartments?.[0]?.department?.hospital?.name
              ?? '—';
            const dateOfBirth = (u as User & { customer?: { dateOfBirth?: string } }).customer?.dateOfBirth ?? '—';
            const position = (u as User & { staff?: { position?: string } }).staff?.position ?? '—';
            return (
              <div key={u.id} className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm relative group">
                <button
                  type="button"
                  onClick={() => navigate(`/admin/users/${u.id}`, { state: { user: u } })}
                  className="absolute inset-0 rounded-xl cursor-pointer z-0 focus:outline-none"
                  aria-label={fullName}
                />
                <div className="relative z-10 flex items-start gap-3 pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm shrink-0 pointer-events-none">
                    {(u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '') || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-gray-900 truncate" title={fullName}>{fullName}</h2>
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold uppercase ${roleBadgeClass}`}>{roleBadgeLabel}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-0.5" title={u.email}>{u.email ?? '—'}</p>
                    <ul className="text-xs text-gray-500 mt-1.5 space-y-0.5">
                      <li><span className="text-gray-400">{t('admin.hospital')}:</span> {hospitalName}</li>
                      <li><span className="text-gray-400">{t('adminUsers.dateOfBirthShort')}:</span> {dateOfBirth}</li>
                      <li><span className="text-gray-400">{t('admin.phone')}:</span> {u.phone ?? '—'}</li>
                      <li><span className="text-gray-400">{t('admin.position')}:</span> {position}</li>
                      <li><span className="text-gray-400">{t('admin.status')}:</span> {isActive ? t('admin.active') : t('admin.inactive')}</li>
                    </ul>
                  </div>
                  <div className="flex items-center gap-2 pointer-events-auto shrink-0">
                    <button
                      type="button"
                      data-action="no-navigate"
                      onClick={(e) => { e.stopPropagation(); toggleActive(u); }}
                      className={`shrink-0 w-11 h-6 rounded-full transition ${isActive ? 'bg-blue-600' : 'bg-gray-200'}`}
                      aria-label={isActive ? t('admin.active') : t('admin.inactive')}
                    >
                      <span className={`block w-5 h-5 rounded-full bg-white shadow mt-0.5 transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                    <button
                      type="button"
                      data-action="no-navigate"
                      onClick={(e) => { e.stopPropagation(); openDeactivateModal(u); }}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                      aria-label={t('common.delete')}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={openCreate}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 z-30"
        aria-label={t('adminDashboard.addUser')}
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
      </button>

      {users.length > 0 && (
        <p className="text-center text-sm text-gray-500">
          {t('employeeDirectory.showAllEmployees', { count: String(total) })}
        </p>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50 transition">Prev</button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50 transition">Next</button>
        </div>
      )}

      {deactivateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => !deactivating && setDeactivateTarget(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">{t('adminUsers.deactivateTitle')}</h3>
            <p className="text-sm text-gray-600">
              {t('adminUsers.deactivateMessage', { name: [deactivateTarget.firstName, deactivateTarget.lastName].filter(Boolean).join(' ') || deactivateTarget.email })}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.deactivateReasonLabel')} *</label>
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
              <button type="button" onClick={() => setDeactivateTarget(null)} disabled={deactivating} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">{t('common.cancel')}</button>
              <button type="button" onClick={confirmDeactivate} disabled={deactivating || !deactivateReason.trim()} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                {deactivating ? t('common.loading') : t('adminUsers.deactivateConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-5">
              <h3 className="text-lg font-semibold text-gray-900">{modal.mode === 'create' ? t('adminUsers.createUser') : t('adminUsers.editUser')}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.firstName')}</label>
                    <input value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} className={`w-full rounded-lg border shadow-sm text-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.firstName ? 'border-red-400' : 'border-gray-300'}`} />
                    {formErrors.firstName && <p className="text-red-600 text-xs mt-1">{formErrors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.lastName')}</label>
                    <input value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} className={`w-full rounded-lg border shadow-sm text-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.lastName ? 'border-red-400' : 'border-gray-300'}`} />
                    {formErrors.lastName && <p className="text-red-600 text-xs mt-1">{formErrors.lastName}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.email')}</label>
                  <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} disabled={modal.mode === 'edit'} className={`w-full rounded-lg border shadow-sm text-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 ${formErrors.email ? 'border-red-400' : 'border-gray-300'}`} />
                  {formErrors.email && <p className="text-red-600 text-xs mt-1">{formErrors.email}</p>}
                </div>
                {modal.mode === 'create' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.password')}</label>
                    <input type="password" value={form.password} onChange={(e) => updateField('password', e.target.value)} placeholder="••••••••" className={`w-full rounded-lg border shadow-sm text-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.password ? 'border-red-400' : 'border-gray-300'}`} />
                    {formErrors.password && <p className="text-red-600 text-xs mt-1">{formErrors.password}</p>}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.phone')}</label>
                  <input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} className="w-full rounded-lg border border-gray-300 shadow-sm text-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.role')}</label>
                  <select value={form.roleId} onChange={(e) => updateField('roleId', Number(e.target.value))} className="w-full rounded-lg border border-gray-300 shadow-sm text-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500 capitalize">
                    {modal.mode === 'create'
                      ? roles.filter((r) => STAFF_ROLE_NAMES.includes(r.name as (typeof STAFF_ROLE_NAMES)[number])).map((r) => (
                          <option key={r.id} value={r.id}>{r.name === 'admin' ? t('adminUsers.roleAdministrator') : r.name === 'doctor' ? t('adminUsers.rolePhysician') : r.name === 'staff' ? t('adminUsers.roleStaffMember') : r.name}</option>
                        ))
                      : roles.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                  </select>
                </div>

                {isStaffRoleSelected && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.hospital')}</label>
                      <select value={form.hospitalId} onChange={(e) => updateField('hospitalId', e.target.value === '' ? '' : Number(e.target.value))} className={`w-full rounded-lg border shadow-sm text-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.hospitalId ? 'border-red-400' : 'border-gray-300'}`}>
                        <option value="">— {t('adminUsers.selectHospital')} —</option>
                        {hospitals.filter((h) => h.isActive !== false).map((h) => (
                          <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                      </select>
                      {formErrors.hospitalId && <p className="text-red-600 text-xs mt-1">{formErrors.hospitalId}</p>}
                    </div>
                    {form.hospitalId !== '' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.department')}</label>
                        <select value={form.departmentId} onChange={(e) => updateField('departmentId', e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-lg border border-gray-300 shadow-sm text-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500">
                          <option value="">— {t('adminUsers.selectDepartment')} —</option>
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}

                <p className="text-xs text-gray-500">{t('adminUsers.permissionsByRole')} <Link to="/admin/roles" className="text-blue-600 hover:underline">{t('adminUsers.rolesAndPermissions')}</Link>.</p>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition">{t('common.cancel')}</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50">
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
