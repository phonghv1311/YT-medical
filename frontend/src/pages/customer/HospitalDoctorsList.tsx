import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminApi } from '../../api/admin';
import { doctorsApi } from '../../api/doctors';
import { DoctorCardSkeleton } from '../../components/skeletons';
import type { Doctor } from '../../types';

function getDoctorName(d: Doctor): string {
  const u = d.user as { firstName?: string; lastName?: string } | undefined;
  return u ? `Dr. ${(u.firstName ?? '').trim()} ${(u.lastName ?? '').trim()}`.trim() || 'Doctor' : 'Doctor';
}

function getSpecialty(d: Doctor): string {
  const specs = (d as Doctor & { specializations?: { name: string }[] }).specializations;
  return specs?.[0]?.name ?? 'General';
}

export default function HospitalDoctorsList() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const hospitalId = id ? parseInt(id, 10) : NaN;
  const [hospitalName, setHospitalName] = useState<string>('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || isNaN(hospitalId)) {
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    const cancelled = { current: false };
    Promise.all([
      adminApi.getHospital(hospitalId, { signal }).then((r) => {
        if (!cancelled.current) setHospitalName((r.data?.data ?? r.data)?.name ?? '');
      }),
      doctorsApi.getAll({ hospitalId, limit: 50 }, { signal }).then((r) => {
        if (cancelled.current) return;
        const list = r.data?.doctors ?? r.data?.data?.doctors ?? r.data ?? [];
        setDoctors(Array.isArray(list) ? list : []);
      }),
    ]).catch(() => { if (!cancelled.current) setDoctors([]); }).finally(() => { if (!cancelled.current) setLoading(false); });
    return () => {
      cancelled.current = true;
      ctrl.abort();
    };
  }, [id, hospitalId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <DoctorCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2 h-14 px-4">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label="Back">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex-1">{t('customer.doctorsAtThisHospital')}</h1>
        </div>
      </header>
      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {hospitalName && <p className="text-sm text-gray-600 mb-2">{hospitalName}</p>}
        {doctors.length === 0 ? (
          <p className="text-gray-500 py-12">No doctors at this hospital.</p>
        ) : (
          doctors.map((d) => (
            <Link
              key={d.id}
              to={`/doctors/${d.id}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition"
            >
              <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0">
                {(d.user as { firstName?: string } | undefined)?.firstName?.[0]}
                {(d.user as { lastName?: string } | undefined)?.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{getDoctorName(d)}</p>
                <p className="text-sm text-blue-600">{getSpecialty(d)}</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
