import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appointmentsApi } from '../../api';
import { FullPageSkeleton } from '../../components/skeletons';
import type { Appointment } from '../../types';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ConsultationCall() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);

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

  useEffect(() => {
    if (!appointment) return;
    const t = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, [appointment]);

  if (loading || !appointment) {
    return loading ? <FullPageSkeleton /> : (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-gray-600">Appointment not found.</p>
      </div>
    );
  }

  const doctor = appointment.doctor;
  const doctorName = doctor?.user ? `Dr. ${(doctor.user as { firstName?: string }).firstName} ${(doctor.user as { lastName?: string }).lastName}` : 'Doctor';

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="flex items-center justify-between px-4 py-3">
        <button type="button" onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white" aria-label="Back">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="text-center">
          <p className="text-white font-semibold">{doctorName}</p>
          <p className="flex items-center justify-center gap-1.5 text-sm text-white/80">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {formatDuration(duration)}
          </p>
        </div>
        <button type="button" className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white" aria-label="Options">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
        </button>
      </header>

      <main className="flex-1 relative flex items-center justify-center p-4">
        <div className="w-full aspect-video max-w-2xl rounded-2xl bg-teal-900/80 flex items-center justify-center overflow-hidden">
          <div className="text-center text-white/90">
            <div className="w-24 h-24 mx-auto rounded-full bg-teal-700 flex items-center justify-center text-4xl font-bold text-teal-200 mb-2">
              {doctor?.user ? `${(doctor.user as { firstName?: string }).firstName?.[0] ?? ''}${(doctor.user as { lastName?: string }).lastName?.[0] ?? ''}` : '?'}
            </div>
            <p className="font-semibold">{doctorName}</p>
            <p className="text-sm text-white/70">Video consultation</p>
          </div>
        </div>
        <div className="absolute bottom-4 right-4 w-28 h-36 rounded-xl bg-gray-800 overflow-hidden border-2 border-white/20">
          <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white/80 text-sm">You</div>
        </div>
      </main>

      <div className="p-4 pb-8">
        <div className="max-w-lg mx-auto rounded-full bg-gray-800 px-6 py-4 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className="flex flex-col items-center gap-0.5 text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {muted ? (
                <>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </>
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              )}
            </svg>
            <span className="text-xs">Mute</span>
          </button>
          <button type="button" className="flex flex-col items-center gap-0.5 text-white" aria-label="Flip camera">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            <span className="text-xs">Flip</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(`/customer/appointments/${id}`)}
            className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-white"
            aria-label="End call"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21l-1.498-4.493A1 1 0 0016.28 3H5z" /></svg>
          </button>
          <span className="text-xs text-white/70">END</span>
          <button type="button" className="flex flex-col items-center gap-0.5 text-white" aria-label="Chat">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <span className="text-xs">Chat</span>
          </button>
          <button type="button" className="flex flex-col items-center gap-0.5 text-white" aria-label="Info">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="text-xs">Info</span>
          </button>
        </div>
        <p className="text-center mt-3 flex items-center justify-center gap-2 text-sm text-white/70">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          Strong Connection
        </p>
      </div>
    </div>
  );
}
