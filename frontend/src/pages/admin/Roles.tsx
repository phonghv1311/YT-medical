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

function PermissionIcon({ name }: { name: string }) {
  const iconClass = 'w-5 h-5 text-gray-500';
  if (name.includes('user')) return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
  if (name.includes('hospital') || name.includes('department')) return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
  if (name.includes('schedule') || name.includes('appointment')) return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
  if (name.includes('role')) return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
  if (name.includes('report') || name.includes('log')) return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
  if (name.includes('record') || name.includes('prescrib')) return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
  return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
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

const ROLE_TITLES: Record<string, string> = {
  doctor: 'roleManagement.doctorRole',
  admin: 'roleManagement.adminRole',
  superadmin: 'roleManagement.adminRole',
  customer: 'roleManagement.patientRole',
  staff: 'roleManagement.staffRole',
};

export default function AdminRoles() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

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

  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? roles[0];

  useEffect(() => {
    if (selectedRole) setSelectedPerms(selectedRole.permissions.map((p) => p.id));
  }, [selectedRole?.id]);

  function togglePerm(permId: number) {
    setSelectedPerms((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId],
    );
  }

  function selectAll() {
    const allSelected = selectedPerms.length === allPermissions.length;
    setSelectedPerms(allSelected ? [] : allPermissions.map((p) => p.id));
  }

  function handleReset() {
    if (selectedRole) setSelectedPerms(selectedRole.permissions.map((p) => p.id));
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
    } catch (err) {
      console.error('Failed to save permissions', err);
    } finally {
      setSaving(false);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 shrink-0" aria-label={t('common.back')}>
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{t('roleManagement.title')}</h1>
            <p className="text-sm text-gray-500">{t('roleManagement.subtitle')}</p>
          </div>
        </div>
        <button type="button" className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shrink-0" aria-label={t('roleManagement.addRole')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {roles.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => setSelectedRoleId(role.id)}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${selectedRoleId === role.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {role.name}
          </button>
        ))}
      </div>

      {selectedRole && (
        <>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-gray-900 capitalize">{t(ROLE_TITLES[selectedRole.name] ?? 'roleManagement.roleDescriptionDefault')}</h2>
              <p className="text-sm text-gray-600 mt-1">{t(ROLE_DESCRIPTIONS[selectedRole.name] ?? 'roleManagement.roleDescriptionDefault')}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900">{t('roleManagement.permissions')}</h3>
              <button type="button" onClick={selectAll} className="text-sm text-blue-600 font-medium hover:underline">
                {t('roleManagement.selectAll')}
              </button>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
              {allPermissions.map((perm) => (
                <label
                  key={perm.id}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                    <PermissionIcon name={perm.name} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{permissionLabel(perm.name, t)}</p>
                    {perm.description && <p className="text-sm text-gray-500 mt-0.5">{perm.description}</p>}
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedPerms.includes(perm.id)}
                    onChange={() => togglePerm(perm.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5 shrink-0"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? t('admin.saving') : t('roleManagement.saveChanges')}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              {t('roleManagement.reset')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
