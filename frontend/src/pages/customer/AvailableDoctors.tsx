import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doctorsApi } from '../../api/doctors';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Doctor, AvailabilitySlot } from '../../types';
import { DoctorCardSkeleton } from '../../components/skeletons';

const SPECIALTY_KEYS = ['all', 'general', 'cardiology', 'dermatology', 'pediatrics', 'neurology'] as const;
const SPECIALTY_API: Record<string, string> = {
  all: '',
  general: 'General',
  cardiology: 'Cardiology',
  dermatology: 'Dermatology',
  pediatrics: 'Pediatrics',
  neurology: 'Neurology',
};

function toDateOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function formatSlotTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}
function formatNextAvailable(d: Date, time: string): string {
  const today = toDateOnly(new Date());
  const slotDate = toDateOnly(d);
  if (slotDate.getTime() === today.getTime()) return `Today, ${formatSlotTime(time)}`;
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (slotDate.getTime() === tomorrow.getTime()) return `Tomorrow, ${formatSlotTime(time)}`;
  return `${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}, ${formatSlotTime(time)}`;
}

function getDoctorName(d: Doctor): string {
  const u = d.user as { firstName?: string; lastName?: string } | undefined;
  return u ? `Dr. ${(u.firstName ?? '').trim()} ${(u.lastName ?? '').trim()}`.trim() || 'Doctor' : 'Doctor';
}
function getSpecialty(d: Doctor): string {
  const specs = (d as Doctor & { specializations?: { name: string }[] }).specializations;
  return specs?.[0]?.name ?? 'General';
}

export default function AvailableDoctors() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialtyKey, setSpecialtyKey] = useState<typeof SPECIALTY_KEYS[number]>('all');
  const [nextSlots, setNextSlots] = useState<Record<number, { date: Date; startTime: string }>>({});

  useEffect(() => {
    const ctrl = new AbortController();
    const cancelled = { current: false };
    setLoading(true);
    const apiSpec = specialtyKey === 'all' ? undefined : SPECIALTY_API[specialtyKey];
    doctorsApi
      .getAll({ specialty: apiSpec, limit: 5 }, { signal: ctrl.signal })
      .then((r) => {
        if (cancelled.current) return;
        const list = r.data?.doctors ?? r.data?.data?.doctors ?? r.data ?? [];
        setDoctors(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        if (!cancelled.current && err?.code !== 'ERR_CANCELED' && err?.name !== 'AbortError') setDoctors([]);
      })
      .finally(() => { if (!cancelled.current) setLoading(false); });
    return () => {
      cancelled.current = true;
      ctrl.abort();
    };
  }, [specialtyKey]);

  useEffect(() => {
    if (doctors.length === 0) {
      setNextSlots({});
      return;
    }
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    const todayStr = `${toDateOnly(new Date()).getFullYear()}-${String(toDateOnly(new Date()).getMonth() + 1).padStart(2, '0')}-${String(toDateOnly(new Date()).getDate()).padStart(2, '0')}`;
    Promise.all(
      doctors.map((doc) =>
        doctorsApi.getAvailability(doc.id, todayStr, { signal }).then((res) => {
          if (signal.aborted) return null;
          const raw = res.data?.data ?? res.data;
          const slots: AvailabilitySlot[] = Array.isArray(raw) ? raw : [];
          const first = slots.find((s) => !s.isBooked);
          return first ? { docId: doc.id, first } : null;
        }).catch(() => null)
      )
    ).then((results) => {
      if (signal.aborted) return;
      const next: Record<number, { date: Date; startTime: string }> = {};
      results.forEach((r) => {
        if (r) next[r.docId] = { date: toDateOnly(new Date()), startTime: r.first.startTime };
      });
      setNextSlots(next);
    });
    return () => ctrl.abort();
  }, [doctors]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center justify-between h-14 px-4">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label="Back">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">{t('consult.availableDoctors')}</h1>
        <button type="button" className="p-2 rounded-lg hover:bg-gray-100" aria-label="Search">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </button>
      </header>

      <div className="sticky top-14 z-[9] bg-white border-b border-gray-100 px-4 py-2 flex gap-2 overflow-x-auto">
        <button
          type="button"
          className={`shrink-0 flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium ${specialtyKey === 'all' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-gray-50 text-gray-700'}`}
        >
          {t('consult.specialty')}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        <button type="button" className="shrink-0 flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
          Availability
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        <button type="button" className="shrink-0 flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
          Gender
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {SPECIALTY_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSpecialtyKey(key)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${specialtyKey === key ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
            >
              {t(`consult.${key}`)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4 mt-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            {[1, 2, 3, 4].map((i) => (
              <DoctorCardSkeleton key={i} />
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <p className="text-gray-500 text-center py-12">{t('consult.noDoctors')}</p>
        ) : (
          <div className="space-y-4 mt-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            {doctors.map((doc) => {
              const next = nextSlots[doc.id];
              const rating = Number((doc as Doctor & { averageRating?: number }).averageRating) || 0;
              const reviews = Number((doc as Doctor & { totalReviews?: number }).totalReviews) || 0;
              return (
                <div key={doc.id} className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                  <div className="relative h-36 bg-teal-100">
                    <span className="absolute top-2 right-2 rounded-lg bg-white/90 text-amber-600 text-xs font-medium px-2 py-1 flex items-center gap-0.5">
                      ★ {rating.toFixed(1)} ({reviews})
                    </span>
                  </div>
                  <div className="p-4">
                    <h2 className="font-bold text-gray-900 text-lg">{getDoctorName(doc)}</h2>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {getSpecialty(doc)} • {doc.yearsOfExperience ?? 0} {t('consult.yrsExp')}
                    </p>
                    {next && (
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-700">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Next available</span>
                        <span className="font-medium">{formatNextAvailable(next.date, next.startTime)}</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </p>
                    )}
                    <Link
                      to={`/doctors/${doc.id}`}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 text-white font-semibold py-3 hover:bg-cyan-600 transition"
                    >
                      {t('consult.viewProfile')}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
