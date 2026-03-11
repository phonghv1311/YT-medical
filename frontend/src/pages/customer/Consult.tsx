import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doctorsApi } from '../../api/doctors';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Doctor, AvailabilitySlot } from '../../types';
import { DoctorCardSkeleton } from '../../components/skeletons';

const SPECIALTY_KEYS = ['all', 'general', 'cardiology', 'dermatology', 'pediatrics', 'neurology'] as const;
const SPECIALTY_API_VALUES: Record<string, string> = {
  all: '',
  general: 'General',
  cardiology: 'Cardiology',
  dermatology: 'Dermatology',
  pediatrics: 'Pediatrics',
  neurology: 'Neurology',
};

function toDateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatSlotTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function formatDisplayDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Consult() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => toDateOnly(new Date()));
  const [specialtyKey, setSpecialtyKey] = useState<typeof SPECIALTY_KEYS[number]>('all');
  const [monthOffset, setMonthOffset] = useState(0);
  const [doctorsWithSlots, setDoctorsWithSlots] = useState<{ doctor: Doctor; firstSlot: AvailabilitySlot }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const today = useCallback(() => toDateOnly(new Date()), []);

  useEffect(() => {
    const ctrl = new AbortController();
    const cancelled = { current: false };
    setLoading(true);
    const apiSpec = specialtyKey === 'all' ? undefined : SPECIALTY_API_VALUES[specialtyKey];
    doctorsApi
      .getAll({ specialty: apiSpec, limit: 5 }, { signal: ctrl.signal })
      .then((r) => {
        if (cancelled.current) return;
        const data = r.data?.data ?? r.data;
        const list = data?.doctors ?? data ?? [];
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
      setDoctorsWithSlots([]);
      return;
    }
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    const todayStr = `${today().getFullYear()}-${String(today().getMonth() + 1).padStart(2, '0')}-${String(today().getDate()).padStart(2, '0')}`;
    if (dateStr < todayStr) {
      setDoctorsWithSlots([]);
      return;
    }
    const ctrl = new AbortController();
    const cancelled = { current: false };
    setSlotsLoading(true);
    Promise.all(
      doctors.map((doc) =>
        doctorsApi.getAvailability(doc.id, dateStr, { signal: ctrl.signal }).then((res) => {
          if (cancelled.current) return null;
          const raw = res.data?.data ?? res.data;
          const slots: AvailabilitySlot[] = Array.isArray(raw) ? raw : [];
          const first = slots.find((s) => !s.isBooked);
          return first ? { doctor: doc, firstSlot: first } : null;
        }).catch(() => null)
      )
    )
      .then((results) => {
        if (!cancelled.current) setDoctorsWithSlots(results.filter((r): r is { doctor: Doctor; firstSlot: AvailabilitySlot } => r != null));
      })
      .finally(() => { if (!cancelled.current) setSlotsLoading(false); });
    return () => {
      cancelled.current = true;
      ctrl.abort();
    };
  }, [doctors, selectedDate, today]);

  const displayMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + monthOffset, 1);
  const monthStr = displayMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const days: Date[] = [];
  const daysInMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0).getDate();
  for (let i = 1; i <= Math.min(31, daysInMonth); i++) {
    days.push(new Date(displayMonth.getFullYear(), displayMonth.getMonth(), i));
  }

  const isPast = (d: Date) => toDateOnly(d) < today();
  const isSelected = (d: Date) =>
    selectedDate.getDate() === d.getDate() && selectedDate.getMonth() === d.getMonth() && selectedDate.getFullYear() === d.getFullYear();

  const displayList = doctorsWithSlots;

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 -mt-4 flex h-14 items-center justify-between border-b border-gray-100 bg-white px-4 pt-4">
        <button type="button" onClick={() => navigate(-1)} className="-ml-2 rounded-lg p-2 hover:bg-gray-100">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">{t('consult.bookConsultation')}</h1>
        <div className="w-10" />
      </header>

      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setMonthOffset((m) => m - 1)} className="rounded-lg p-2 hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="font-semibold text-gray-900">{monthStr}</span>
          <button type="button" onClick={() => setMonthOffset((m) => m + 1)} className="rounded-lg p-2 hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        <p className="flex justify-center gap-4 text-xs text-gray-500">{t('consult.daysShort')}</p>
        <div className="grid grid-cols-7 gap-2">
          {days.map((d) => {
            const past = isPast(d);
            return (
              <button
                key={d.toISOString()}
                type="button"
                disabled={past}
                onClick={() => !past && setSelectedDate(toDateOnly(d))}
                className={`rounded-lg py-2 text-sm font-medium transition ${past
                  ? 'cursor-not-allowed bg-gray-50 text-gray-400'
                  : isSelected(d)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>

        <div>
          <h2 className="mb-3 font-bold text-gray-900">{t('consult.specialty')}</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {SPECIALTY_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSpecialtyKey(key)}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium ${specialtyKey === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {t(`consult.${key}`)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 font-bold text-gray-900">{t('consult.availableDoctors')}</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <DoctorCardSkeleton key={i} />
              ))}
            </div>
          ) : slotsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <DoctorCardSkeleton key={i} />
              ))}
            </div>
          ) : displayList.length === 0 ? (
            <p className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center text-sm text-gray-500">
              {doctors.length === 0 ? t('consult.noDoctors') : t('consult.noDoctorsForDate')}
            </p>
          ) : (
            <div className="space-y-4">
              {displayList.slice(0, 8).map(({ doctor: doc, firstSlot }) => (
                <div key={doc.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-100 font-bold text-teal-700">
                      {doc.user?.firstName?.[0]}
                      {doc.user?.lastName?.[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900">
                        Dr. {doc.user?.firstName} {doc.user?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {doc.specializations?.[0]?.name ?? 'General'} • {doc.yearsOfExperience ?? 0} {t('consult.yrsExp')}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                        <span>★</span> {(Number(doc.averageRating) || 0).toFixed(1)}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {firstSlot
                          ? t('consult.availableAt', {
                            date: formatDisplayDate(selectedDate),
                            time: formatSlotTime(firstSlot.startTime),
                          })
                          : ''}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link
                        to={`/doctors/${doc.id}`}
                        className="rounded-lg border border-blue-500 px-4 py-2 text-center text-sm font-medium text-blue-600"
                      >
                        {t('consult.viewProfile')}
                      </Link>
                      <Link
                        to={`/customer/booking/${doc.id}?date=${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}${firstSlot ? `&slot=${firstSlot.id}&start=${firstSlot.startTime}&end=${firstSlot.endTime}` : ''}`}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white"
                      >
                        {t('consult.bookNow')}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
