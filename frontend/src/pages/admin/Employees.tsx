import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import type { Staff, Hospital, Department } from '../../types';
import { CardSkeleton } from '../../components/skeletons';

interface EmployeeForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  hospitalId: string;
  departmentId: string;
  jobTitle: string;
  startDate: string;
  weeklyHours: string;
  contractUrl: string;
  profilePhotoUrl: string;
  resumeUrl: string;
}

const emptyForm: EmployeeForm = {
  email: '', password: '', firstName: '', lastName: '', phone: '',
  hospitalId: '', departmentId: '', jobTitle: '', startDate: '', weeklyHours: '',
  contractUrl: '', profilePhotoUrl: '', resumeUrl: '',
};

export default function AdminEmployees() {
  const { t } = useLanguage();
  const { confirm } = useConfirm();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState<string>('');
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; id?: number } | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof EmployeeForm, string>>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<'profile' | 'contract' | 'resume' | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    adminApi.getHospitals({ signal })
      .then(({ data }) => {
        if (signal.aborted) return;
        const list = data?.data ?? data;
        setHospitals(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    setLoading(true);
    const hospitalId = hospitalFilter ? parseInt(hospitalFilter, 10) : undefined;
    adminApi.getStaff(
      { hospitalId: Number.isNaN(hospitalId as number) ? undefined : hospitalId, limit: 200 },
      { signal },
    )
      .then((r) => {
        if (signal.aborted) return;
        const res = r.data?.staff ?? r.data?.data ?? r.data;
        setStaff(Array.isArray(res) ? res : []);
      })
      .catch(() => {
        if (!signal.aborted) setStaff([]);
      })
      .finally(() => {
        if (!signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [hospitalFilter]);

  useEffect(() => {
    if (!form.hospitalId) {
      setDepartments([]);
      setForm((f) => ({ ...f, departmentId: '' }));
      return;
    }
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    adminApi.getDepartments(parseInt(form.hospitalId, 10), { signal }).then(({ data }) => {
      if (signal.aborted) return;
      const list = data?.data ?? data;
      setDepartments(Array.isArray(list) ? list : []);
    }).catch(() => { if (!signal.aborted) setDepartments([]); });
    return () => ctrl.abort();
  }, [form.hospitalId]);

  const filteredStaff = search.trim()
    ? staff.filter((s) => {
      const name = `${(s.user as { firstName?: string })?.firstName ?? ''} ${(s.user as { lastName?: string })?.lastName ?? ''}`.toLowerCase();
      const job = (s.jobTitle ?? s.position ?? '').toLowerCase();
      return name.includes(search.toLowerCase()) || job.includes(search.toLowerCase());
    })
    : staff;

  function openCreate() {
    setForm(emptyForm);
    setFormErrors({});
    setUploadError(null);
    setModal({ mode: 'create' });
  }

  async function handleFileUpload(field: 'profile' | 'contract' | 'resume', file: File | null) {
    if (!file) return;
    setUploadError(null);
    setUploadingField(field);
    try {
      const { data } = await adminApi.uploadStaffFile(file);
      const url = (data as { url?: string })?.url ?? (data as { data?: { url?: string } })?.data?.url ?? '';
      if (field === 'profile') setForm((f) => ({ ...f, profilePhotoUrl: url }));
      if (field === 'contract') setForm((f) => ({ ...f, contractUrl: url }));
      if (field === 'resume') setForm((f) => ({ ...f, resumeUrl: url }));
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Upload failed';
      setUploadError(message);
    } finally {
      setUploadingField(null);
    }
  }

  function openEdit(s: Staff) {
    const u = s.user as { firstName?: string; lastName?: string; email?: string; phone?: string } | undefined;
    setForm({
      email: u?.email ?? '',
      password: '',
      firstName: u?.firstName ?? '',
      lastName: u?.lastName ?? '',
      phone: u?.phone ?? '',
      hospitalId: s.hospitalId != null ? String(s.hospitalId) : '',
      departmentId: s.departmentId != null ? String(s.departmentId) : '',
      jobTitle: s.jobTitle ?? s.position ?? '',
      startDate: s.startDate ?? '',
      weeklyHours: s.weeklyHours != null ? String(s.weeklyHours) : '',
      contractUrl: s.contractUrl ?? '',
      profilePhotoUrl: s.profilePhotoUrl ?? '',
      resumeUrl: s.resumeUrl ?? '',
    });
    setFormErrors({});
    setUploadError(null);
    setModal({ mode: 'edit', id: s.id });
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof EmployeeForm, string>> = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (modal?.mode === 'create') {
      if (!form.email.trim()) errs.email = 'Email is required';
      if (!form.password || form.password.length < 6) errs.password = 'Password (min 6 characters) is required';
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
        const { data } = await adminApi.createStaff({
          email: form.email.trim(),
          password: form.password,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim() || undefined,
          hospitalId: form.hospitalId ? parseInt(form.hospitalId, 10) : undefined,
          departmentId: form.departmentId ? parseInt(form.departmentId, 10) : undefined,
          jobTitle: form.jobTitle.trim() || undefined,
          position: form.jobTitle.trim() || undefined,
          startDate: form.startDate.trim() || undefined,
          weeklyHours: form.weeklyHours ? parseFloat(form.weeklyHours) : undefined,
          contractUrl: form.contractUrl.trim() || undefined,
          profilePhotoUrl: form.profilePhotoUrl.trim() || undefined,
          resumeUrl: form.resumeUrl.trim() || undefined,
        });
        const created = data?.data ?? data;
        if (created && typeof created === 'object' && 'id' in created) setStaff((prev) => [...prev, created as Staff]);
      } else if (modal?.mode === 'edit' && modal.id) {
        await adminApi.updateStaff(modal.id, {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim() || undefined,
          hospitalId: form.hospitalId ? parseInt(form.hospitalId, 10) : undefined,
          departmentId: form.departmentId ? parseInt(form.departmentId, 10) : undefined,
          jobTitle: form.jobTitle.trim() || undefined,
          position: form.jobTitle.trim() || undefined,
          startDate: form.startDate.trim() || undefined,
          weeklyHours: form.weeklyHours ? parseFloat(form.weeklyHours) : undefined,
          contractUrl: form.contractUrl.trim() || undefined,
          profilePhotoUrl: form.profilePhotoUrl.trim() || undefined,
          resumeUrl: form.resumeUrl.trim() || undefined,
        });
        setStaff((prev) => prev.map((s) => (s.id === modal.id ? { ...s, ...form, user: s.user } : s)));
      }
      setModal(null);
    } catch {
      setFormErrors({ email: t('admin.failedToSaveHospital') });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(s: Staff) {
    const ok = await confirm({
      title: 'Delete employee',
      message: `Deactivate or remove ${(s.user as { firstName?: string })?.firstName} ${(s.user as { lastName?: string })?.lastName}?`,
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await adminApi.deleteStaff(s.id);
      setStaff((prev) => prev.filter((x) => x.id !== s.id));
    } catch (err) {
      console.error('Failed to delete staff', err);
    }
  }

  if (loading && staff.length === 0) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-lg bg-gray-200 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} lines={4} showImage imageHeight="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600" aria-hidden>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Employees</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="search"
            placeholder="Search by name or job..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={hospitalFilter}
          onChange={(e) => setHospitalFilter(e.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All hospitals</option>
          {hospitals.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
      </div>

      <button type="button" onClick={openCreate} className="w-full py-3 rounded-xl bg-violet-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-violet-700 transition">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        + Add employee
      </button>

      {filteredStaff.length === 0 ? (
        <p className="text-gray-500 py-8">No employees yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredStaff.map((s) => (
            <div key={s.id} className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <Link to={`/admin/employees/${s.id}`} className="block p-4 flex-1 flex flex-col min-w-0 hover:bg-gray-50/50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-semibold text-sm shrink-0">
                    {(s.user as { firstName?: string })?.firstName?.slice(0, 1)}{(s.user as { lastName?: string })?.lastName?.slice(0, 1) || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-gray-900 truncate">{(s.user as { firstName?: string })?.firstName} {(s.user as { lastName?: string })?.lastName}</h2>
                    <p className="text-sm text-gray-500 truncate">{s.jobTitle ?? s.position ?? '—'}</p>
                    {s.department && <p className="text-xs text-gray-400">{s.department.name}</p>}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-700">Staff</span>
                </div>
              </Link>
              <div className="px-4 pb-4 flex gap-2">
                <button type="button" onClick={() => openEdit(s)} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition">
                  {t('common.edit')}
                </button>
                <Link to={`/admin/employees/${s.id}`} className="flex-1 py-2 rounded-lg bg-violet-50 text-violet-600 text-sm font-medium hover:bg-violet-100 transition text-center">
                  {t('common.view')}
                </Link>
                <button type="button" onClick={() => handleDelete(s)} className="py-2 px-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition">
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{modal.mode === 'create' ? 'Add employee' : 'Edit employee'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {modal.mode === 'create' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={`w-full rounded-lg border px-4 py-2 text-sm ${formErrors.email ? 'border-red-400' : 'border-gray-300'}`} />
                    {formErrors.email && <p className="text-red-600 text-xs mt-1">{formErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className={`w-full rounded-lg border px-4 py-2 text-sm ${formErrors.password ? 'border-red-400' : 'border-gray-300'}`} />
                    {formErrors.password && <p className="text-red-600 text-xs mt-1">{formErrors.password}</p>}
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                  <input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className={`w-full rounded-lg border px-4 py-2 text-sm ${formErrors.firstName ? 'border-red-400' : 'border-gray-300'}`} />
                  {formErrors.firstName && <p className="text-red-600 text-xs mt-1">{formErrors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                  <input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className={`w-full rounded-lg border px-4 py-2 text-sm ${formErrors.lastName ? 'border-red-400' : 'border-gray-300'}`} />
                  {formErrors.lastName && <p className="text-red-600 text-xs mt-1">{formErrors.lastName}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
                <select value={form.hospitalId} onChange={(e) => setForm((f) => ({ ...f, hospitalId: e.target.value, departmentId: '' }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm">
                  <option value="">— Select —</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" disabled={!form.hospitalId}>
                  <option value="">— Select —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job title</label>
                <input value={form.jobTitle} onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))} placeholder="e.g. Nurse, Administrator" className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weekly hours</label>
                <input type="number" min={0} step={0.5} value={form.weeklyHours} onChange={(e) => setForm((f) => ({ ...f, weeklyHours: e.target.value }))} placeholder="e.g. 40" className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profile photo</label>
                <p className="text-xs text-gray-500 mb-1">Image (JPEG, PNG, GIF, WebP). Max 10MB.</p>
                {form.profilePhotoUrl && (
                  <div className="mb-2 flex items-center gap-2">
                    {form.profilePhotoUrl.match(/\.(jpe?g|png|gif|webp)$/i) ? (
                      <img src={form.profilePhotoUrl} alt="Profile" className="h-12 w-12 rounded object-cover border border-gray-200" />
                    ) : (
                      <a href={form.profilePhotoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">Current file</a>
                    )}
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  disabled={uploadingField === 'profile'}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload('profile', f); e.target.value = ''; }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-violet-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-violet-700"
                />
                {uploadingField === 'profile' && <p className="text-xs text-gray-500 mt-1">Uploading…</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contract</label>
                <p className="text-xs text-gray-500 mb-1">PDF, CSV, or Excel. Max 10MB.</p>
                {form.contractUrl && (
                  <p className="mb-2"><a href={form.contractUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">Current file</a></p>
                )}
                <input
                  type="file"
                  accept=".pdf,.csv,.xls,.xlsx,application/pdf,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  disabled={uploadingField === 'contract'}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload('contract', f); e.target.value = ''; }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-violet-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-violet-700"
                />
                {uploadingField === 'contract' && <p className="text-xs text-gray-500 mt-1">Uploading…</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resume</label>
                <p className="text-xs text-gray-500 mb-1">PDF, CSV, or Excel. Max 10MB.</p>
                {form.resumeUrl && (
                  <p className="mb-2"><a href={form.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">Current file</a></p>
                )}
                <input
                  type="file"
                  accept=".pdf,.csv,.xls,.xlsx,application/pdf,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  disabled={uploadingField === 'resume'}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload('resume', f); e.target.value = ''; }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-violet-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-violet-700"
                />
                {uploadingField === 'resume' && <p className="text-xs text-gray-500 mt-1">Uploading…</p>}
              </div>
              {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">{saving ? t('admin.saving') : t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
