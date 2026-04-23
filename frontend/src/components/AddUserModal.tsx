import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { adminApi } from '../api/admin';
import type { Department } from '../types';

export type AddUserModalMode = 'doctor' | 'staff';

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** When not provided, modal shows a role selector (Doctor / Staff) and user picks one. */
  mode?: AddUserModalMode;
  fixedHospitalId: number;
  fixedDepartments: Department[];
  onSuccess: () => void;
}

const emptyForm = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  departmentId: '',
  jobTitle: '',
};

export default function AddUserModal({
  open,
  onClose,
  title,
  mode,
  fixedHospitalId,
  fixedDepartments,
  onSuccess,
}: AddUserModalProps) {
  const { t } = useLanguage();
  const [form, setForm] = useState(emptyForm);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedMode, setSelectedMode] = useState<AddUserModalMode>('doctor');
  const effectiveMode = mode ?? selectedMode;

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    setError(null);
    if (mode == null) setSelectedMode('doctor');
    const ctrl = new AbortController();
    adminApi.getRoles({ signal: ctrl.signal }).then(({ data }) => {
      const raw = data?.data ?? data;
      const list = raw?.roles ?? (Array.isArray(raw) ? raw : []);
      setRoles(Array.isArray(list) ? list : []);
    }).catch(() => { });
    return () => ctrl.abort();
  }, [open]);

  const doctorRoleId = roles.find((r) => r.name === 'doctor')?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.email.trim() || !form.password || form.password.length < 6 || !form.firstName.trim() || !form.lastName.trim()) {
      setError(t('adminUsers.emailRequired') || 'Please fill required fields and use password at least 6 characters.');
      return;
    }
    if (effectiveMode === 'doctor' && !doctorRoleId) {
      setError('Doctor role not found.');
      return;
    }
    setSaving(true);
    try {
      if (effectiveMode === 'doctor') {
        await adminApi.createUser({
          email: form.email.trim(),
          password: form.password,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim() || undefined,
          roleId: doctorRoleId!,
          departmentId: form.departmentId ? parseInt(form.departmentId, 10) : undefined,
        });
      } else {
        await adminApi.createStaff({
          email: form.email.trim(),
          password: form.password,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim() || undefined,
          hospitalId: fixedHospitalId,
          departmentId: form.departmentId ? parseInt(form.departmentId, 10) : undefined,
          jobTitle: form.jobTitle.trim() || undefined,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError((err as Error)?.message || t('admin.failedToSaveHospital'));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={() => !saving && onClose()}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        {mode == null && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.role')}</label>
            <select value={selectedMode} onChange={(e) => setSelectedMode(e.target.value as AddUserModalMode)} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm">
              <option value="doctor">{t('auth.doctor')}</option>
              <option value="staff">{t('employeeDirectory.employees') || 'Staff'}</option>
            </select>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.email')}</label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.password')}</label>
            <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="••••••••" minLength={6} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.phone')}</label>
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.department')}</label>
            <select value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm">
              <option value="">— {t('adminUsers.selectDepartment')} —</option>
              {fixedDepartments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          {effectiveMode === 'staff' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.position')}</label>
              <input value={form.jobTitle} onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))} placeholder="Job title" className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{saving ? t('admin.saving') : t('common.save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
