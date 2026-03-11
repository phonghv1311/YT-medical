import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../contexts/LanguageContext';
import { doctorsApi } from '../../../api/doctors';

type Specialization = { id: number; name: string };
type Hospital = { id: number; name: string };
type Department = { id: number; name: string; hospitalId: number };

export default function DoctorOnboardingStep1() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [specialtyId, setSpecialtyId] = useState<number | ''>('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    Promise.all([
      doctorsApi.getSpecializations({ signal: ctrl.signal }),
      doctorsApi.getHospitals({ signal: ctrl.signal }),
    ])
      .then(([specRes, hospRes]) => {
        const specList = Array.isArray(specRes.data) ? specRes.data : (specRes.data as any)?.data ?? [];
        const hospList = Array.isArray(hospRes.data) ? hospRes.data : (hospRes.data as any)?.data ?? [];
        setSpecializations(specList);
        setHospitals(hospList);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    if (!selectedHospital?.id) {
      setDepartments([]);
      setDepartmentId('');
      return;
    }
    const ctrl = new AbortController();
    doctorsApi.getDepartments(selectedHospital.id, { signal: ctrl.signal })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data as any)?.data ?? [];
        setDepartments(list);
        setDepartmentId('');
      })
      .catch(() => setDepartments([]))
      .finally(() => { });
    return () => ctrl.abort();
  }, [selectedHospital?.id]);

  const filteredHospitals = useMemo(() => {
    if (!hospitalSearch.trim()) return hospitals.slice(0, 10);
    const q = hospitalSearch.trim().toLowerCase();
    return hospitals.filter((h) => h.name.toLowerCase().includes(q)).slice(0, 10);
  }, [hospitals, hospitalSearch]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const [firstName, ...lastParts] = fullName.trim().split(/\s+/);
    const lastName = lastParts.join(' ') || firstName;
    setSubmitting(true);
    try {
      await doctorsApi.updateOnboarding({
        firstName: firstName || fullName,
        lastName,
        licenseNumber: licenseNumber || undefined,
        primaryDepartmentId: departmentId ? Number(departmentId) : undefined,
        specializationIds: specialtyId ? [Number(specialtyId)] : undefined,
      });
      navigate('/register/doctor/step-2', { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{t('onboarding.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center gap-4 px-4 h-14 border-b border-gray-100">
        <Link to="/doctor" className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-900">{t('onboarding.professionalInfo')}</h1>
      </header>

      <main className="px-4 max-w-lg mx-auto py-6">
        <p className="text-sm text-gray-500 mb-1">{t('onboarding.stepOf', { current: '2', total: '5' })}</p>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1">
          <div className="h-full w-2/5 bg-blue-600 rounded-full" />
        </div>
        <p className="text-sm font-medium text-gray-700 mb-6">{t('onboarding.affiliationDetails')}</p>

        <div className="mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">{t('onboarding.professionalAffiliation')}</h2>
          <p className="text-sm text-gray-500">
            {t('onboarding.affiliationDescription')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('onboarding.fullName')}</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('onboarding.fullNamePlaceholder')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('onboarding.medicalLicense')}</label>
            <input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder={t('onboarding.medicalLicensePlaceholder')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('onboarding.professionalSpecialty')}</label>
            <select
              value={specialtyId}
              onChange={(e) => setSpecialtyId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">{t('onboarding.selectSpecialty')}</option>
              {specializations.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('onboarding.department')}</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={!selectedHospital}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">{t('onboarding.selectDepartment')}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('onboarding.primaryHospital')}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input
                type="text"
                value={hospitalSearch}
                onChange={(e) => setHospitalSearch(e.target.value)}
                onFocus={() => setHospitalSearch((s) => s)}
                placeholder={t('onboarding.searchHospital')}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {hospitalSearch && filteredHospitals.length > 0 && (
              <ul className="mt-1 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-lg max-h-48 overflow-y-auto">
                {filteredHospitals.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedHospital(h);
                        setHospitalSearch('');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-900"
                    >
                      {h.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {selectedHospital && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-800 text-sm">
                <span>{selectedHospital.name}</span>
                <button
                  type="button"
                  onClick={() => { setSelectedHospital(null); setDepartmentId(''); }}
                  className="p-0.5 rounded hover:bg-blue-200"
                  aria-label="Remove"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 flex gap-3">
            <span className="text-blue-600 flex-shrink-0 mt-0.5" aria-hidden>ⓘ</span>
            <p className="text-sm text-blue-800">
              {t('onboarding.affiliationNote')}
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {t('onboarding.continueToPersonal')}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </form>
      </main>
    </div>
  );
}
