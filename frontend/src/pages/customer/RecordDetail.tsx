import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { patientsApi } from '../../api';
import { medicalRecordsApi } from '../../api/medical-records';
import { useAppSelector } from '../../hooks/useAppDispatch';
import type { MedicalRecord } from '../../types';
import { FullPageSkeleton } from '../../components/skeletons';

export default function RecordDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) {
      setLoading(false);
      return;
    }
    patientsApi.getMedicalRecords(user.id)
      .then(({ data }) => {
        const list = data?.data ?? data ?? [];
        const arr = Array.isArray(list) ? list : [];
        const found = arr.find((r: MedicalRecord) => String(r.id) === id);
        setRecord(found ?? null);
      })
      .catch(() => setRecord(null))
      .finally(() => setLoading(false));
  }, [user, id]);

  if (loading) return <FullPageSkeleton />;
  if (!record) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-600">Record not found.</p>
        <Link to="/customer/records" className="mt-4 text-blue-600 font-medium">Back to records</Link>
      </div>
    );
  }

  const findings = [
    { name: 'Hemoglobin', range: '13.5 - 17.5 g/dL', result: '14.2 g/dL', status: 'Normal', statusClass: 'bg-green-100 text-green-800' },
    { name: 'Glucose (Fasting)', range: '70 - 99 mg/dL', result: '105 mg/dL', status: 'High', statusClass: 'bg-orange-100 text-orange-800' },
    { name: 'White Blood Cells', range: '4.5 - 11.0 K/uL', result: '6.8 K/uL', status: 'Normal', statusClass: 'bg-green-100 text-green-800' },
    { name: 'Vitamin D', range: '30 - 100 ng/mL', result: '22 ng/mL', status: 'Low', statusClass: 'bg-red-100 text-red-800' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 h-14 flex items-center justify-between px-4">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label="Back">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">Record Details</h1>
        <button type="button" className="p-2 rounded-lg hover:bg-gray-100" aria-label="Share">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
        </button>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100">
          <span className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 text-xl">🔬</span>
          <div>
            <h2 className="font-bold text-gray-900">{record.title ?? 'Blood Test Results'}</h2>
            <p className="text-sm text-gray-500">Laboratory • Hematology</p>
            <p className="text-xs text-gray-400 mt-0.5">{record.recordDate ? new Date(record.recordDate).toLocaleString() : ''}</p>
          </div>
        </div>

        <section>
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Supervising Doctor</h3>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-gray-200" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">Dr. Sarah Jenkins</p>
              <p className="text-sm text-gray-500">General Practitioner</p>
            </div>
            <button type="button" className="p-2 rounded-lg bg-blue-50 text-blue-600">💬</button>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-900">Lab Findings</h3>
            <span className="text-sm text-blue-600 font-medium">{findings.length} Parameters</span>
          </div>
          <div className="space-y-3">
            {findings.map((f) => (
              <div key={f.name} className="p-4 rounded-xl bg-white border border-gray-100">
                <p className="font-medium text-gray-900">{f.name}</p>
                <p className="text-xs text-gray-500">Range: {f.range}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-semibold text-gray-900">{f.result}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${f.statusClass}`}>{f.status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={async () => {
              if (!record?.id) return;
              try {
                const res = await medicalRecordsApi.getRecordDownloadUrl(record.id);
                const data = res.data as { url?: string } | undefined;
                const url = data?.url;
                if (url) window.open(url, '_blank');
              } catch {
                /* noop */
              }
            }}
            className="flex-1 py-3 rounded-xl bg-teal-600 text-white font-semibold flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Download Report
          </button>
          <button type="button" className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold flex items-center justify-center gap-2">
            Share with Another Doctor
          </button>
        </div>
      </div>
    </div>
  );
}
