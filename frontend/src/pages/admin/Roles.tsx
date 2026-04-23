import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminApi } from '../../api/admin';
import { ListRowSkeleton } from '../../components/skeletons';

function permissionLabel(name: string, t: (key: string) => string): string {
  const key = `permissions.${name}`;
  const out = t(key);
  return out !== key ? out : name.replace(/_/g, ' ');
}

interface Permission {
  id: number;
  name: string;
  description?: string;
}

interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  doctor: 'roleManagement.doctorRoleDescription',
  admin: 'roleManagement.adminRoleDescription',
  superadmin: 'roleManagement.adminRoleDescription',
  customer: 'roleManagement.patientRoleDescription',
  staff: 'roleManagement.staffRoleDescription',
};

function roleIconClass(name: string): string {
  const n = name.toLowerCase();
  if (n === 'superadmin' || n === 'admin') return 'bg-blue-100 text-blue-700';
  if (n === 'doctor') return 'bg-amber-100 text-amber-700';
  if (n === 'customer') return 'bg-gray-100 text-gray-600';
  return 'bg-violet-100 text-violet-700';
}

export default function AdminRoles() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<number[]>([]);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Create role/position modal state ("Chức vụ").
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createRoleName, setCreateRoleName] = useState('');
  const [createSelectedPerms, setCreateSelectedPerms] = useState<number[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [deletingRoleId, setDeletingRoleId] = useState<number | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    adminApi.getRoles({ signal })
      .then(({ data }) => {
        if (signal.aborted) return;
        const payload = data?.data ?? data;
        if (payload?.roles) {
          setRoles(payload.roles);
          setAllPermissions(payload.permissions ?? []);
          if (!selectedRoleId && payload.roles.length > 0) setSelectedRoleId(payload.roles[0].id);
        } else if (Array.isArray(payload)) {
          setRoles(payload);
          const perms = new Map<number, Permission>();
          payload.forEach((r: Role) => r.permissions?.forEach((p) => perms.set(p.id, p)));
          setAllPermissions(Array.from(perms.values()));
          if (!selectedRoleId && payload.length > 0) setSelectedRoleId((payload[0] as Role).id);
        }
      })
      .catch((err) => { if (!signal.aborted) console.error('Failed to load roles', err); })
      .finally(() => { if (!signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, []);

  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null;
  const filteredRoles = search.trim()
    ? roles.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    : roles;

  useEffect(() => {
    if (selectedRole) {
      setSelectedPerms(selectedRole.permissions.map((p) => p.id));
      setRoleName(selectedRole.name);
      setRoleDescription(t(ROLE_DESCRIPTIONS[selectedRole.name] ?? 'roleManagement.roleDescriptionDefault'));
    }
  }, [selectedRole?.id, selectedRole?.name, selectedRole?.permissions, t]);

  function togglePerm(permId: number) {
    setSelectedPerms((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId],
    );
  }

  function toggleCreatePerm(permId: number) {
    setCreateSelectedPerms((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId],
    );
  }

  function openEdit(role: Role) {
    setSelectedRoleId(role.id);
    setRoleName(role.name);
    setRoleDescription(t(ROLE_DESCRIPTIONS[role.name] ?? 'roleManagement.roleDescriptionDefault'));
    setSelectedPerms(role.permissions.map((p) => p.id));
    setEditModalOpen(true);
  }

  async function handleSave() {
    if (selectedRoleId == null) return;
    setSaving(true);
    try {
      await adminApi.updateRolePermissions(selectedRoleId, selectedPerms);
      setRoles((prev) =>
        prev.map((r) =>
          r.id === selectedRoleId
            ? { ...r, permissions: allPermissions.filter((p) => selectedPerms.includes(p.id)) }
            : r,
        ),
      );
      setEditModalOpen(false);
    } catch (err) {
      console.error('Failed to save permissions', err);
    } finally {
      setSaving(false);
    }
  }

  function openCreate() {
    setCreateModalOpen(true);
    setCreateRoleName('');
    setCreateSelectedPerms([]);
    setCreateError(null);
  }

  async function handleCreate() {
    const trimmed = createRoleName.trim();
    if (!trimmed) {
      setCreateError('Tên chức vụ là bắt buộc');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const res = await adminApi.createRole({ name: trimmed, permissionIds: createSelectedPerms });
      const payload = (res as any)?.data?.data ?? (res as any)?.data ?? res;
      // Backend returns Role object directly.
      const createdRole = (payload as any)?.role ?? payload;
      if (createdRole && typeof createdRole === 'object') {
        setRoles((prev) => [...prev, createdRole as Role]);
        setSelectedRoleId((createdRole as Role).id);
      }
      setCreateModalOpen(false);
    } catch (err) {
      console.error('Failed to create role', err);
      const msg = (err as any)?.response?.data?.message;
      setCreateError(Array.isArray(msg) ? msg.join('. ') : typeof msg === 'string' ? msg : 'Failed to create');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(role: Role) {
    const builtIn = ['superadmin', 'admin', 'doctor', 'staff', 'customer'];
    if (builtIn.includes(role.name.toLowerCase())) return;

    const ok = window.confirm(t('admin.deleteThisRole'));
    if (!ok) return;

    setDeletingRoleId(role.id);
    try {
      await adminApi.deleteRole(role.id);
      setRoles((prev) => prev.filter((r) => r.id !== role.id));
      if (selectedRoleId === role.id) setSelectedRoleId(null);
      setEditModalOpen(false);
    } catch (err) {
      console.error('Failed to delete role', err);
    } finally {
      setDeletingRoleId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <ListRowSkeleton lines={2} />
        <ListRowSkeleton lines={4} />
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('roleManagement.title')}</h1>
            <p className="text-sm text-gray-500">{t('roleManagement.subtitle')}</p>
          </div>
        </div>
        <p className="text-gray-500 py-8">{t('roleManagement.noRoles')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 shrink-0" aria-label={t('common.back')}>
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900 flex-1">{t('roleManagement.title')}</h1>
        <button
          type="button"
          onClick={openCreate}
          className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 shrink-0"
          aria-label={t('roleManagement.addRole')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </span>
        <input
          type="search"
          placeholder={t('admin.searchRole')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="space-y-3">
        {filteredRoles.map((role) => (
          <div key={role.id} className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
            <div className="flex gap-3">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${roleIconClass(role.name)}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold text-gray-900 capitalize">{role.name}</h2>
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    {role.permissions?.length ?? 0} {t('roleManagement.permissions')}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{t(ROLE_DESCRIPTIONS[role.name] ?? 'roleManagement.roleDescriptionDefault')}</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => openEdit(role)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100" aria-label={t('common.edit')}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(role)}
                    disabled={['superadmin', 'admin', 'doctor', 'staff', 'customer'].includes(role.name.toLowerCase()) || deletingRoleId === role.id}
                    className={`p-2 rounded-lg text-gray-500 hover:bg-gray-100 ${['superadmin', 'admin', 'doctor', 'staff', 'customer'].includes(role.name.toLowerCase())
                        ? 'opacity-40 cursor-not-allowed'
                        : ''
                      } ${deletingRoleId === role.id ? 'opacity-70' : ''}`}
                    aria-label={t('common.delete')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 z-30"
        aria-label={t('roleManagement.addRole')}
        onClick={openCreate}
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
      </button>

      {createModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={() => setCreateModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
                aria-label={t('common.back')}
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 className="text-lg font-semibold text-gray-900 flex-1">Thêm chức vụ</h3>
            </div>

            <div className="space-y-4">
              {createError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{createError}</p>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.roleName')}</label>
                <input
                  value={createRoleName}
                  onChange={(e) => setCreateRoleName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm"
                  placeholder="e.g. Director"
                />
              </div>

              <h4 className="font-semibold text-gray-900">{t('admin.permissionsSection')}</h4>
              <div className="grid grid-cols-2 gap-2">
                {allPermissions.map((perm) => (
                  <label
                    key={perm.id}
                    className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={createSelectedPerms.includes(perm.id)}
                      onChange={() => toggleCreatePerm(perm.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-900 truncate">{permissionLabel(perm.name, t)}</span>
                  </label>
                ))}
              </div>

              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={creating}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? t('common.loading') : t('settings.saveChanges')}
              </button>
            </div>
          </div>
        </div>
      )}

      {editModalOpen && selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setEditModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <button type="button" onClick={() => setEditModalOpen(false)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <h3 className="text-lg font-semibold text-gray-900">{t('admin.editRole')}</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.roleName')}</label>
                <input value={roleName} onChange={(e) => setRoleName(e.target.value)} className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.description')}</label>
                <textarea rows={3} value={roleDescription} onChange={(e) => setRoleDescription(e.target.value)} className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm" readOnly />
              </div>
              <h4 className="font-semibold text-gray-900">{t('admin.permissionsSection')}</h4>
              <div className="grid grid-cols-2 gap-2">
                {allPermissions.map((perm) => (
                  <label key={perm.id} className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={selectedPerms.includes(perm.id)} onChange={() => togglePerm(perm.id)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm font-medium text-gray-900 truncate">{permissionLabel(perm.name, t)}</span>
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={() => void handleDelete(selectedRole)}
                disabled={deletingRoleId === selectedRole.id || ['superadmin', 'admin', 'doctor', 'staff', 'customer'].includes(selectedRole.name.toLowerCase())}
                className="w-full text-center text-sm text-red-600 hover:underline flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                {t('admin.deleteThisRole')}
              </button>
              <button type="button" onClick={handleSave} disabled={saving} className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50">
                {saving ? t('common.loading') : t('settings.saveChanges')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
