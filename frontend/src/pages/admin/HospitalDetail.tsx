import { useEffect, useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminApi } from '../../api/admin';
import { doctorsApi } from '../../api/doctors';
import AddUserModal from '../../components/AddUserModal';
import type { Hospital, Department, Doctor, User, Staff } from '../../types';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { getRole } from '../../utils/auth';

type TabId = 'overview' | 'people' | 'departments';
type PeopleRoleFilter = 'all' | 'doctor' | 'staff' | 'customer';

export default function HospitalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const currentUser = useAppSelector((s) => s.auth.user);
  const role = getRole(currentUser);
  const canEditHospital = role === 'superadmin';
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
  const [deptForm, setDeptForm] = useState({ name: '', description: '', headId: '' });
  const [saving, setSaving] = useState(false);
  const [usersForHead, setUsersForHead] = useState<User[]>([]);
  const [allDoctorsForSelect, setAllDoctorsForSelect] = useState<Doctor[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [addUserModal, setAddUserModal] = useState(false);
  const [editDepartmentChips, setEditDepartmentChips] = useState<string[]>([]);
  const [saveError, setSaveError] = useState('');
  const [uploadingFile, setUploadingFile] = useState<'records' | 'contract' | 'background' | null>(null);
  const [peopleRoleFilter, setPeopleRoleFilter] = useState<PeopleRoleFilter>('all');
  const [peopleDepartmentId, setPeopleDepartmentId] = useState<number | ''>('');
  const [customersList, setCustomersList] = useState<User[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [doctorSelectOpen, setDoctorSelectOpen] = useState(false);
  const doctorSelectRef = useRef<HTMLDivElement>(null);
  const [departmentSelectOpen, setDepartmentSelectOpen] = useState(false);
  const departmentSelectRef = useRef<HTMLDivElement>(null);

  const hospitalId = id ? parseInt(id, 10) : NaN;

  useEffect(() => {
    if (!id || Number.isNaN(hospitalId)) {
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    setLoading(true);
    Promise.all([
      adminApi.getHospital(hospitalId, { signal }).then((r) => r.data?.data ?? r.data),
      adminApi.getStaff({ hospitalId, limit: 100 }, { signal }).then((r) => (r.data?.staff ?? r.data?.data ?? r.data) as Staff[]),
    ])
      .then(([h, staffRes]) => {
        if (signal.aborted) return;
        if (!h || typeof h !== 'object') {
          setHospital(null);
          setDepartments([]);
          setDoctors([]);
          setStaffList([]);
          return;
        }
        const hp = h as Hospital & { doctors?: Doctor[]; departments?: Department[] };
        const depts = Array.isArray(hp.departments) ? hp.departments : [];
        const doctorList = Array.isArray(hp.doctors) ? hp.doctors : [];
        setDepartments(depts);
        setDoctors(doctorList);
        const staffArr = Array.isArray(staffRes) ? staffRes : (staffRes as { staff?: Staff[] })?.staff ?? [];
        setStaffList(staffArr);
        setHospital(h as Hospital);
        const deptNames = depts.map((d) => d.name).join('\n');
        const docIds = doctorList.map((d) => d.id);
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
      .finally(() => { if (!signal.aborted) setLoading(false); });
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
      .catch(() => { });
    return () => ctrl.abort();
  }, [hospitalId]);

  useEffect(() => {
    if (!editModal && !addDeptModal) return;
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    Promise.all([
      adminApi.getUsers({ limit: 200 }, { signal }).then((r) => (r.data?.users ?? r.data?.data ?? []) as User[]),
      doctorsApi.getAll({ limit: 200 }, { signal }).then((r) => (r.data?.doctors ?? r.data?.data ?? []) as Doctor[]),
    ]).then(([userList, docList]) => {
      if (signal.aborted) return;
      const list = Array.isArray(userList) ? userList : [];
      const getRoleName = (u: User) => {
        const r = (u as User & { role?: string | { name?: string } }).role;
        return (typeof r === 'string' ? r : (r as { name?: string })?.name ?? '').toLowerCase();
      };
      const adminAndSuperadmin = list.filter((u) => {
        const role = getRoleName(u);
        return role === 'admin' || role === 'superadmin';
      });
      setUsersForHead(adminAndSuperadmin);
      setAllDoctorsForSelect(Array.isArray(docList) ? docList : []);
    }).catch(() => { });
    return () => ctrl.abort();
  }, [editModal, addDeptModal]);

  useEffect(() => {
    if (editModal && form.departmentNames !== undefined) {
      setEditDepartmentChips(form.departmentNames.trim() ? form.departmentNames.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean) : []);
    }
  }, [editModal, form.departmentNames]);

  useEffect(() => {
    if (!doctorSelectOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (doctorSelectRef.current && !doctorSelectRef.current.contains(e.target as Node)) setDoctorSelectOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [doctorSelectOpen]);

  useEffect(() => {
    if (!departmentSelectOpen) return;
    const onDept = (e: MouseEvent) => {
      if (departmentSelectRef.current && !departmentSelectRef.current.contains(e.target as Node)) setDepartmentSelectOpen(false);
    };
    document.addEventListener('mousedown', onDept);
    return () => document.removeEventListener('mousedown', onDept);
  }, [departmentSelectOpen]);

  useEffect(() => {
    if (activeTab !== 'people' || (peopleRoleFilter !== 'customer' && peopleRoleFilter !== 'all')) return;
    const ctrl = new AbortController();
    setCustomersLoading(true);
    adminApi.getUsers({ page: 1, limit: 200 }, { signal: ctrl.signal })
      .then(({ data }) => {
        const payload = data?.data ?? data;
        const list = (payload?.users ?? payload?.data ?? payload) as User[] | undefined;
        const arr = Array.isArray(list) ? list : [];
        const getRoleName = (u: User) => (typeof (u as User & { role?: { name?: string } }).role === 'object' ? (u as User & { role?: { name?: string } }).role?.name : '') ?? '';
        setCustomersList(arr.filter((u) => getRoleName(u).toLowerCase() === 'customer'));
      })
      .catch(() => setCustomersList([]))
      .finally(() => setCustomersLoading(false));
    return () => ctrl.abort();
  }, [activeTab, peopleRoleFilter]);

  const addDepartmentChip = (name: string) => {
    const n = name.trim();
    if (n && !editDepartmentChips.includes(n)) setEditDepartmentChips((prev) => [...prev, n]);
    setNewDeptName('');
  };
  const removeDepartmentChip = (name: string) => {
    setEditDepartmentChips((prev) => prev.filter((c) => c !== name));
  };

  const handleHospitalFileUpload = async (field: 'recordsUrl' | 'contractUrl' | 'backgroundImageUrl', file: File) => {
    setUploadingFile(field === 'recordsUrl' ? 'records' : field === 'contractUrl' ? 'contract' : 'background');
    try {
      const { data } = await adminApi.uploadStaffFile(file);
      const url = typeof data === 'object' && data?.url ? data.url : (data as string);
      setForm((f) => ({ ...f, [field]: url }));
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploadingFile(null);
    }
  };

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
      departmentNames: editDepartmentChips.length ? editDepartmentChips : undefined,
      doctorIds: form.doctorIds.length ? form.doctorIds : undefined,
      recordsUrl: form.recordsUrl.trim() || undefined,
      contractUrl: form.contractUrl.trim() || undefined,
      backgroundImageUrl: form.backgroundImageUrl.trim() || undefined,
      website: form.website?.trim() || undefined,
    };
    setSaveError('');
    try {
      await adminApi.updateHospital(hospital.id, payload);
      const { data } = await adminApi.getHospital(hospital.id);
      const updated = data?.data ?? data;
      if (updated && typeof updated === 'object') {
        const u = updated as Hospital & { doctors?: Doctor[]; departments?: Department[] };
        setHospital(updated as Hospital);
        if (Array.isArray(u.doctors)) setDoctors(u.doctors);
        if (Array.isArray(u.departments)) setDepartments(u.departments);
        const docIds = (u.doctors ?? []).map((d) => d.id);
        const deptNames = (u.departments ?? []).map((d) => d.name);
        setForm((f) => ({
          ...f,
          departmentNames: deptNames.join('\n'),
          doctorIds: docIds,
        }));
        setEditDepartmentChips(deptNames);
      }
      setEditModal(false);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string | string[] } } };
      const msg = ax.response?.data?.message;
      setSaveError(Array.isArray(msg) ? msg.join('. ') : (typeof msg === 'string' ? msg : 'Failed to save hospital'));
    } finally {
      setSaving(false);
    }
  };

  const saveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalId || !deptForm.name.trim()) return;
    setSaving(true);
    try {
      const headId = deptForm.headId ? parseInt(deptForm.headId, 10) : undefined;
      const { data } = await adminApi.createDepartment({
        name: deptForm.name.trim(),
        hospitalId,
        description: deptForm.description.trim() || undefined,
        headId,
      });
      const created = data?.data ?? data;
      if (created && typeof created === 'object' && 'id' in created) setDepartments((prev) => [...prev, created as Department]);
      setDeptForm({ name: '', description: '', headId: '' });
      setAddDeptModal(false);
    } finally {
      setSaving(false);
    }
  };

  const refetchHospitalData = async () => {
    const { data } = await adminApi.getHospital(hospitalId);
    const updated = data?.data ?? data;
    if (updated && typeof updated === 'object') {
      const u = updated as Hospital & { doctors?: Doctor[]; departments?: Department[] };
      setHospital(updated as Hospital);
      setAcceptingPatients((u as Hospital).isActive !== false);
      if (Array.isArray(u.doctors)) setDoctors(u.doctors);
      if (Array.isArray(u.departments)) setDepartments(u.departments);
    }
  };
  const refetchStaff = async () => {
    const { data } = await adminApi.getStaff({ hospitalId, limit: 100 });
    const staffRes = data?.staff ?? data?.data ?? data;
    const staffArr = Array.isArray(staffRes) ? staffRes : (staffRes as { staff?: Staff[] })?.staff ?? [];
    setStaffList(staffArr);
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

  const openDeleteModal = () => {
    setShowDeleteModal(true);
    setDeleteReason('');
  };

  const confirmDeleteHospital = async () => {
    if (!deleteReason.trim()) return;
    setDeleting(true);
    try {
      await adminApi.deleteHospital(hospital.id, { reason: deleteReason.trim() });
      navigate('/admin/hospitals');
    } catch (err) {
      console.error('Failed to delete hospital', err);
    } finally {
      setDeleting(false);
    }
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: t('hospitalDetail.overview') },
    { id: 'people', label: t('hospitalDetail.people') || 'People' },
    { id: 'departments', label: t('hospitalDetail.departments') },
  ];

  function getDoctorName(d: Doctor): string {
    const u = d.user as { firstName?: string; lastName?: string } | undefined;
    return u ? `Dr. ${(u.firstName ?? '').trim()} ${(u.lastName ?? '').trim()}`.trim() || 'Doctor' : 'Doctor';
  }

  const toggleAccepting = async () => {
    if (!hospital) return;
    try {
      await adminApi.updateHospital(hospital.id, { isActive: !acceptingPatients });
      await refetchHospitalData();
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
                  {canEditHospital && (
                    <button type="button" onClick={() => setEditModal(true)} className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-sm font-medium flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      {t('hospitalDetail.editDetails')}
                    </button>
                  )}
                  <Link to="/admin/users?roleTab=staff" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-2">
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
                <button
                  type="button"
                  role="switch"
                  aria-checked={acceptingPatients}
                  disabled={!canEditHospital}
                  onClick={canEditHospital ? toggleAccepting : undefined}
                  className={`relative w-11 h-6 rounded-full transition ${acceptingPatients ? 'bg-blue-600' : 'bg-gray-300'} ${!canEditHospital ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
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
                <button type="button" onClick={() => setActiveTab('people')} className="text-sm font-medium text-blue-600 hover:underline">View All</button>
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

        {activeTab === 'people' && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <select value={peopleRoleFilter} onChange={(e) => setPeopleRoleFilter(e.target.value as PeopleRoleFilter)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 bg-white">
                <option value="all">{t('admin.allFilter')}</option>
                <option value="doctor">{t('auth.doctor')}</option>
                <option value="staff">{(t('employeeDirectory.employees') || 'Staff')}</option>
                <option value="customer">{t('auth.patient')}</option>
              </select>
              <select value={peopleDepartmentId} onChange={(e) => setPeopleDepartmentId(e.target.value === '' ? '' : Number(e.target.value))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 bg-white">
                <option value="">{t('adminUsers.department')} — {t('admin.allFilter')}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-gray-900">{t('hospitalDetail.people') || 'People'}</h2>
              <button type="button" onClick={() => setAddUserModal(true)} className="text-sm font-medium text-blue-600 hover:underline">+ {t('hospitalDetail.addUsers')}</button>
            </div>

            {(() => {
              const getDoctorDepartmentIds = (d: Doctor) => (d as Doctor & { doctorDepartments?: { departmentId: number }[] }).doctorDepartments?.map((dd) => dd.departmentId) ?? [];
              const filteredDoctors = (peopleRoleFilter === 'all' || peopleRoleFilter === 'doctor')
                ? doctors.filter((d) => !peopleDepartmentId || getDoctorDepartmentIds(d).includes(peopleDepartmentId))
                : [];
              const filteredStaff = (peopleRoleFilter === 'all' || peopleRoleFilter === 'staff')
                ? staffList.filter((s) => !peopleDepartmentId || (s as Staff & { departmentId?: number }).departmentId === peopleDepartmentId || (s.department?.id) === peopleDepartmentId)
                : [];
              const filteredCustomers = (peopleRoleFilter === 'all' || peopleRoleFilter === 'customer') ? customersList : [];
              const hasDoctor = filteredDoctors.length > 0;
              const hasStaff = filteredStaff.length > 0;
              const hasCustomer = filteredCustomers.length > 0;
              const isEmpty = !hasDoctor && !hasStaff && !hasCustomer && !customersLoading;

              return (
                <>
                  {customersLoading && peopleRoleFilter !== 'doctor' && peopleRoleFilter !== 'staff' && <p className="text-sm text-gray-500">{t('common.loading')}</p>}
                  {isEmpty && !customersLoading && (
                    <div className="rounded-xl bg-white border border-gray-200 p-6 text-center text-gray-500 text-sm">
                      {peopleRoleFilter === 'customer' ? (t('adminUsers.noUsersYet') || 'No customers.') : peopleRoleFilter === 'staff' ? t('hospitalDetail.noStaff') : peopleRoleFilter === 'doctor' ? t('hospitalDetail.noDoctors') : t('hospitalDetail.noDoctors')}
                    </div>
                  )}
                  {hasDoctor && (
                    <ul className="space-y-3">
                      {filteredDoctors.map((d) => (
                        <li key={`d-${d.id}`} className="rounded-xl bg-white border border-gray-200 p-4 flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                            {getDoctorName(d).slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 truncate">{getDoctorName(d)}</p>
                            <p className="text-xs text-gray-500 truncate">{(d.specializations ?? []).map((s) => s.name).join(', ') || '—'}</p>
                          </div>
                          <span className="shrink-0 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">{t('auth.doctor')}</span>
                          <Link to={`/doctors/${d.id}`} className="text-sm text-blue-600 font-medium shrink-0">{t('hospitalDetail.viewProfile')}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  {hasStaff && (
                    <ul className="space-y-3">
                      {filteredStaff.map((s) => (
                        <li key={`s-${s.id}`} className="rounded-xl bg-white border border-gray-200 p-4 flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 text-sm font-medium">
                            {s.user?.firstName?.slice(0, 1)}{s.user?.lastName?.slice(0, 1) || '?'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 truncate">{s.user?.firstName} {s.user?.lastName}</p>
                            <p className="text-xs text-gray-500 truncate">{s.jobTitle ?? (s as Staff & { position?: string }).position ?? '—'}</p>
                            {s.department && <p className="text-xs text-gray-400">{s.department.name}</p>}
                          </div>
                          <span className="shrink-0 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">Staff</span>
                          <Link to={`/admin/employees/${s.id}`} className="text-sm text-blue-600 font-medium shrink-0">{t('hospitalDetail.viewProfile')}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  {hasCustomer && (
                    <ul className="space-y-3">
                      {filteredCustomers.map((u) => (
                        <li key={`c-${u.id}`} className="rounded-xl bg-white border border-gray-200 p-4 flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-sm font-medium">
                            {(u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '') || '?'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 truncate">{[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}</p>
                            <p className="text-xs text-gray-500 truncate">{u.email ?? '—'}</p>
                          </div>
                          <span className="shrink-0 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">{t('auth.patient')}</span>
                          <Link to={`/admin/users/${u.id}`} className="text-sm text-blue-600 font-medium shrink-0">{t('hospitalDetail.viewProfile')}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              );
            })()}
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
              <button type="button" onClick={() => setAddUserModal(true)} className="text-sm font-medium text-blue-600 hover:underline">
                + {t('hospitalDetail.addUsers')}
              </button>
            </div>
            {staffList.length === 0 ? (
              <div className="rounded-xl bg-white border border-gray-200 p-6 text-center text-gray-500 text-sm">
                {t('hospitalDetail.noStaff')}
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

      {editModal && canEditHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={() => { setEditModal(false); setSaveError(''); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.editHospital')}</h3>
            <form onSubmit={saveHospital} className="space-y-4">
              {saveError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{saveError}</p>}
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
              <div ref={departmentSelectRef} className="relative">
                <label className="block text-sm font-medium text-gray-500 mb-1">{t('adminUsers.department')} (multiple)</label>
                <div
                  role="combobox"
                  aria-expanded={departmentSelectOpen}
                  onClick={() => setDepartmentSelectOpen((o) => !o)}
                  className="min-h-[42px] rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 flex flex-wrap items-center gap-2 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {editDepartmentChips.length > 0 ? (
                    editDepartmentChips.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-gray-700 text-white text-sm"
                      >
                        {name}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeDepartmentChip(name); }}
                          className="p-0.5 rounded-full hover:bg-gray-600 text-gray-200 hover:text-white"
                          aria-label={t('common.delete')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">— {t('adminUsers.selectDepartment')} —</span>
                  )}
                  <span className="ml-auto shrink-0 text-gray-400 pointer-events-none">
                    <svg className={`w-5 h-5 transition-transform ${departmentSelectOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </span>
                </div>
                {departmentSelectOpen && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto py-1">
                    {departments.filter((d) => !editDepartmentChips.includes(d.name)).map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={(e) => { e.preventDefault(); addDepartmentChip(d.name); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-100"
                      >
                        {d.name}
                      </button>
                    ))}
                    {departments.filter((d) => !editDepartmentChips.includes(d.name)).length === 0 && (
                      <p className="px-3 py-2 text-sm text-gray-500">No more departments to add</p>
                    )}
                  </div>
                )}
              </div>
              <div ref={doctorSelectRef} className="relative">
                <label className="block text-sm font-medium text-gray-500 mb-1">Doctors (select to assign)</label>
                <div
                  role="combobox"
                  aria-expanded={doctorSelectOpen}
                  onClick={() => setDoctorSelectOpen((o) => !o)}
                  className="min-h-[42px] rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 flex flex-wrap items-center gap-2 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {form.doctorIds.length > 0 ? (
                    form.doctorIds.map((id) => {
                      const d = allDoctorsForSelect.find((doc) => doc.id === id);
                      const label = d ? `Dr. ${d.user?.firstName ?? ''} ${d.user?.lastName ?? ''}`.trim() || `ID ${id}` : `ID ${id}`;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-gray-700 text-white text-sm"
                        >
                          {label}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleDoctorId(id); }}
                            className="p-0.5 rounded-full hover:bg-gray-600 text-gray-200 hover:text-white"
                            aria-label={t('common.delete')}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-gray-400 text-sm">— Select doctors —</span>
                  )}
                  <span className="ml-auto shrink-0 text-gray-400 pointer-events-none">
                    <svg className={`w-5 h-5 transition-transform ${doctorSelectOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </span>
                </div>
                {doctorSelectOpen && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto py-1">
                    {allDoctorsForSelect.slice(0, 80).map((d) => {
                      const selected = form.doctorIds.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={(e) => { e.preventDefault(); toggleDoctorId(d.id); }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${selected ? 'bg-blue-50 text-blue-800 font-medium' : 'text-gray-800'}`}
                        >
                          Dr. {d.user?.firstName} {d.user?.lastName}
                        </button>
                      );
                    })}
                    {allDoctorsForSelect.length === 0 && <p className="px-3 py-2 text-sm text-gray-500">No doctors available</p>}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Records (file)</label>
                {form.recordsUrl && <p className="text-xs text-gray-500 mb-1 truncate">{form.recordsUrl}</p>}
                <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleHospitalFileUpload('recordsUrl', f); e.target.value = ''; }} disabled={!!uploadingFile} className="w-full text-sm text-gray-600 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700" />
                {uploadingFile === 'records' && <span className="text-xs text-gray-500">{t('common.loading')}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contract (file)</label>
                {form.contractUrl && <p className="text-xs text-gray-500 mb-1 truncate">{form.contractUrl}</p>}
                <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleHospitalFileUpload('contractUrl', f); e.target.value = ''; }} disabled={!!uploadingFile} className="w-full text-sm text-gray-600 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700" />
                {uploadingFile === 'contract' && <span className="text-xs text-gray-500">{t('common.loading')}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Background image (file)</label>
                {form.backgroundImageUrl && <p className="text-xs text-gray-500 mb-1 truncate">{form.backgroundImageUrl}</p>}
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleHospitalFileUpload('backgroundImageUrl', f); e.target.value = ''; }} disabled={!!uploadingFile} className="w-full text-sm text-gray-600 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700" />
                {uploadingFile === 'background' && <span className="text-xs text-gray-500">{t('common.loading')}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input type="url" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://..." className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setEditModal(false); setSaveError(''); }} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.responsibleAdmin')}</label>
                <select value={deptForm.headId} onChange={(e) => setDeptForm((f) => ({ ...f, headId: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm">
                  <option value="">— {t('admin.selectManager')} —</option>
                  {usersForHead.map((u) => (
                    <option key={u.id} value={u.id}>{[u.firstName, u.lastName].filter(Boolean).join(' ')} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setAddDeptModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{saving ? t('admin.saving') : t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {addUserModal && hospital && (
        <AddUserModal
          open={addUserModal}
          onClose={() => setAddUserModal(false)}
          title={t('hospitalDetail.addUsers')}
          fixedHospitalId={hospital.id}
          fixedDepartments={departments}
          onSuccess={() => { refetchHospitalData(); refetchStaff(); }}
        />
      )}

      {showDeleteModal && canEditHospital && hospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">{t('admin.deleteHospital')}</h3>
            <p className="text-sm text-gray-600">{t('admin.deleteHospitalConfirm')} — {hospital.name}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminUsers.deactivateReasonLabel')} *</label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder={t('adminUsers.deactivateReasonPlaceholder')}
                rows={3}
                className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowDeleteModal(false)} disabled={deleting} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">{t('common.cancel')}</button>
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
