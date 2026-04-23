import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { appointmentsApi } from '../../api/appointments';
import type { Appointment } from '../../types';
import { FullPageSkeleton } from '../../components/skeletons';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function DoctorConsultationCall() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [quickNotes, setQuickNotes] = useState('');

  useEffect(() => {
    const numId = Number(id);
    if (!numId) {
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    const cancelled = { current: false };
    appointmentsApi
      .getById(numId, { signal: ctrl.signal })
      .then(({ data }) => {
        if (cancelled.current) return;
        setAppointment(data?.data ?? data);
      })
      .catch((err) => {
        if (!cancelled.current && err?.code !== 'ERR_CANCELED' && err?.name !== 'AbortError') {
          setAppointment(null);
        }
      })
      .finally(() => {
        if (!cancelled.current) setLoading(false);
      });
    return () => {
      cancelled.current = true;
      ctrl.abort();
    };
  }, [id]);

  useEffect(() => {
    if (!appointment) return;
    const t = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, [appointment]);

  async function handleEndCall() {
    if (id) await appointmentsApi.endCall(Number(id)).catch(() => { });
    navigate('/doctor');
  }

  if (loading || !appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {loading ? (
          <FullPageSkeleton />
        ) : (
          <p className="text-gray-600">Appointment not found.</p>
        )}
      </div>
    );
  }

  const patient = appointment.patient as { firstName?: string; lastName?: string; id?: number } | undefined;
  const patientName = patient ? `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim() || `Patient #${appointment.patientId}` : `Patient #${appointment.patientId}`;
  const patientId = patient?.id ?? appointment.patientId;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label="Back">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="text-center">
          <p className="font-semibold text-gray-900">{patientName}</p>
          <p className="text-sm text-gray-500">{formatDuration(duration)}</p>
        </div>
        <Link to={patientId ? `/doctor/patients/${patientId}` : '#'} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600" aria-label="Patient info">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </Link>
      </header>

      <main className="flex-1 relative p-4 overflow-hidden">
        <div className="absolute inset-4 rounded-2xl bg-gray-200 flex items-center justify-center overflow-hidden">
          <div className="text-center text-gray-500">
            <div className="w-24 h-24 mx-auto rounded-full bg-gray-300 flex items-center justify-center text-3xl font-bold text-gray-500 mb-2">
              {patientName.split(' ').map((n) => n[0]).join('').slice(0, 2) || '?'}
            </div>
            <p className="font-semibold">{patientName}</p>
            <p className="text-sm">Video consultation</p>
          </div>
        </div>
        <div className="absolute top-6 right-6 w-24 h-32 rounded-xl bg-white border border-gray-200 overflow-hidden shadow flex items-center justify-center">
          <span className="text-xs text-gray-500">You</span>
        </div>

        <div className="absolute bottom-4 left-4 right-4 max-w-md space-y-2">
          <div className="rounded-xl bg-white/95 backdrop-blur border border-gray-200 p-3 shadow">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              <span className="text-xs font-semibold text-gray-500 uppercase">Quick Notes</span>
              <span className="ml-auto text-xs text-gray-400">CLINICAL</span>
            </div>
            <textarea
              value={quickNotes}
              onChange={(e) => setQuickNotes(e.target.value)}
              placeholder="Type your clinical notes here..."
              className="w-full min-h-[80px] rounded-lg border border-gray-200 p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
            />
          </div>
          <div className="rounded-xl bg-white/95 backdrop-blur border border-gray-200 p-3 shadow flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <span className="text-xs font-semibold text-gray-500 uppercase">Latest Message</span>
            <span className="flex-1 truncate text-sm text-gray-600">Patient: I have a question about...</span>
          </div>
        </div>
      </main>

      <div className="p-4 bg-white border-t border-gray-200">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-6 flex-wrap">
          <button type="button" onClick={() => setMuted((m) => !m)} className="flex flex-col items-center gap-0.5 text-gray-700 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {muted ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />}
            </svg>
            <span className="text-xs">Mute</span>
          </button>
          <button type="button" className="flex flex-col items-center gap-0.5 text-gray-700 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            <span className="text-xs">Video</span>
          </button>
          <button type="button" className="flex flex-col items-center gap-0.5 text-gray-700 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            <span className="text-xs">Share</span>
          </button>
          <button type="button" onClick={handleEndCall} className="flex flex-col items-center gap-0.5 text-red-600 hover:text-red-700">
            <span className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21l-1.498-4.493A1 1 0 0016.28 3H5z" /></svg>
            </span>
            <span className="text-xs font-medium">End</span>
          </button>
        </div>
      </div>
    </div>
  );
}
