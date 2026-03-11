import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import type { Staff, Hospital, Department } from '../../types';

export default function AdminEmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { confirm } = useConfirm();
  const staffId = id ? parseInt(id, 10) : NaN;

  const [staff, setStaff] = useState<Staff | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<'profile' | 'contract' | 'resume' | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', hospitalId: '', departmentId: '',
    jobTitle: '', startDate: '', weeklyHours: '', contractUrl: '', profilePhotoUrl: '', resumeUrl: '',
  });

  useEffect(() => {
    if (!id || Number.isNaN(staffId)) {
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    adminApi.getStaffOne(staffId, { signal })
      .then((r) => {
        if (signal.aborted) return;
        const data = r.data?.data ?? r.data;
        setStaff((data as Staff) ?? null);
        if (data && typeof data === 'object') {
          const s = data as Staff;
          const u = s.user as { firstName?: string; lastName?: string; phone?: string } | undefined;
          setForm({
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
        }
      })
      .catch(() => { if (!signal.aborted) setStaff(null); })
      .finally(() => { if (!signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [id, staffId]);

  useEffect(() => {
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    adminApi.getHospitals({ signal }).then(({ data }) => {
      if (signal.aborted) return;
      const list = data?.data ?? data;
      setHospitals(Array.isArray(list) ? list : []);
    }).catch(() => {});
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    if (!form.hospitalId) {
      setDepartments([]);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff) return;
    setSaving(true);
    try {
      await adminApi.updateStaff(staff.id, {
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
      const { data } = await adminApi.getStaffOne(staff.id);
      setStaff((data?.data ?? data) as Staff);
      setEditModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!staff) return;
    const ok = await confirm({
      title: 'Delete employee',
      message: 'Deactivate this employee?',
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await adminApi.deleteStaff(staff.id);
      navigate('/admin/employees');
    } catch (err) {
      console.error('Failed to delete staff', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">{t('onboarding.loading')}</p>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="p-4">
        <p className="text-gray-500">Employee not found.</p>
        <Link to="/admin/employees" className="mt-4 inline-block text-blue-600 hover:underline">Back to Employees</Link>
      </div>
    );
  }

  const u = staff.user as { firstName?: string; lastName?: string; email?: string; phone?: string } | undefined;
  const fullName = [u?.firstName, u?.lastName].filter(Boolean).join(' ') || '—';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-2">
          <button type="button" onClick={() => navigate('/admin/employees')} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900 truncate flex-1">{fullName}</h1>
          <button type="button" onClick={() => setEditModal(true)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-700" aria-label={t('common.edit')}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button type="button" onClick={handleDelete} className="p-2 rounded-lg hover:bg-red-50 text-red-600" aria-label={t('common.delete')}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">Resume & contact</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">Name</dt>
              <dd className="text-gray-900">{fullName}</dd>
            </div>
            {u?.email && (
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="text-gray-900">{u.email}</dd>
              </div>
            )}
            {u?.phone && (
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="text-gray-900">{u.phone}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500">Job title</dt>
              <dd className="text-gray-900">{staff.jobTitle ?? staff.position ?? '—'}</dd>
            </div>
            {staff.department && (
              <div>
                <dt className="text-gray-500">Department</dt>
                <dd className="text-gray-900">{staff.department.name}</dd>
              </div>
            )}
            {staff.hospital && (
              <div>
                <dt className="text-gray-500">Hospital</dt>
                <dd className="text-gray-900">{staff.hospital.name}</dd>
              </div>
            )}
            {staff.startDate && (
              <div>
                <dt className="text-gray-500">Start date</dt>
                <dd className="text-gray-900">{staff.startDate}</dd>
              </div>
            )}
            {staff.weeklyHours != null && (
              <div>
                <dt className="text-gray-500">Weekly hours</dt>
                <dd className="text-gray-900">{staff.weeklyHours} h/week</dd>
              </div>
            )}
            {(staff.contractUrl || staff.profilePhotoUrl || staff.resumeUrl) && (
              <div className="pt-2 flex flex-wrap gap-3">
                {staff.profilePhotoUrl && <a href={staff.profilePhotoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 font-medium hover:underline">Profile photo</a>}
                {staff.contractUrl && <a href={staff.contractUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 font-medium hover:underline">Contract</a>}
                {staff.resumeUrl && <a href={staff.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 font-medium hover:underline">Resume</a>}
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">Daily tasks</h2>
          <p className="text-sm text-gray-500">Task log or predefined task list by position (placeholder). This can be extended with a task model and UI.</p>
          <div className="mt-3 rounded-lg bg-gray-50 border border-gray-100 p-4 text-center text-gray-500 text-sm">
            No tasks recorded. Tasks can be categorized by job title (e.g. Nurse, Administrator, Technician).
          </div>
        </div>
      </main>

      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={() => setEditModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit employee</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                  <input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                  <input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" />
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
                <input value={form.jobTitle} onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weekly hours</label>
                <input type="number" min={0} step={0.5} value={form.weeklyHours} onChange={(e) => setForm((f) => ({ ...f, weeklyHours: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profile photo</label>
                {form.profilePhotoUrl && form.profilePhotoUrl.match(/\.(jpe?g|png|gif|webp)$/i) && (
                  <img src={form.profilePhotoUrl} alt="Profile" className="h-12 w-12 rounded object-cover border border-gray-200 mb-2" />
                )}
                <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" disabled={uploadingField === 'profile'} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload('profile', f); e.target.value = ''; }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-violet-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-violet-700" />
                {uploadingField === 'profile' && <p className="text-xs text-gray-500 mt-1">Uploading…</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contract</label>
                <input type="file" accept=".pdf,.csv,.xls,.xlsx,application/pdf,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={uploadingField === 'contract'} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload('contract', f); e.target.value = ''; }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-violet-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-violet-700" />
                {uploadingField === 'contract' && <p className="text-xs text-gray-500 mt-1">Uploading…</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resume</label>
                <input type="file" accept=".pdf,.csv,.xls,.xlsx,application/pdf,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={uploadingField === 'resume'} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload('resume', f); e.target.value = ''; }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-violet-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-violet-700" />
                {uploadingField === 'resume' && <p className="text-xs text-gray-500 mt-1">Uploading…</p>}
              </div>
              {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">{saving ? t('admin.saving') : t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
