import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { appointmentsApi } from '../../api';
import type { Appointment } from '../../types';
import { FullPageSkeleton } from '../../components/skeletons';

export default function AppointmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const numId = Number(id);
    if (!numId) {
      setLoading(false);
      return;
    }
    appointmentsApi.getById(numId)
      .then(({ data }) => setAppointment(data?.data ?? data))
      .catch(() => setAppointment(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <FullPageSkeleton />;
  if (!appointment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-600">Appointment not found.</p>
        <Link to="/customer/appointments" className="mt-4 text-blue-600 font-medium">Back to appointments</Link>
      </div>
    );
  }

  const doctor = appointment.doctor;
  const doctorName = doctor?.user ? `Dr. ${doctor.user.firstName} ${doctor.user.lastName}` : 'Doctor';
  const specialty = doctor?.specializations?.[0]?.name ?? 'General';
  const scheduledAt = appointment.scheduledAt;
  const type = appointment.type;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 h-14 flex items-center justify-between px-4">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label="Back">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">Appointment Details</h1>
        <button type="button" className="p-2 rounded-lg hover:bg-gray-100" aria-label="More">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
        </button>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xl shrink-0">
            {doctor?.user?.firstName?.[0]}{doctor?.user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium mb-1 capitalize">{appointment.status.replace('_', ' ')}</span>
            <p className="font-bold text-gray-900">{doctorName}</p>
            <p className="text-sm text-gray-600">{specialty}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-3">
          <p className="flex items-center gap-2 text-gray-700"><span>📅</span> {scheduledAt ? new Date(scheduledAt).toLocaleString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</p>
          <p className="flex items-center gap-2 text-gray-700"><span>🕐</span> {appointment.startTime} – {appointment.endTime}</p>
          <p className="flex items-center gap-2 text-gray-700"><span>📹</span> {type === 'video' ? 'Online Consultation' : 'In-person'}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link to={`/customer/appointments/${id}/call`} className="flex flex-col items-center gap-1 p-4 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition">
            <span className="text-2xl">📞</span>
            <span className="text-sm font-medium">Join Call</span>
          </Link>
          <Link to="/customer/records" className="flex flex-col items-center gap-1 p-4 rounded-xl bg-gray-100 text-gray-700">
            <span className="text-2xl">📄</span>
            <span className="text-sm font-medium">Medical Records</span>
          </Link>
          <button type="button" className="flex flex-col items-center gap-1 p-4 rounded-xl bg-gray-100 text-gray-700">
            <span className="text-2xl">📅</span>
            <span className="text-sm font-medium">Reschedule</span>
          </button>
          <button type="button" className="flex flex-col items-center gap-1 p-4 rounded-xl bg-red-50 text-red-600">
            <span className="text-2xl">✕</span>
            <span className="text-sm font-medium">Cancel</span>
          </button>
        </div>

        <section className="p-4 rounded-2xl bg-white border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-2">Reason for Visit</h3>
          <p className="text-gray-600 text-sm">Follow-up consultation regarding recent blood pressure readings and heart rate monitoring.</p>
        </section>
      </div>
    </div>
  );
}
