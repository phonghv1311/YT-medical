import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { adminApi } from '../../api/admin';
import { doctorsApi } from '../../api/doctors';
import type { Hospital, Department, Doctor, User, Staff } from '../../types';

function getHospitalDeleteHandler(hospitalId: number, t: (k: string) => string, confirm: (o: { title: string; message: string; confirmLabel: string; cancelLabel: string; variant: string }) => Promise<boolean>, navigate: (path: string) => void) {
  return async () => {
    const ok = await confirm({
      title: t('admin.deleteHospital'),
      message: t('admin.deleteHospitalConfirm'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await adminApi.deleteHospital(hospitalId);
      navigate('/admin/hospitals');
    } catch (err) {
      console.error('Failed to delete hospital', err);
    }
  };
}

type TabId = 'overview' | 'doctors' | 'departments' | 'staff';

export default function HospitalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { confirm } = useConfirm();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [editModal, setEditModal] = useState(false);
  const [addDeptModal, setAddDeptModal] = useState(false);
  const [form, setForm] = useState({
    name: '', address: '', phone: '', email: '', description: '',
    operatingDate: '', operatingHours: '', headId: '', departmentNames: '',
    doctorIds: [] as number[], recordsUrl: '', contractUrl: '', backgroundImageUrl: '', website: '',
  });
  const [activityLogs, setActivityLogs] = useState<{ action: string; resource: string; resourceId?: number; details?: string; createdAt?: string; user?: { firstName?: string; lastName?: string } }[]>([]);
  const [acceptingPatients, setAcceptingPatients] = useState(true);
  const [deptForm, setDeptForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [usersForHead, setUsersForHead] = useState<User[]>([]);
  const [allDoctorsForSelect, setAllDoctorsForSelect] = useState<Doctor[]>([]);

  const hospitalId = id ? parseInt(id, 10) : NaN;

  useEffect(() => {
    if (!id || Number.isNaN(hospitalId)) {
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    setLoading(true);
    Promise.allSettled([
      adminApi.getHospital(hospitalId, { signal }).then((r) => r.data?.data ?? r.data),
      adminApi.getDepartments(hospitalId, { signal }).then((r) => (r.data?.data ?? r.data) as Department[]),
      doctorsApi.getAll({ hospitalId, limit: 50 }, { signal }).then((r) => (r.data?.doctors ?? r.data?.data?.doctors ?? r.data) as Doctor[]),
      adminApi.getStaff({ hospitalId, limit: 100 }, { signal }).then((r) => (r.data?.staff ?? r.data?.data ?? r.data) as Staff[]),
    ])
      .then(([hospitalResult, deptsResult, docsResult, staffResult]) => {
        if (signal.aborted) return;
        const h = hospitalResult.status === 'fulfilled' ? hospitalResult.value : null;
        const depts = deptsResult.status === 'fulfilled' && Array.isArray(deptsResult.value) ? deptsResult.value : [];
        const docs = docsResult.status === 'fulfilled' ? docsResult.value : [];
        const staffRes = staffResult.status === 'fulfilled' ? staffResult.value : [];
        if (!h || typeof h !== 'object') {
          setHospital(null);
          setDepartments([]);
          setDoctors([]);
          setStaffList([]);
          return;
        }
        setDepartments(depts);
        const doctorList = (h as { doctors?: Doctor[] }).doctors ?? docs;
        setDoctors(Array.isArray(doctorList) ? doctorList : []);
        const staffArr = Array.isArray(staffRes) ? staffRes : (staffRes as { staff?: Staff[] })?.staff ?? [];
        setStaffList(staffArr);
        setHospital(h as Hospital);
        const hp = h as Hospital;
        const deptNames = depts.map((d) => d.name).join('\n');
        const docIds = (Array.isArray(doctorList) ? doctorList : []).map((d) => d.id);
        setForm({
          name: hp.name ?? '',
          address: hp.address ?? '',
          phone: hp.phone ?? '',
          email: hp.email ?? '',
          description: hp.description ?? '',
          operatingDate: hp.operatingDate ?? '',
          operatingHours: hp.operatingHours ?? '',
          headId: hp.headId != null ? String(hp.headId) : '',
          departmentNames: deptNames,
          doctorIds: docIds,
          recordsUrl: hp.recordsUrl ?? '',
          contractUrl: hp.contractUrl ?? '',
          backgroundImageUrl: hp.backgroundImageUrl ?? '',
          website: (hp as Hospital & { website?: string }).website ?? '',
        });
        setAcceptingPatients(hp.isActive !== false);
      })
      .catch(() => { if (!signal.aborted) setHospital(null); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [id, hospitalId]);

  useEffect(() => {
    if (!hospitalId || Number.isNaN(hospitalId)) return;
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    adminApi.getLogs({ resource: 'hospital', resourceId: hospitalId, limit: 10 }, { signal })
      .then((r) => {
        if (signal.aborted) return;
        const data = r.data?.logs ?? r.data?.data ?? r.data;
        setActivityLogs(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [hospitalId]);

  useEffect(() => {
    if (!editModal) return;
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    Promise.all([
      adminApi.getUsers({ limit: 200 }, { signal }).then((r) => (r.data?.users ?? r.data?.data ?? []) as User[]),
      doctorsApi.getAll({ limit: 200 }, { signal }).then((r) => (r.data?.doctors ?? r.data?.data ?? []) as Doctor[]),
    ]).then(([userList, docList]) => {
      if (signal.aborted) return;
      setUsersForHead(Array.isArray(userList) ? userList : []);
      setAllDoctorsForSelect(Array.isArray(docList) ? docList : []);
    }).catch(() => {});
    return () => ctrl.abort();
  }, [editModal]);

  const toggleDoctorId = (doctorId: number) => {
    setForm((prev) =>
      prev.doctorIds.includes(doctorId)
        ? { ...prev, doctorIds: prev.doctorIds.filter((id) => id !== doctorId) }
        : { ...prev, doctorIds: [...prev.doctorIds, doctorId] },
    );
  };

  const saveHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospital) return;
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
      website: form.website?.trim() || undefined,
    };
    try {
      await adminApi.updateHospital(hospital.id, payload);
      const { data } = await adminApi.getHospital(hospital.id);
      const updated = data?.data ?? data;
      if (updated && typeof updated === 'object') setHospital(updated as Hospital);
      setEditModal(false);
    } finally {
      setSaving(false);
    }
  };

  const saveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalId || !deptForm.name.trim()) return;
    setSaving(true);
    try {
      const { data } = await adminApi.createDepartment({ name: deptForm.name.trim(), hospitalId, description: deptForm.description.trim() || undefined });
      const created = data?.data ?? data;
      if (created && typeof created === 'object' && 'id' in created) setDepartments((prev) => [...prev, created as Department]);
      setDeptForm({ name: '', description: '' });
      setAddDeptModal(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">{t('onboarding.loading')}</p>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="p-4">
        <p className="text-gray-500">{t('admin.failedToLoadHospitals')}</p>
        <Link to="/admin/hospitals" className="mt-4 inline-block text-blue-600 hover:underline">{t('hospitalDetail.backToHospitals')}</Link>
      </div>
    );
  }

  const handleDelete = getHospitalDeleteHandler(hospital.id, t, confirm, navigate);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: t('hospitalDetail.overview') },
    { id: 'doctors', label: t('hospitalDetail.doctors') },
    { id: 'departments', label: t('hospitalDetail.departments') },
    { id: 'staff', label: t('hospitalDetail.staff') },
  ];

  function getDoctorName(d: Doctor): string {
    const u = d.user as { firstName?: string; lastName?: string } | undefined;
    return u ? `Dr. ${(u.firstName ?? '').trim()} ${(u.lastName ?? '').trim()}`.trim() || 'Doctor' : 'Doctor';
  }

  const toggleAccepting = async () => {
    if (!hospital) return;
    try {
      await adminApi.updateHospital(hospital.id, { isActive: !acceptingPatients });
      setAcceptingPatients(!acceptingPatients);
      setHospital((prev) => prev ? { ...prev, isActive: !acceptingPatients } : null);
    } catch (e) {
      console.error(e);
    }
  };

  const mapUrl = hospital ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.address)}` : '';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-2">
          <button type="button" onClick={() => navigate('/admin/hospitals')} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900 truncate flex-1">Facility Administration</h1>
          <button type="button" onClick={() => setEditModal(true)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-700" aria-label={t('common.edit')}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button type="button" onClick={handleDelete} className="p-2 rounded-lg hover:bg-red-50 text-red-600" aria-label={t('common.delete')}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>

        <nav className="max-w-lg mx-auto px-4 flex gap-1 overflow-x-auto border-t border-gray-100" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <section className="space-y-4">
            {/* Hospital banner */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-200 min-h-[140px] -mx-4 sm:mx-0">
              {hospital.backgroundImageUrl ? (
                <img src={hospital.backgroundImageUrl} alt="" className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-slate-300 to-slate-400" />
              )}
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <div className="flex items-end gap-3">
                  <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-1 4h-1m4-4h1" /></svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold drop-shadow">{hospital.name}</h2>
                    <p className="text-sm text-white/90 truncate">{hospital.address}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={() => setEditModal(true)} className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-sm font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    {t('hospitalDetail.editDetails')}
                  </button>
                  <Link to="/admin/employees" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    Staffing
                  </Link>
                </div>
              </div>
            </div>

            {/* Operational status */}
            <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <span className="text-gray-500">Operational Status</span>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${acceptingPatients ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {acceptingPatients ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </h3>
                <button type="button" role="switch" aria-checked={acceptingPatients} onClick={toggleAccepting} className={`relative w-11 h-6 rounded-full transition ${acceptingPatients ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition left-1 ${acceptingPatients ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
              <p className="text-sm text-gray-600">Facility Status: {acceptingPatients ? 'Accepting Patients' : 'Not accepting'}</p>
              <p className="text-sm text-gray-500 mt-0.5">Emergency services are fully operational 24/7.</p>
            </div>

            {/* Departments & Specialties */}
            <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                  Departments & Specialties
                </h3>
                <button type="button" onClick={() => setAddDeptModal(true)} className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1 border border-dashed border-gray-300 rounded-lg px-2 py-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Dept
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {departments.map((dept) => (
                  <span key={dept.id} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 text-gray-800 text-sm font-medium">
                    {dept.name}
                  </span>
                ))}
                {departments.length === 0 && (
                  <p className="text-sm text-gray-500">No departments yet.</p>
                )}
              </div>
            </div>

            {/* Assigned doctors */}
            <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  Assigned Doctors
                </h3>
                <button type="button" onClick={() => setActiveTab('doctors')} className="text-sm font-medium text-blue-600 hover:underline">View All</button>
              </div>
              <ul className="space-y-3">
                {doctors.slice(0, 4).map((d) => (
                  <li key={d.id} className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                      {getDoctorName(d).slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{getDoctorName(d)}</p>
                      <p className="text-xs text-gray-500 truncate">{(d.specializations ?? []).map((s) => s.name).join(', ') || '—'}</p>
                    </div>
                    <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">On Duty</span>
                  </li>
                ))}
                {doctors.length === 0 && <p className="text-sm text-gray-500">{t('hospitalDetail.noDoctors')}</p>}
              </ul>
            </div>

            {/* Contact information */}
            <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Contact Information
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <dd className="text-gray-900">{hospital.phone}</dd>
                </div>
                {hospital.email && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <dd className="text-gray-900">{hospital.email}</dd>
                  </div>
                )}
                {(hospital as Hospital & { website?: string }).website && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                    <a href={(hospital as Hospital & { website?: string }).website!.startsWith('http') ? (hospital as Hospital & { website?: string }).website : `https://${(hospital as Hospital & { website?: string }).website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{(hospital as Hospital & { website?: string }).website}</a>
                  </div>
                )}
              </dl>
            </div>

            {/* Location */}
            <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Location
              </h3>
              <p className="text-sm text-gray-600 mb-3">{hospital.address}</p>
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700">
                Open in Google Maps
              </a>
            </div>

            {/* Recent activity */}
            <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Recent Activity
              </h3>
              <ul className="space-y-2 text-sm">
                {activityLogs.length === 0 && <p className="text-gray-500">No recent activity.</p>}
                {activityLogs.map((log) => (
                  <li key={(log as { id?: number }).id ?? Math.random()} className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                    <span className="text-gray-700">{log.details ?? log.action}</span>
                    <span className="text-gray-400 shrink-0">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                      {log.user ? ` by ${log.user.firstName ?? ''} ${log.user.lastName ?? ''}`.trim() : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {activeTab === 'doctors' && (
          <section className="space-y-4">
            <p className="text-sm text-gray-500">{t('hospitalDetail.doctorsDescription')}</p>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{t('hospitalDetail.viewDoctors')}</h2>
              <Link to={`/admin/users?role=doctor&hospitalId=${hospital.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                + {t('hospitalDetail.addDoctor')}
              </Link>
            </div>
            {doctors.length === 0 ? (
              <div className="rounded-xl bg-white border border-gray-200 p-6 text-center text-gray-500 text-sm">
                {t('hospitalDetail.noDoctors')}
              </div>
            ) : (
              <ul className="space-y-3">
                {doctors.map((d) => (
                  <li key={d.id} className="rounded-xl bg-white border border-gray-200 p-4 flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                      {getDoctorName(d).slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{getDoctorName(d)}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {(d.specializations ?? []).map((s) => s.name).join(', ') || '—'}
                      </p>
                    </div>
                    <Link to={`/doctors/${d.id}`} className="text-sm text-blue-600 font-medium shrink-0">{t('hospitalDetail.viewProfile')}</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {activeTab === 'departments' && (
          <section className="space-y-4">
            <p className="text-sm text-gray-500">{t('hospitalDetail.departmentsDescription')}</p>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{t('hospitalDetail.viewDepartments')}</h2>
              <button type="button" onClick={() => setAddDeptModal(true)} className="text-sm font-medium text-blue-600 hover:underline">
                + {t('hospitalDetail.addDepartment')}
              </button>
            </div>
            {departments.length === 0 ? (
              <div className="rounded-xl bg-white border border-gray-200 p-6 text-center text-gray-500 text-sm">
                {t('hospitalDetail.noDepartments')}
              </div>
            ) : (
              <ul className="space-y-3">
                {departments.map((dept) => (
                  <li key={dept.id} className="rounded-xl bg-white border border-gray-200 p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{dept.name}</p>
                      {dept.description && <p className="text-xs text-gray-500 mt-0.5">{dept.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {activeTab === 'staff' && (
          <section className="space-y-4">
            <p className="text-sm text-gray-500">{t('hospitalDetail.staffDescription')}</p>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{t('hospitalDetail.viewStaff')}</h2>
              <Link to="/admin/employees" className="text-sm font-medium text-blue-600 hover:underline">
                + {t('hospitalDetail.addStaff')}
              </Link>
            </div>
            {staffList.length === 0 ? (
              <div className="rounded-xl bg-white border border-gray-200 p-6 text-center text-gray-500 text-sm">
                {t('hospitalDetail.noStaff')}
                <p className="mt-2 text-xs">Add staff via Employees.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {staffList.map((s) => (
                  <li key={s.id} className="rounded-xl bg-white border border-gray-200 p-4 flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 text-sm font-medium">
                      {s.user?.firstName?.slice(0, 1)}{s.user?.lastName?.slice(0, 1) || '?'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{s.user?.firstName} {s.user?.lastName}</p>
                      <p className="text-xs text-gray-500 truncate">{s.jobTitle ?? s.position ?? '—'}</p>
                      {s.department && <p className="text-xs text-gray-400">{s.department.name}</p>}
                    </div>
                    <Link to={`/admin/employees/${s.id}`} className="text-sm text-blue-600 font-medium shrink-0">{t('hospitalDetail.viewProfile')}</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>

      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={() => setEditModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.editHospital')}</h3>
            <form onSubmit={saveHospital} className="space-y-4">
              {(['name', 'address', 'phone', 'email', 'description'] as const).map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t(`admin.${field}` as 'admin.name')}</label>
                  {field === 'description' ? (
                    <textarea rows={2} value={form[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" />
                  ) : (
                    <input type={field === 'email' ? 'email' : 'text'} value={form[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" />
                  )}
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operating date</label>
                <input type="date" value={form.operatingDate} onChange={(e) => setForm((f) => ({ ...f, operatingDate: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operating hours</label>
                <input type="text" placeholder="e.g. 8:00–18:00" value={form.operatingHours} onChange={(e) => setForm((f) => ({ ...f, operatingHours: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital head</label>
                <select value={form.headId} onChange={(e) => setForm((f) => ({ ...f, headId: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm">
                  <option value="">— Select —</option>
                  {usersForHead.map((u) => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departments (one per line or comma-separated)</label>
                <textarea rows={2} value={form.departmentNames} onChange={(e) => setForm((f) => ({ ...f, departmentNames: e.target.value }))} placeholder="Cardiology, Pediatrics" className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctors (select to assign)</label>
                <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-300 p-2 space-y-1">
                  {allDoctorsForSelect.slice(0, 80).map((d) => (
                    <label key={d.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.doctorIds.includes(d.id)} onChange={() => toggleDoctorId(d.id)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm">Dr. {d.user?.firstName} {d.user?.lastName}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Records URL</label>
                <input type="url" value={form.recordsUrl} onChange={(e) => setForm((f) => ({ ...f, recordsUrl: e.target.value }))} placeholder="https://..." className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contract URL</label>
                <input type="url" value={form.contractUrl} onChange={(e) => setForm((f) => ({ ...f, contractUrl: e.target.value }))} placeholder="https://..." className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Background image URL</label>
                <input type="url" value={form.backgroundImageUrl} onChange={(e) => setForm((f) => ({ ...f, backgroundImageUrl: e.target.value }))} placeholder="https://..." className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input type="url" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://..." className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{saving ? t('admin.saving') : t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {addDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={() => setAddDeptModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('hospitalDetail.addDepartment')}</h3>
            <form onSubmit={saveDepartment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.name')}</label>
                <input value={deptForm.name} onChange={(e) => setDeptForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.description')}</label>
                <textarea rows={2} value={deptForm.description} onChange={(e) => setDeptForm((f) => ({ ...f, description: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setAddDeptModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{saving ? t('admin.saving') : t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
