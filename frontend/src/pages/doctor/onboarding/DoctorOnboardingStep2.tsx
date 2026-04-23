import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../contexts/LanguageContext';
import { doctorsApi } from '../../../api/doctors';

type Hospital = { id: number; name: string };
type Department = { id: number; name: string; hospitalId: number };

type ScheduleSegment = 'morning' | 'afternoon' | 'evening';

export default function DoctorOnboardingStep2() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [position, setPosition] = useState('');
  const [scheduleSegment, setScheduleSegment] = useState<ScheduleSegment>('morning');
  const [shiftStart, setShiftStart] = useState('08:00');
  const [shiftEnd, setShiftEnd] = useState('12:00');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    doctorsApi.getHospitals({ signal: ctrl.signal })
      .then((res) => {
        const raw = res.data as unknown;
        const list = Array.isArray(raw) ? raw : (raw as { data?: unknown[] })?.data ?? (raw as { hospitals?: unknown[] })?.hospitals ?? [];
        setHospitals(Array.isArray(list) ? list : []);
      })
      .catch(() => setHospitals([]))
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
        const list = Array.isArray(res.data) ? res.data : (res.data as { data?: unknown[] })?.data ?? [];
        setDepartments(Array.isArray(list) ? list : []);
        setDepartmentId('');
      })
      .catch(() => setDepartments([]));
    return () => ctrl.abort();
  }, [selectedHospital?.id]);

  const filteredHospitals = useMemo(() => {
    if (!hospitalSearch.trim()) return hospitals.slice(0, 10);
    const q = hospitalSearch.trim().toLowerCase();
    return hospitals.filter((h) => h.name.toLowerCase().includes(q)).slice(0, 10);
  }, [hospitals, hospitalSearch]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) return;
    setSubmitting(true);
    try {
      await doctorsApi.updateOnboarding({
        primaryDepartmentId: departmentId ? Number(departmentId) : undefined,
      });
      navigate('/register/doctor/pending', { replace: true });
    } catch {
      navigate('/doctor', { replace: true });
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
        <Link to="/register/doctor" className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-900">{t('auth.workplaceTitle')}</h1>
      </header>

      <main className="px-4 max-w-lg mx-auto py-6 pb-32">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500 uppercase tracking-wide">{t('auth.completeRegistrationStep')}</span>
          <span className="text-xs text-gray-500">{t('auth.step')} 2/2</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-6">
          <div className="h-full w-full bg-blue-600 rounded-full" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">{t('auth.hospitalClinic')} *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={hospitalSearch}
                onChange={(e) => setHospitalSearch(e.target.value)}
                placeholder={t('auth.searchHospitalPlaceholder')}
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>
            {hospitalSearch && filteredHospitals.length > 0 && (
              <ul className="mt-1 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-lg max-h-48 overflow-y-auto">
                {filteredHospitals.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedHospital(h);
                        setHospitalSearch(h.name);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-900"
                    >
                      {h.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">{t('auth.departmentRequired')} *</label>
            <div className="relative">
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={!selectedHospital}
                className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">{t('auth.selectDepartmentPlaceholder')}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">{t('auth.position')} *</label>
            <div className="relative">
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
              >
                <option value="">{t('auth.selectPosition')}</option>
                <option value="doctor">Doctor</option>
                <option value="specialist">Specialist</option>
                <option value="senior">Senior Doctor</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">{t('auth.workSchedule')} *</label>
            <div className="flex gap-2 p-1 rounded-xl bg-gray-100">
              {(['morning', 'afternoon', 'evening'] as const).map((seg) => (
                <button
                  key={seg}
                  type="button"
                  onClick={() => setScheduleSegment(seg)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                    scheduleSegment === seg
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {seg === 'morning' ? t('auth.morning') : seg === 'afternoon' ? t('auth.afternoon') : t('auth.evening')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">{t('auth.workShift')}</label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={shiftStart}
                onChange={(e) => setShiftStart(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-gray-500 text-sm">{t('auth.to')}</span>
              <input
                type="time"
                value={shiftEnd}
                onChange={(e) => setShiftEnd(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              {t('auth.agreeTermsPrivacy')}{' '}
              <Link to="/terms" className="text-blue-600 underline">{t('common.termsOfService')}</Link>{' '}
              {t('auth.and')}{' '}
              <Link to="/privacy" className="text-blue-600 underline">{t('common.privacyPolicy')}</Link>.
            </span>
          </label>

          <div className="fixed bottom-0 left-0 right-0 z-20 p-4 pb-6 bg-white border-t border-gray-200 max-w-lg mx-auto">
            <button
              type="submit"
              disabled={submitting || !agreeTerms}
              className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold uppercase tracking-wide disabled:opacity-50 interactive-btn"
            >
              {submitting ? t('common.loading') : t('auth.registerButton')}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
