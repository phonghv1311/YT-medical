import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { patientsApi } from '../../api';
import { medicalRecordsApi } from '../../api/medical-records';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { useLanguage } from '../../contexts/LanguageContext';
import type { MedicalRecord } from '../../types';
import { FullPageSkeleton } from '../../components/skeletons';

type RecordExtended = MedicalRecord & {
  doctorName?: string;
  hospitalName?: string;
  diagnosis?: string;
  doctorNotes?: string;
  prescriptions?: { name: string; dosage: string; quantity: string; unit?: string }[];
};

export default function RecordDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const user = useAppSelector((s) => s.auth.user);
  const [record, setRecord] = useState<RecordExtended | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) {
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    patientsApi.getMedicalRecords(user.id, { signal: ctrl.signal })
      .then(({ data }) => {
        const list = data?.data ?? data ?? [];
        const arr = Array.isArray(list) ? list : [];
        const found = arr.find((r: MedicalRecord) => String(r.id) === id);
        setRecord(found ?? null);
      })
      .catch((err) => { if (err?.code !== 'ERR_CANCELED') setRecord(null); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [user, id]);

  if (loading) return <FullPageSkeleton />;
  if (!record) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-600">Record not found.</p>
        <Link to="/customer/records" className="mt-4 text-blue-600 font-medium">{t('common.back')}</Link>
      </div>
    );
  }

  const prescriptions = record.prescriptions ?? [
    { name: 'Amoxicillin 500mg', dosage: 'Sáng 1 viên, Chiều 1 viên (Sau ăn)', quantity: '10', unit: 'VIÊN' },
    { name: 'Paracetamol 500mg', dosage: 'Uống 1 viên khi sốt > 38.5°C', quantity: '05', unit: 'VIÊN' },
    { name: 'Alpha Choay', dosage: 'Ngậm 2 viên/lần, 2 lần/ngày', quantity: '20', unit: 'VIÊN' },
  ];
  const diagnosisText = record.diagnosis ?? 'Viêm họng cấp tính, theo dõi amidan quá phát độ II.';
  const doctorNotesText = record.doctorNotes ?? 'Bệnh nhân cần nghỉ ngơi, tránh uống nước lạnh. Súc họng bằng nước muối sinh lý 3 lần/ngày. Tái khám sau 5 ngày nếu không thuyên giảm.';

  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 h-14 flex items-center justify-between px-4">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">{t('customerRecordDetail.title')}</h1>
        <div className="w-10" />
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        <div className="flex items-center gap-3 p-4">
          <div className="w-14 h-14 rounded-xl bg-gray-200 shrink-0 overflow-hidden">
            <div className="w-full h-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-lg">BS</div>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-gray-900 text-lg">BS. {record.doctorName ?? '—'}</h2>
            <p className="text-sm text-blue-600">Chuyên khoa Nội tổng quát</p>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {t('customerRecordDetail.examinationDate')}: {record.recordDate ? new Date(record.recordDate).toLocaleDateString('vi-VN') : '—'}
            </p>
          </div>
        </div>

        <section>
          <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </span>
            {t('customerRecordDetail.diagnosis')}
          </h3>
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
            <p className="text-gray-700">{diagnosisText}</p>
          </div>
        </section>

        <section>
          <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </span>
            {t('customerRecordDetail.doctorNotes')}
          </h3>
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
            <p className="text-gray-700">{doctorNotesText}</p>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              </span>
              {t('customerRecordDetail.prescription')}
            </h3>
            <span className="text-xs text-gray-500 px-2 py-0.5 rounded-full bg-gray-100">{prescriptions.length} {t('customerRecordDetail.medicineTypes')}</span>
          </div>
          <div className="space-y-3">
            {prescriptions.map((med, i) => (
              <div key={i} className="rounded-xl bg-gray-50 border border-gray-100 p-4 flex gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{med.name}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{med.dosage}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-blue-600 font-semibold">{med.quantity}</span>
                  <p className="text-xs text-gray-500">{med.unit ?? 'VIÊN'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex gap-3 pt-2">
          <button type="button" className="flex-1 py-3 rounded-xl border border-blue-600 text-blue-600 font-medium flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            {t('customerRecordDetail.share')}
          </button>
          <button
            type="button"
            onClick={async () => {
              if (!record?.id) return;
              try {
                const res = await medicalRecordsApi.getRecordDownloadUrl(record.id);
                const data = res.data as { url?: string } | undefined;
                if (data?.url) window.open(data.url, '_blank');
              } catch {
                /* noop */
              }
            }}
            className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {t('customerRecordDetail.downloadPdf')}
          </button>
        </div>
      </div>
    </div>
  );
}
