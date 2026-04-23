import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { doctorsApi } from '../../api/doctors';
import { useLanguage } from '../../contexts/LanguageContext';
import { getRole } from '../../utils/auth';
import type { Hospital, Doctor, User } from '../../types';
import { CardSkeleton } from '../../components/skeletons';
import { useAppSelector } from '../../hooks/useAppDispatch';

interface HospitalForm {
  name: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  operatingDate: string;
  operatingHours: string;
  headId: string;
  departmentNames: string;
  doctorIds: number[];
  recordsUrl: string;
  contractUrl: string;
  backgroundImageUrl: string;
  isActive: boolean;
}

const emptyForm: HospitalForm = {
  name: '', address: '', phone: '', email: '', description: '',
  operatingDate: '', operatingHours: '', headId: '', departmentNames: '',
  doctorIds: [], recordsUrl: '', contractUrl: '', backgroundImageUrl: '',
  isActive: true,
};

export default function AdminHospitals() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const currentUser = useAppSelector((s) => s.auth.user);
  const role = getRole(currentUser);
  const canEditHospital = role === 'superadmin';
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; id?: number } | null>(null);
  const [form, setForm] = useState<HospitalForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof HospitalForm, string>>>({});
  const [saving, setSaving] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [usersForHead, setUsersForHead] = useState<User[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const { data } = await adminApi.uploadStaffFile(file);
      const url = typeof data === 'object' && data?.url ? data.url : (data as string);
      setForm((prev) => ({ ...prev, backgroundImageUrl: url }));
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const filteredHospitals = hospitals.filter((h) => {
    const matchesSearch = !search.trim() || [h.name, h.address].some((s) => (s ?? '').toLowerCase().includes(search.toLowerCase()));
    const isActive = (h as Hospital & { isActive?: boolean }).isActive !== false;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' && isActive) || (statusFilter === 'paused' && !isActive);
    return matchesSearch && matchesStatus;
  });

  async function loadHospitals(signal?: AbortSignal) {
    setLoading(true);
    try {
      const { data } = await adminApi.getHospitals(signal ? { signal } : undefined);
      if (signal?.aborted) return;
      const raw = (data as any)?.data ?? data;
      const list = Array.isArray(raw) ? raw : (raw as any)?.hospitals ?? (raw as any)?.rows ?? [];
      setHospitals(Array.isArray(list) ? list : []);
    } catch (err) {
      if (!signal?.aborted) console.error('Failed to load hospitals', err);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const ctrl = new AbortController();
    loadHospitals(ctrl.signal);
    return () => ctrl.abort();
  }, []);

  function openCreate() {
    setForm(emptyForm);
    setFormErrors({});
    setModal({ mode: 'create' });
  }

  function openEdit(h: Hospital) {
    const deptNames = (h.departments ?? []).map((d) => d.name).join('\n');
    const isActive = (h as Hospital & { isActive?: boolean }).isActive !== false;
    setForm({
      name: h.name,
      address: h.address,
      phone: h.phone,
      email: h.email ?? '',
      description: h.description ?? '',
      operatingDate: (h as Hospital & { operatingDate?: string }).operatingDate ?? '',
      operatingHours: (h as Hospital & { operatingHours?: string }).operatingHours ?? '',
      headId: (h as Hospital & { headId?: number }).headId != null ? String((h as Hospital & { headId?: number }).headId) : '',
      departmentNames: deptNames,
      doctorIds: [],
      recordsUrl: (h as Hospital & { recordsUrl?: string }).recordsUrl ?? '',
      contractUrl: (h as Hospital & { contractUrl?: string }).contractUrl ?? '',
      backgroundImageUrl: (h as Hospital & { backgroundImageUrl?: string }).backgroundImageUrl ?? '',
      isActive,
    });
    setFormErrors({});
    setModal({ mode: 'edit', id: h.id });
  }

  useEffect(() => {
    if (!modal) return;
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    Promise.all([
      doctorsApi.getAll({ limit: 200 }, { signal }).then((r) => (r.data?.doctors ?? r.data?.data ?? []) as Doctor[]),
      adminApi.getUsers({ limit: 200 }, { signal }).then((r) => (r.data?.users ?? r.data?.data ?? []) as User[]),
    ]).then(([docList, userList]) => {
      if (signal.aborted) return;
      setDoctors(Array.isArray(docList) ? docList : []);
      const list = Array.isArray(userList) ? userList : [];
      setUsersForHead(list.filter((u) => { const r = getRole(u); return r === 'admin' || r === 'superadmin'; }));
    }).catch(() => { });
    return () => ctrl.abort();
  }, [modal]);

  function validate(): boolean {
    const errs: Partial<Record<keyof HospitalForm, string>> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.address.trim()) errs.address = 'Address is required';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      description: form.description.trim() || undefined,
      operatingDate: form.operatingDate.trim() || undefined,
      operatingHours: form.operatingHours.trim() || undefined,
      headId: form.headId ? Number(form.headId) : undefined,
      departmentNames: form.departmentNames.trim() ? form.departmentNames.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean) : undefined,
      doctorIds: form.doctorIds.length ? form.doctorIds : undefined,
      recordsUrl: form.recordsUrl.trim() || undefined,
      contractUrl: form.contractUrl.trim() || undefined,
      backgroundImageUrl: form.backgroundImageUrl.trim() || undefined,
      isActive: form.isActive,
    };
    try {
      if (modal?.mode === 'create') {
        await adminApi.createHospital(payload);
      } else if (modal?.mode === 'edit' && modal.id) {
        await adminApi.updateHospital(modal.id, payload);
      }
      setModal(null);
      setFormErrors({});
      await loadHospitals();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string | string[] } } };
      const msg = ax.response?.data?.message;
      const text = Array.isArray(msg) ? msg.join('. ') : (typeof msg === 'string' ? msg : null) ?? t('admin.failedToSaveHospital');
      setFormErrors({ name: text });
    } finally {
      setSaving(false);
    }
  }

  function openDeleteModal(h: Hospital) {
    setDeleteTarget({ id: h.id, name: h.name ?? '' });
    setDeleteReason('');
  }

  async function confirmDeleteHospital() {
    if (!deleteTarget || !deleteReason.trim()) return;
    setDeleting(true);
    try {
      await adminApi.deleteHospital(deleteTarget.id, { reason: deleteReason.trim() });
      setHospitals((prev) => prev.filter((h) => h.id !== deleteTarget.id));
      setDeleteTarget(null);
      setDeleteReason('');
    } catch (err) {
      console.error('Failed to delete hospital', err);
    } finally {
      setDeleting(false);
    }
  }

  function updateField(field: keyof HospitalForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function toggleDoctorId(doctorId: number) {
    setForm((prev) =>
      prev.doctorIds.includes(doctorId)
        ? { ...prev, doctorIds: prev.doctorIds.filter((id) => id !== doctorId) }
        : { ...prev, doctorIds: [...prev.doctorIds, doctorId] },
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="h-8 w-48 rounded-lg bg-gray-200 animate-pulse" />
          <div className="h-10 w-36 rounded-lg bg-gray-200 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} lines={4} showImage imageHeight="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/admin" className="p-2 -ml-2 rounded-lg hover:bg-gray-100 shrink-0" aria-label={t('common.back')}>
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 truncate">{t('admin.hospitalManagement')}</h1>
        </div>
        {canEditHospital && (
          <button type="button" onClick={openCreate} className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            {t('admin.addHospital')}
          </button>
        )}
      </div>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </span>
        <input
          type="search"
          placeholder={t('admin.searchHospital')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {(['all', 'active', 'paused'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatusFilter(tab)}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition ${statusFilter === tab ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            {tab === 'all' && t('admin.allFilter')}
            {tab === 'active' && t('admin.activeFilter')}
            {tab === 'paused' && t('admin.paused')}
          </button>
        ))}
      </div>

      {hospitals.length === 0 ? (
        <p className="text-gray-500 py-8">{t('admin.noHospitalsYet')}</p>
      ) : filteredHospitals.length === 0 ? (
        <p className="text-gray-500 py-8">{t('employeeDirectory.noMatch')}</p>
      ) : (
        <div className="space-y-3">
          {filteredHospitals.map((h) => {
            const isActive = (h as Hospital & { isActive?: boolean }).isActive !== false;
            const head = (h as Hospital & { head?: User }).head;
            const adminName = head ? [head.firstName, head.lastName].filter(Boolean).join(' ') : (h as Hospital & { headId?: number }).headId ? '—' : '—';
            const departmentCount = Number((h as Hospital & { departmentCount?: number | string }).departmentCount ?? 0) || 0;
            const staffCount = Number((h as Hospital & { staffCount?: number | string }).staffCount ?? 0) || 0;
            const doctorCount = Number((h as Hospital & { doctorCount?: number | string }).doctorCount ?? 0) || 0;
            const patientCount = Number((h as Hospital & { patientCount?: number | string }).patientCount ?? 0) || 0;
            const imageUrl = (h as Hospital & { backgroundImageUrl?: string | null }).backgroundImageUrl ?? null;
            return (
              <div
                key={h.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/admin/hospitals/${h.id}`)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/admin/hospitals/${h.id}`); }}
                className="relative rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden cursor-pointer hover:border-blue-200 transition"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Image */}
                  <div className="w-full sm:w-1/3 sm:min-w-[120px] bg-gray-50 shrink-0">
                    {imageUrl ? (
                      <img src={imageUrl} alt="" className="w-full h-32 sm:h-full sm:min-h-[140px] object-cover" />
                    ) : (
                      <div className="w-full h-32 sm:h-full sm:min-h-[140px] flex items-center justify-center text-teal-700 bg-teal-50">
                        <svg className="h-10 w-10 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      </div>
                    )}
                  </div>

                  {/* Info: nội dung có padding-right đủ để không đè lên icon */}
                  <div className="flex-1 p-4 min-w-0 pr-14 sm:pr-14">
                    <div className="flex flex-wrap items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <h2 className="font-bold text-gray-900 truncate" title={h.name}>{h.name}</h2>
                        <p className="text-sm text-gray-500 mt-0.5 truncate" title={h.address}>{h.address}</p>
                        <p className="text-sm text-gray-500 mt-0.5 truncate">{t('adminUsers.phone')}: {h.phone || '—'}</p>
                        <p className="text-sm text-blue-600 mt-0.5 truncate">Head: {adminName || '—'}</p>
                      </div>
                      <span className={`shrink-0 inline-flex px-2 py-0.5 rounded text-xs font-semibold uppercase whitespace-nowrap ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {isActive ? t('admin.operating') : t('admin.paused')}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1 text-xs text-gray-600">
                      <div className="flex items-center justify-between gap-2 min-w-0"><span className="truncate">Staff</span><span className="font-semibold text-gray-900 shrink-0">{staffCount}</span></div>
                      <div className="flex items-center justify-between gap-2 min-w-0"><span className="truncate">Doctors</span><span className="font-semibold text-gray-900 shrink-0">{doctorCount}</span></div>
                      <div className="flex items-center justify-between gap-2 min-w-0"><span className="truncate">Patients</span><span className="font-semibold text-gray-900 shrink-0">{patientCount}</span></div>
                      <div className="flex items-center justify-between gap-2 min-w-0"><span className="truncate">Departments</span><span className="font-semibold text-gray-900 shrink-0">{departmentCount}</span></div>
                    </div>
                  </div>

                  {/* Chỉ icon Xóa, góc phải, không bị chữ đè */}
                  {canEditHospital && (
                    <div className="absolute top-3 right-3 flex items-center shrink-0">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openDeleteModal(h); }}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                        aria-label={t('common.delete')}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {canEditHospital && (
        <button
          type="button"
          onClick={openCreate}
          className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 z-30"
          aria-label={t('admin.addHospital')}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setModal(null)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <h3 className="text-lg font-semibold text-gray-900">{modal.mode === 'create' ? t('admin.addHospital') : t('admin.editHospital')}</h3>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center gap-2 bg-gray-50">
              {form.backgroundImageUrl ? (
                <div className="relative w-full max-h-32 flex justify-center">
                  <img src={form.backgroundImageUrl.startsWith('http') ? form.backgroundImageUrl : form.backgroundImageUrl} alt="" className="max-h-32 rounded-lg object-contain" />
                  <button type="button" onClick={() => setForm((f) => ({ ...f, backgroundImageUrl: '' }))} className="absolute top-1 right-2 p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200" aria-label={t('common.delete')}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                <span className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-blue-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                </span>
              )}
              <p className="text-sm font-medium text-gray-700">{t('admin.uploadImage')}</p>
              <p className="text-xs text-gray-500">{t('admin.chooseOfficialLogo')}</p>
              <label className="mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium cursor-pointer hover:bg-blue-700 disabled:opacity-50">
                {uploadingImage ? t('common.loading') : t('admin.selectFile')}
                <input type="file" accept="image/*" className="sr-only" disabled={uploadingImage} onChange={handleImageUpload} />
              </label>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.hospitalName')} *</label>
                <input value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder={t('admin.enterHospitalName')} className={`w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm focus:ring-blue-500 focus:border-blue-500 ${formErrors.name ? 'border-red-400' : 'border-gray-300'}`} />
                {formErrors.name && <p className="text-red-600 text-xs mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.address')} *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                  </span>
                  <input value={form.address} onChange={(e) => updateField('address', e.target.value)} placeholder={t('admin.addressPlaceholder')} className={`w-full pl-10 rounded-xl border bg-gray-50 px-4 py-3 text-sm focus:ring-blue-500 focus:border-blue-500 ${formErrors.address ? 'border-red-400' : 'border-gray-300'}`} />
                </div>
                {formErrors.address && <p className="text-red-600 text-xs mt-1">{formErrors.address}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.phone')} *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </span>
                  <input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder={t('admin.enterPhone')} className={`w-full pl-10 rounded-xl border bg-gray-50 px-4 py-3 text-sm focus:ring-blue-500 focus:border-blue-500 ${formErrors.phone ? 'border-red-400' : 'border-gray-300'}`} />
                </div>
                {formErrors.phone && <p className="text-red-600 text-xs mt-1">{formErrors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="hospital@example.com" className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.description')}</label>
                <textarea rows={3} value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder={t('admin.describeHospital')} className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.responsibleAdmin')}</label>
                <select value={form.headId} onChange={(e) => updateField('headId', e.target.value)} className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:ring-blue-500 focus:border-blue-500">
                  <option value="">{t('admin.selectManager')}</option>
                  {usersForHead.map((u) => (
                    <option key={u.id} value={u.id}>{[u.firstName, u.lastName].filter(Boolean).join(' ')} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-900">{t('admin.activeStatus')}</p>
                  <p className="text-sm text-gray-500">{t('admin.allowHospitalDisplay')}</p>
                </div>
                <button type="button" onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))} className={`shrink-0 w-12 h-7 rounded-full transition ${form.isActive ? 'bg-blue-600' : 'bg-gray-200'}`} aria-label={form.isActive ? t('admin.active') : t('admin.inactive')}>
                  <span className={`block w-5 h-5 rounded-full bg-white shadow mt-1 transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50">
                {saving ? t('common.loading') : t('admin.saveInfo')}
              </button>
              {modal.mode === 'edit' && modal.id && (
                <button type="button" onClick={() => { setDeleteTarget({ id: modal.id!, name: form.name }); setModal(null); setDeleteReason(''); }} className="w-full py-3 rounded-xl border border-red-200 text-red-600 font-medium flex items-center justify-center gap-2 hover:bg-red-50">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  {t('admin.deleteHospitalButton')}
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">{t('admin.deleteHospital')}</h3>
            <p className="text-sm text-gray-600">{t('admin.deleteHospitalConfirm')} — {deleteTarget.name}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.deactivateReasonLabel')} *</label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder={t('adminUsers.deactivateReasonPlaceholder')}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">{t('common.cancel')}</button>
              <button type="button" onClick={confirmDeleteHospital} disabled={deleting || !deleteReason.trim()} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                {deleting ? t('common.loading') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
