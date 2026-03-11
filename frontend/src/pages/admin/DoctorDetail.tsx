import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { doctorsApi } from '../../api/doctors';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Doctor, Schedule, Appointment } from '../../types';
import { FullPageSkeleton } from '../../components/skeletons';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTime(time: string): string {
  if (!time) return '—';
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

type TabId = 'overview' | 'schedule' | 'patients' | 'achievements';

export default function AdminDoctorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const doctorId = id ? parseInt(id, 10) : NaN;

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  useEffect(() => {
    if (!id || Number.isNaN(doctorId)) {
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    Promise.all([
      doctorsApi.getById(doctorId, { signal }).then((r) => r.data?.data ?? r.data),
      doctorsApi.getSchedule(doctorId, { signal }).then((r) => (r.data?.data ?? r.data) as Schedule[]),
      doctorsApi.getAppointments(doctorId, { signal }).then((r) => (r.data?.data ?? r.data ?? (r.data as { appointments?: Appointment[] })?.appointments ?? []) as Appointment[]).catch(() => []),
    ])
      .then(([doc, sched, appts]) => {
        if (signal.aborted) return;
        setDoctor((doc as Doctor) ?? null);
        setSchedules(Array.isArray(sched) ? sched : []);
        setAppointments(Array.isArray(appts) ? appts : []);
      })
      .catch(() => { if (!signal.aborted) setDoctor(null); })
      .finally(() => { if (!signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [id, doctorId]);

  if (loading) {
    return <FullPageSkeleton />;
  }

  if (!doctor) {
    return (
      <div className="p-4">
        <p className="text-gray-500">Doctor not found.</p>
        <Link to="/admin/doctors" className="mt-4 inline-block text-blue-600 hover:underline">Back to Doctors</Link>
      </div>
    );
  }

  const u = doctor.user as { firstName?: string; lastName?: string; email?: string; phone?: string } | undefined;
  const fullName = u ? `Dr. ${(u.firstName ?? '').trim()} ${(u.lastName ?? '').trim()}`.trim() || 'Doctor' : 'Doctor';

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'schedule', label: 'Work schedule' },
    { id: 'patients', label: 'Appointments / Patients' },
    { id: 'achievements', label: 'Achievements' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-2">
          <button type="button" onClick={() => navigate('/admin/doctors')} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900 truncate flex-1">{fullName}</h1>
          <Link to={`/doctors/${doctor.id}`} className="p-2 rounded-lg hover:bg-gray-100 text-gray-700" aria-label="Public profile">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </Link>
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
                  <dt className="text-gray-500">Specialty</dt>
                  <dd className="text-gray-900">{(doctor.specializations ?? []).map((s) => s.name).join(', ') || '—'}</dd>
                </div>
                {doctor.expertise && (
                  <div>
                    <dt className="text-gray-500">Expertise</dt>
                    <dd className="text-gray-900">{doctor.expertise}</dd>
                  </div>
                )}
                {doctor.yearsOfExperience != null && (
                  <div>
                    <dt className="text-gray-500">Years of experience</dt>
                    <dd className="text-gray-900">{doctor.yearsOfExperience}</dd>
                  </div>
                )}
                {doctor.startDate && (
                  <div>
                    <dt className="text-gray-500">Start date (hospital)</dt>
                    <dd className="text-gray-900">{doctor.startDate}</dd>
                  </div>
                )}
                {doctor.bio && (
                  <div>
                    <dt className="text-gray-500">Introduction / Bio</dt>
                    <dd className="text-gray-900 whitespace-pre-wrap">{doctor.bio}</dd>
                  </div>
                )}
                {(doctor.recordsUrl || doctor.contractUrl) && (
                  <div className="pt-2 flex flex-wrap gap-3">
                    {doctor.recordsUrl && <a href={doctor.recordsUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 font-medium hover:underline">Records</a>}
                    {doctor.contractUrl && <a href={doctor.contractUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 font-medium hover:underline">Contract</a>}
                  </div>
                )}
              </dl>
            </div>
          </section>
        )}

        {activeTab === 'schedule' && (
          <section className="space-y-4">
            <p className="text-sm text-gray-500">Weekly work schedule.</p>
            {schedules.length === 0 ? (
              <div className="rounded-xl bg-white border border-gray-200 p-6 text-center text-gray-500 text-sm">No schedule set.</div>
            ) : (
              <ul className="space-y-3">
                {schedules
                  .filter((s) => s.isActive !== false)
                  .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                  .map((s) => (
                    <li key={s.id} className="rounded-xl bg-white border border-gray-200 p-4 flex justify-between items-center">
                      <span className="font-medium text-gray-900">{DAY_NAMES[s.dayOfWeek] ?? `Day ${s.dayOfWeek}`}</span>
                      <span className="text-sm text-gray-600">{formatTime(s.startTime)} – {formatTime(s.endTime)}</span>
                    </li>
                  ))}
              </ul>
            )}
          </section>
        )}

        {activeTab === 'patients' && (
          <section className="space-y-4">
            <p className="text-sm text-gray-500">Patients scheduled with this doctor (appointments).</p>
            {appointments.length === 0 ? (
              <div className="rounded-xl bg-white border border-gray-200 p-6 text-center text-gray-500 text-sm">No appointments.</div>
            ) : (
              <ul className="space-y-3">
                {appointments.slice(0, 50).map((a) => (
                  <li key={a.id} className="rounded-xl bg-white border border-gray-200 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {(a.patient as { firstName?: string; lastName?: string })?.firstName} {(a.patient as { firstName?: string; lastName?: string })?.lastName || `Patient #${a.patientId}`}
                        </p>
                        <p className="text-xs text-gray-500">{a.scheduledAt} · {a.status}</p>
                      </div>
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${a.status === 'completed' ? 'bg-green-100 text-green-700' :
                          a.status === 'cancelled' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'
                        }`}>{a.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {activeTab === 'achievements' && (
          <section className="space-y-4">
            <p className="text-sm text-gray-500">Awards, publications, and other achievements (placeholder).</p>
            <div className="rounded-xl bg-white border border-gray-200 p-6 text-center text-gray-500 text-sm">
              No achievements recorded yet. This section can be extended with a dedicated model and admin UI.
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
