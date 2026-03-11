import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { doctorsApi } from '../../api/doctors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import type { Hospital, Doctor, User } from '../../types';
import { CardSkeleton } from '../../components/skeletons';

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
}

const emptyForm: HospitalForm = {
  name: '', address: '', phone: '', email: '', description: '',
  operatingDate: '', operatingHours: '', headId: '', departmentNames: '',
  doctorIds: [], recordsUrl: '', contractUrl: '', backgroundImageUrl: '',
};

export default function AdminHospitals() {
  const { t } = useLanguage();
  const { confirm } = useConfirm();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; id?: number } | null>(null);
  const [form, setForm] = useState<HospitalForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof HospitalForm, string>>>({});
  const [saving, setSaving] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [usersForHead, setUsersForHead] = useState<User[]>([]);

  const filteredHospitals = search.trim()
    ? hospitals.filter((h) => [h.name, h.address].some((s) => (s ?? '').toLowerCase().includes(search.toLowerCase())))
    : hospitals;

  useEffect(() => {
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    setLoading(true);
    adminApi.getHospitals({ signal })
      .then(({ data }) => {
        if (signal.aborted) return;
        setHospitals(data?.data ?? data ?? []);
      })
      .catch((err) => { if (!signal.aborted) console.error('Failed to load hospitals', err); })
      .finally(() => { if (!signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, []);

  function openCreate() {
    setForm(emptyForm);
    setFormErrors({});
    setModal({ mode: 'create' });
  }

  function openEdit(h: Hospital) {
    const deptNames = (h.departments ?? []).map((d) => d.name).join('\n');
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
      setUsersForHead(Array.isArray(userList) ? userList : []);
    }).catch(() => {});
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
    };
    try {
      if (modal?.mode === 'create') {
        const { data } = await adminApi.createHospital(payload);
        setHospitals((prev) => [...prev, data.data ?? data]);
      } else if (modal?.mode === 'edit' && modal.id) {
        await adminApi.updateHospital(modal.id, payload);
        setHospitals((prev) => prev.map((h) => (h.id === modal.id ? { ...h, ...payload } : h)));
      }
      setModal(null);
    } catch {
      setFormErrors({ name: t('admin.failedToSaveHospital') });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const ok = await confirm({
      title: t('admin.deleteHospital'),
      message: t('admin.deleteHospitalConfirm'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await adminApi.deleteHospital(id);
      setHospitals((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      console.error('Failed to delete hospital', err);
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600" aria-hidden>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('admin.hospitals')}</h1>
      </div>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </span>
        <input
          type="search"
          placeholder={t('hospitalsList.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <button type="button" onClick={openCreate} className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        + {t('admin.addHospital')}
      </button>

      {hospitals.length === 0 ? (
        <p className="text-gray-500 py-8">{t('admin.noHospitalsYet')}</p>
      ) : filteredHospitals.length === 0 ? (
        <p className="text-gray-500 py-8">{t('employeeDirectory.noMatch')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredHospitals.map((h) => (
            <div key={h.id} className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <Link to={`/admin/hospitals/${h.id}`} className="block flex-1 min-w-0">
                <div className="h-24 bg-blue-100 flex items-center justify-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-200/80 text-blue-700" aria-hidden>
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </span>
                </div>
                <div className="p-4 flex flex-col min-w-0">
                  <h2 className="font-bold text-gray-900 text-lg truncate" title={h.name}>{h.name}</h2>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2 min-w-0" title={h.address}>{h.address}</p>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1 min-w-0 truncate">
                    <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {h.phone}
                  </p>
                  <div className="mt-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${h.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {h.isActive ? t('admin.active') : t('admin.inactive')}
                    </span>
                  </div>
                </div>
              </Link>
              <div className="px-4 pb-4 flex gap-2" onClick={(e) => e.preventDefault()}>
                <button type="button" onClick={(e) => { e.stopPropagation(); openEdit(h); }} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition">
                  {t('common.edit')}
                </button>
                <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(h.id); }} className="flex-1 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition">
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">{modal.mode === 'create' ? t('admin.addHospital') : t('admin.editHospital')}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {(['name', 'address', 'phone', 'email', 'description'] as const).map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t(`admin.${field}` as 'admin.name')}</label>
                  {field === 'description' ? (
                    <textarea
                      rows={2}
                      value={form[field]}
                      onChange={(e) => updateField(field, e.target.value)}
                      className={`w-full rounded-lg border shadow-sm text-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors[field] ? 'border-red-400' : 'border-gray-300'}`}
                    />
                  ) : (
                    <input
                      type={field === 'email' ? 'email' : 'text'}
                      value={form[field]}
                      onChange={(e) => updateField(field, e.target.value)}
                      className={`w-full rounded-lg border shadow-sm text-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors[field] ? 'border-red-400' : 'border-gray-300'}`}
                    />
                  )}
                  {formErrors[field] && <p className="text-red-600 text-xs mt-1">{formErrors[field]}</p>}
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operating date</label>
                <input type="date" value={form.operatingDate} onChange={(e) => updateField('operatingDate', e.target.value)} className="w-full rounded-lg border border-gray-300 text-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operating hours</label>
                <input type="text" placeholder="e.g. 8:00–18:00" value={form.operatingHours} onChange={(e) => updateField('operatingHours', e.target.value)} className="w-full rounded-lg border border-gray-300 text-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital head</label>
                <select value={form.headId} onChange={(e) => updateField('headId', e.target.value)} className="w-full rounded-lg border border-gray-300 text-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">— Select —</option>
                  {usersForHead.map((u) => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departments (one per line or comma-separated)</label>
                <textarea rows={2} value={form.departmentNames} onChange={(e) => updateField('departmentNames', e.target.value)} placeholder="Cardiology, Pediatrics" className="w-full rounded-lg border border-gray-300 text-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctors (select to assign)</label>
                <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-300 p-2 space-y-1">
                  {doctors.slice(0, 50).map((d) => (
                    <label key={d.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.doctorIds.includes(d.id)} onChange={() => toggleDoctorId(d.id)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm">Dr. {d.user?.firstName} {d.user?.lastName}</span>
                    </label>
                  ))}
                  {doctors.length > 50 && <p className="text-xs text-gray-500">+ {doctors.length - 50} more</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Records URL</label>
                <input type="url" placeholder="https://..." value={form.recordsUrl} onChange={(e) => updateField('recordsUrl', e.target.value)} className="w-full rounded-lg border border-gray-300 text-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contract URL</label>
                <input type="url" placeholder="https://..." value={form.contractUrl} onChange={(e) => updateField('contractUrl', e.target.value)} className="w-full rounded-lg border border-gray-300 text-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Background image URL</label>
                <input type="url" placeholder="https://..." value={form.backgroundImageUrl} onChange={(e) => updateField('backgroundImageUrl', e.target.value)} className="w-full rounded-lg border border-gray-300 text-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition">{t('common.cancel')}</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50">
                  {saving ? t('admin.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
