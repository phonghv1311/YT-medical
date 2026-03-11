import { useEffect, useState } from 'react';
import { doctorsApi } from '../../api/doctors';
import { appointmentsApi } from '../../api/appointments';
import type { Appointment } from '../../types';
import { TableSkeleton } from '../../components/skeletons';

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const;

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');

  const [notesModal, setNotesModal] = useState<{ id: number; notes: string } | null>(null);
  const [notesSaving, setNotesSaving] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    const cancelled = { current: false };
    doctorsApi.me.getAppointments({ signal: ctrl.signal })
      .then(({ data }) => {
        if (cancelled.current) return;
        setAppointments(data?.data ?? data ?? []);
      })
      .catch((err) => {
        if (!cancelled.current && err?.code !== 'ERR_CANCELED' && err?.name !== 'AbortError') {
          console.error('Failed to load appointments', err);
        }
      })
      .finally(() => { if (!cancelled.current) setLoading(false); });
    return () => {
      cancelled.current = true;
      ctrl.abort();
    };
  }, []);

  async function handleConfirm(id: number) {
    await appointmentsApi.confirm(id);
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'confirmed' } : a)));
  }

  async function handleStartCall(id: number) {
    await appointmentsApi.startCall(id);
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'in_progress' } : a)));
  }

  async function handleEndCall(id: number) {
    await appointmentsApi.endCall(id);
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'completed' } : a)));
  }

  async function handleSaveNotes() {
    if (!notesModal) return;
    setNotesSaving(true);
    try {
      // Notes are saved as part of the appointment — use a generic PUT or a notes-specific endpoint
      // For now we'll update locally; backend endpoint may vary
      setAppointments((prev) =>
        prev.map((a) => (a.id === notesModal.id ? { ...a, notes: notesModal.notes } : a)),
      );
      setNotesModal(null);
    } finally {
      setNotesSaving(false);
    }
  }

  const filtered = appointments.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (dateFilter && !a.scheduledAt?.startsWith(dateFilter)) return false;
    return true;
  });

  if (loading) {
    return (
      <TableSkeleton rows={6} cols={6} headerLabels={['Date', 'Time', 'Patient', 'Type', 'Status', 'Actions']} />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 bg-white p-4 rounded-xl border border-gray-200">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2 border">
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2 border" />
        </div>
        {(statusFilter !== 'all' || dateFilter) && (
          <button onClick={() => { setStatusFilter('all'); setDateFilter(''); }} className="text-sm text-blue-600 hover:underline">Clear filters</button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="text-gray-500">No appointments match the current filters.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date / Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((appt, i) => (
                <tr key={appt.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {appt.patient ? `${appt.patient.firstName} ${appt.patient.lastName}` : `Patient #${appt.patientId}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {appt.scheduledAt?.split('T')[0]} &middot; {appt.startTime} – {appt.endTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[appt.status] ?? 'bg-gray-100 text-gray-800'}`}>
                      {appt.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{appt.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    {appt.status === 'pending' && (
                      <button onClick={() => handleConfirm(appt.id)} className="text-xs px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">Confirm</button>
                    )}
                    {appt.status === 'confirmed' && (
                      <button onClick={() => handleStartCall(appt.id)} className="text-xs px-3 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 transition">Start Call</button>
                    )}
                    {appt.status === 'in_progress' && (
                      <button onClick={() => handleEndCall(appt.id)} className="text-xs px-3 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">End Call</button>
                    )}
                    <button
                      onClick={() => setNotesModal({ id: appt.id, notes: appt.notes ?? '' })}
                      className="text-xs px-3 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                    >
                      Add Notes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes Modal */}
      {notesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setNotesModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">Appointment Notes</h3>
            <textarea
              rows={5}
              value={notesModal.notes}
              onChange={(e) => setNotesModal({ ...notesModal, notes: e.target.value })}
              className="w-full rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-4 py-3"
              placeholder="Add your notes here..."
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setNotesModal(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleSaveNotes} disabled={notesSaving} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50">
                {notesSaving ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
