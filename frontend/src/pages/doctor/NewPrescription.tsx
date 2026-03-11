import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doctorsApi } from '../../api/doctors';
import { medicalRecordsApi } from '../../api/medical-records';
import type { User } from '../../types';
import { FullPageSkeleton } from '../../components/skeletons';

const FREQUENCY_OPTIONS = ['Once daily', '2x daily', '3x daily', 'Every 4 hours', 'As needed', 'At bedtime'];

interface MedicineEntry {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export default function DoctorNewPrescription() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState<MedicineEntry[]>([
    { id: '1', name: '', dosage: '', frequency: '', duration: '', instructions: '' },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!patientId) {
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    const cancelled = { current: false };
    doctorsApi.me
      .getPatients({ signal: ctrl.signal })
      .then(({ data }) => {
        if (cancelled.current) return;
        const list = (data?.data ?? data) as User[];
        const found = Array.isArray(list) ? list.find((p) => String(p.id) === patientId) : null;
        setPatient(found ?? null);
      })
      .catch(() => { if (!cancelled.current) setPatient(null); })
      .finally(() => { if (!cancelled.current) setLoading(false); });
    return () => {
      cancelled.current = true;
      ctrl.abort();
    };
  }, [patientId]);

  function addMedicine() {
    setMedicines((prev) => [...prev, { id: String(Date.now()), name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  }

  function updateMedicine(id: string, field: keyof MedicineEntry, value: string) {
    setMedicines((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId || !patient) return;
    const medicationsText = medicines
      .filter((m) => m.name?.trim())
      .map((m) => `${m.name}${m.dosage ? ` ${m.dosage}` : ''}${m.frequency ? `, ${m.frequency}` : ''}${m.duration ? `, ${m.duration}` : ''}${m.instructions ? `; ${m.instructions}` : ''}`)
      .join('\n');
    if (!medicationsText.trim()) {
      return;
    }
    setSaving(true);
    try {
      await medicalRecordsApi.createPrescription({
        patientId: Number(patientId),
        medications: medicationsText,
        notes: medicines.some((m) => m.instructions?.trim()) ? medicines.map((m) => m.instructions).filter(Boolean).join(' | ') : undefined,
      });
      navigate(patientId ? `/doctor/patients/${patientId}` : '/doctor/patients');
    } catch {
      setSaving(false);
    }
  }

  if (loading) return <FullPageSkeleton />;

  if (!patient && patientId) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <p className="text-gray-500">Patient not found.</p>
        <Link to="/doctor/patients" className="mt-4 inline-block text-blue-600 hover:underline">Back to Patient List</Link>
      </div>
    );
  }

  const patientName = patient ? `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim() || `Patient #${patient.id}` : 'Select patient';

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label="Back">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">New Prescription</h1>
      </div>

      <div className="rounded-2xl bg-teal-50 border border-teal-100 p-4 mb-6 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-teal-200 flex items-center justify-center text-teal-700 font-bold shrink-0">
          {patient ? (patient.firstName?.[0] ?? '') + (patient.lastName?.[0] ?? '') : '?'}
        </div>
        <div>
          <p className="text-xs font-medium text-teal-600 uppercase">Patient</p>
          <p className="font-semibold text-gray-900">{patientName}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Medicine Details</h2>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-4">Step 1 of 2</p>

          {medicines.map((med) => (
            <div key={med.id} className="rounded-2xl border border-gray-200 bg-white p-5 mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </span>
                  <input
                    type="text"
                    value={med.name}
                    onChange={(e) => updateMedicine(med.id, 'name', e.target.value)}
                    placeholder="Search (e.g. Amoxicillin)"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Amoxicillin 500mg', 'Amlodipine'].map((sug) => (
                    <button key={sug} type="button" onClick={() => updateMedicine(med.id, 'name', sug)} className="px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200">
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                <input
                  type="text"
                  value={med.dosage}
                  onChange={(e) => updateMedicine(med.id, 'dosage', e.target.value)}
                  placeholder="e.g. 500mg"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <select
                  value={med.frequency}
                  onChange={(e) => updateMedicine(med.id, 'frequency', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                >
                  <option value="">Select frequency</option>
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </span>
                  <input
                    type="text"
                    value={med.duration}
                    onChange={(e) => updateMedicine(med.id, 'duration', e.target.value)}
                    placeholder="e.g. 7 days"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                <textarea
                  value={med.instructions}
                  onChange={(e) => updateMedicine(med.id, 'instructions', e.target.value)}
                  placeholder="e.g. Take after food, avoid alcohol..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm min-h-[80px] resize-none"
                  rows={3}
                />
              </div>
            </div>
          ))}

          <button type="button" onClick={addMedicine} className="w-full py-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 font-medium hover:border-teal-400 hover:text-teal-600 flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Another Medicine
          </button>
        </div>

        <button type="submit" disabled={saving} className="w-full py-4 rounded-xl bg-teal-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-teal-700 disabled:opacity-50">
          Issue Prescription
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
      </form>
    </div>
  );
}
