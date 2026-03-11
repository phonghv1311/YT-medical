import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 50;
  const [search, setSearch] = useState('');
  const [roleTab, setRoleTab] = useState<RoleTab>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>(''); // '', 'active', 'inactive'

  const [roles, setRoles] = useState<Role[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; id?: number } | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof UserForm, string>>>({});
  const [saving, setSaving] = useState(false);

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
    }).catch(() => {});
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    if (!modal) return;
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    adminApi.getHospitals({ signal }).then(({ data }) => {
      if (signal.aborted) return;
      const list = data?.data ?? data;
      setHospitals(Array.isArray(list) ? list : []);
    }).catch(() => {});
    return () => ctrl.abort();
  }, [modal]);

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

  function openCreate() {
    const staffRoles = roles.filter((r) => STAFF_ROLE_NAMES.includes(r.name as (typeof STAFF_ROLE_NAMES)[number]));
    const defaultRoleId = staffRoles[0]?.id ?? roles[0]?.id ?? 2;
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
    if (modal?.mode === 'create' && isStaffRole && (form.hospitalId === '' || form.hospitalId == null)) {
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
    try {
      await adminApi.updateUser(u.id, { isActive: !(u as User & { isActive?: boolean }).isActive });
      loadUsers();
    } catch (err) {
      console.error('Failed to toggle user', err);
    }
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

  const filteredUsers = users.filter((u) => {
    const roleName = getRoleName(u).toLowerCase();
    if (roleTab !== 'all') {
      if (roleTab === 'doctor' && roleName !== 'doctor') return false;
      if (roleTab === 'staff' && roleName !== 'staff') return false;
      if (roleTab === 'admin' && !['admin', 'superadmin'].includes(roleName)) return false;
      if (roleTab === 'customer' && roleName !== 'customer') return false;
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

  const hasFilters = roleTab !== 'all' || statusFilter !== '' || search.trim() !== '';

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600" aria-hidden>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('employeeDirectory.title')}</h1>
      </div>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </span>
        <input
          type="search"
          placeholder={t('employeeDirectory.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <button onClick={openCreate} className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
        {t('employeeDirectory.addEmployee')}
      </button>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {(['all', 'doctor', 'staff', 'admin', 'customer'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setRoleTab(tab)}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition ${roleTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {tab === 'all' && t('employeeDirectory.allStaff')}
            {tab === 'doctor' && t('employeeDirectory.doctors')}
            {tab === 'staff' && t('employeeDirectory.nurses')}
            {tab === 'admin' && t('employeeDirectory.administration')}
            {tab === 'customer' && t('adminUsers.role')}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 bg-white">
          <option value="">{t('employeeDirectory.status')}</option>
          <option value="active">{t('admin.active')}</option>
          <option value="inactive">{t('admin.inactive')}</option>
        </select>
        {hasFilters && (
          <button type="button" onClick={() => { setSearch(''); setRoleTab('all'); setStatusFilter(''); }} className="text-sm text-blue-600 hover:underline">
            {t('employeeDirectory.clearAll')}
          </button>
        )}
      </div>

      {users.length === 0 ? (
        <p className="text-gray-500 py-8">{t('adminUsers.noUsersYet')}</p>
      ) : filteredUsers.length === 0 ? (
        <p className="text-gray-500 py-8">{t('employeeDirectory.noMatch')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredUsers.map((u) => {
            const isActive = (u as User & { isActive?: boolean }).isActive !== false;
            const roleLabel = getRoleName(u) || '—';
            const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || '—';
            return (
              <div key={u.id} className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <Link to={`/admin/users/${u.id}`} state={{ user: u }} className="block p-4 flex-1 flex flex-col min-w-0 hover:bg-gray-50/50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-semibold text-sm shrink-0">
                      {(u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '') || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold text-gray-900 truncate" title={fullName}>{fullName}</h2>
                      <p className="text-sm text-gray-500 truncate" title={u.email}>{u.email}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">#{String(u.id).padStart(5, '0')}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold uppercase bg-indigo-100 text-indigo-700 capitalize">{roleLabel}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold uppercase ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {isActive ? t('employeeDirectory.onDuty') : t('employeeDirectory.offShift')}
                    </span>
                  </div>
                </Link>
                <div className="px-4 pb-4 flex gap-2" onClick={(e) => e.preventDefault()}>
                  <button type="button" onClick={(e) => { e.stopPropagation(); openEdit(u); }} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition">
                    {t('common.edit')}
                  </button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); toggleActive(u); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition min-w-0 sm:min-w-[80px] ${isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                    {isActive ? t('adminUsers.deactivate') : t('adminUsers.activate')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
