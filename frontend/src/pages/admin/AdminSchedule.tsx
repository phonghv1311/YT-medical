import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { doctorsApi } from '../../api/doctors';
import { adminApi } from '../../api/admin';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { getRole } from '../../utils/auth';
import type { Doctor, Schedule } from '../../types';

type ViewMode = 'day' | 'week' | 'month';
type RangeFilter = 'ALL' | 'TODAY' | 'WEEK' | 'DEPARTMENT';

type OnDutyDoctor = {
  doctor: Doctor;
  shift: Schedule;
};

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function getMonthGrid(date: Date): Array<{ date: Date | null; key: string }> {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const startDow = first.getDay(); // 0..6

  // 6 weeks * 7 days
  const grid: Array<{ date: Date | null; key: string }> = [];
  const start = new Date(year, month, 1 - startDow);
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const inMonth = d.getMonth() === month;
    grid.push({ date: inMonth ? d : null, key: `${d.toISOString().slice(0, 10)}-${i}` });
  }
  return grid;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const dow = date.getDay();
  date.setDate(date.getDate() - dow);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, days: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + days);
  return date;
}

function formatMonthLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function shiftLabel(startTime: string, endTime: string, t: (k: string) => string): string {
  const startHour = Number(startTime.split(':')[0] || 0);
  const prefixRaw = startHour < 12 ? t('doctorSchedule.morningShift') : t('doctorSchedule.afternoonShift');
  const prefix = prefixRaw.split(':')[0] || prefixRaw;
  return `${prefix}: ${startTime}-${endTime}`;
}

export default function AdminSchedule() {
  const { t } = useLanguage();
  const currentUser = useAppSelector((s) => s.auth.user);
  const role = getRole(currentUser);

  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>('ALL');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorSchedules, setDoctorSchedules] = useState<Record<number, Schedule[]>>({});
  const [myHospitalId, setMyHospitalId] = useState<number | null>(null);

  const weekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const monthGrid = useMemo(() => getMonthGrid(selectedDate), [selectedDate]);
  const today = useMemo(() => new Date(), []);
  const isTodaySelected = useMemo(() => isSameDay(selectedDate, today), [selectedDate, today]);

  const onDutyForDate = useMemo((): OnDutyDoctor[] => {
    const dow = selectedDate.getDay();
    const out: OnDutyDoctor[] = [];
    for (const doc of doctors) {
      const schedules = doctorSchedules[doc.id] ?? [];
      const matched = schedules.filter((s) => s.isActive && s.dayOfWeek === dow);
      for (const shift of matched) out.push({ doctor: doc, shift });
    }
    return out;
  }, [doctors, doctorSchedules, selectedDate]);

  const onDutyForRange = useMemo((): OnDutyDoctor[] => {
    if (rangeFilter === 'ALL') return onDutyForDate;
    if (rangeFilter === 'TODAY') return onDutyForDate;
    if (rangeFilter === 'WEEK') {
      const dowSet = new Set(weekDays.map((d) => d.getDay()));
      const out: OnDutyDoctor[] = [];
      for (const doc of doctors) {
        const schedules = doctorSchedules[doc.id] ?? [];
        const matched = schedules.filter((s) => s.isActive && dowSet.has(s.dayOfWeek));
        for (const shift of matched) out.push({ doctor: doc, shift });
      }
      return out;
    }
    return onDutyForDate; // DEPARTMENT: placeholder
  }, [rangeFilter, onDutyForDate, doctors, doctorSchedules, weekDays]);

  const hasAnyOnDutyDow = useMemo(() => {
    const set = new Set<number>();
    for (const shifts of Object.values(doctorSchedules)) {
      for (const s of shifts) if (s.isActive) set.add(s.dayOfWeek);
    }
    return set;
  }, [doctorSchedules]);

  const fetchDoctorsAndSchedules = useCallback(async () => {
    setLoading(true);
    const ctrl = new AbortController();
    try {
      if (role === 'admin' && myHospitalId == null) {
        const staffMe = await adminApi.getStaffMe({ signal: ctrl.signal });
        const data = staffMe.data?.data ?? staffMe.data;
        const hid = data?.hospitalId ?? data?.hospital?.id ?? null;
        setMyHospitalId(hid);
      }

      const docsRes = await doctorsApi.getAll(
        { limit: 30, page: 1, hospitalId: role === 'admin' ? myHospitalId ?? undefined : undefined },
        { signal: ctrl.signal },
      );
      const list = (docsRes.data as any)?.doctors ?? (docsRes.data as any)?.data?.doctors ?? [];
      const safeDoctors: Doctor[] = Array.isArray(list) ? list : [];
      setDoctors(safeDoctors);

      const schedulesByDoctorId: Record<number, Schedule[]> = {};
      await Promise.all(
        safeDoctors.map(async (doc) => {
          try {
            const sRes = await doctorsApi.getSchedule(doc.id, { signal: ctrl.signal });
            const raw = (sRes.data as any)?.data ?? sRes.data;
            schedulesByDoctorId[doc.id] = Array.isArray(raw) ? raw : [];
          } catch {
            schedulesByDoctorId[doc.id] = [];
          }
        }),
      );
      setDoctorSchedules(schedulesByDoctorId);
    } catch {
      setDoctors([]);
      setDoctorSchedules({});
    } finally {
      setLoading(false);
    }
    return () => ctrl.abort();
  }, [role, myHospitalId]);

  useEffect(() => {
    void fetchDoctorsAndSchedules();
  }, [fetchDoctorsAndSchedules, myHospitalId, role]);

  const rangeTitle =
    rangeFilter === 'TODAY'
      ? 'Hôm nay'
      : rangeFilter === 'WEEK'
        ? 'Tuần này'
        : isTodaySelected
          ? 'Hôm nay'
          : selectedDate.toLocaleDateString('vi-VN');

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">{t('doctorSchedule.title')}</h1>
          <div className="text-gray-400 text-sm">{t('doctorSchedule.todayShifts')}</div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Day / Week / Month tabs (ordered left -> right) */}
        <div className="flex gap-2">
          {(['day', 'week', 'month'] as ViewMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setViewMode(m)}
              className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border ${viewMode === m ? 'bg-white border-blue-600 text-blue-600 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-500'
                }`}
            >
              {m === 'day' ? t('doctorSchedule.day') : m === 'week' ? t('doctorSchedule.week') : t('doctorSchedule.month')}
            </button>
          ))}
        </div>

        {/* Calendar header */}
        {viewMode === 'month' && (
          <div className="rounded-2xl bg-white border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                className="p-2 -ml-1 rounded-lg hover:bg-gray-100"
                aria-label="Prev month"
              >
                &lt;
              </button>
              <div className="text-center font-semibold text-gray-900">{formatMonthLabel(selectedDate)}</div>
              <button
                type="button"
                onClick={() => setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                className="p-2 -mr-1 rounded-lg hover:bg-gray-100"
                aria-label="Next month"
              >
                &gt;
              </button>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1 text-center">
              {WEEKDAY_LABELS.map((label) => (
                <span key={label} className="text-xs font-medium text-gray-400">
                  {label}
                </span>
              ))}

              {monthGrid.map((cell) => {
                const d = cell.date;
                const key = cell.key;
                const inMonthDate = d ? d.getDate() : null;
                const isSelected = d ? isSameDay(d, selectedDate) : false;
                const showDot = d ? hasAnyOnDutyDow.has(d.getDay()) : false;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!d}
                    onClick={() => d && setSelectedDate(d)}
                    className={`h-10 rounded-xl text-sm font-medium transition ${!d ? 'bg-transparent' : isSelected ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    aria-label={d ? d.toLocaleDateString() : 'empty'}
                  >
                    <div className="h-full flex items-center justify-center relative">
                      {inMonthDate}
                      {showDot && (
                        <span className={`absolute -bottom-1 h-2 w-2 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'week' && (
          <div className="rounded-2xl bg-white border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedDate((d) => addDays(d, -7))}
                className="p-2 -ml-1 rounded-lg hover:bg-gray-100"
                aria-label="Prev week"
              >
                &lt;
              </button>
              <div className="text-center font-semibold text-gray-900">
                {weekStart.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })} -{' '}
                {weekDays[6].toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}
              </div>
              <button
                type="button"
                onClick={() => setSelectedDate((d) => addDays(d, 7))}
                className="p-2 -mr-1 rounded-lg hover:bg-gray-100"
                aria-label="Next week"
              >
                &gt;
              </button>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1 text-center">
              {WEEKDAY_LABELS.map((label) => (
                <span key={label} className="text-xs font-medium text-gray-400">
                  {label}
                </span>
              ))}
              {weekDays.map((d) => {
                const isSelected = isSameDay(d, selectedDate);
                const showDot = hasAnyOnDutyDow.has(d.getDay());
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`h-10 rounded-xl text-sm font-medium relative transition ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    <span className="absolute inset-0 flex items-center justify-center">{d.getDate()}</span>
                    {showDot && <span className={`absolute -bottom-1 h-2 w-2 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'day' && (
          <div className="rounded-2xl bg-white border border-gray-200 p-3 flex items-center justify-between">
            <button type="button" onClick={() => setSelectedDate(new Date())} className="text-sm text-blue-600 font-medium hover:underline">
              {t('schedulePage.today')}
            </button>
            <div className="font-semibold text-gray-900">{selectedDate.toLocaleDateString('vi-VN')}</div>
            <div className="text-sm text-gray-400"> </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2">
          {([
            { key: 'ALL' as const, label: 'Tất cả' },
            { key: 'TODAY' as const, label: 'Hôm nay' },
            { key: 'WEEK' as const, label: 'Tuần này' },
            { key: 'DEPARTMENT' as const, label: 'Khoa' },
          ] as const).map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setRangeFilter(f.key);
                if (f.key === 'TODAY') setSelectedDate(new Date());
                if (f.key === 'WEEK') setSelectedDate(new Date());
              }}
              className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border ${rangeFilter === f.key ? 'bg-white border-blue-600 text-blue-600 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Assign shift header */}
        <div className="rounded-2xl bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <div>
                <div className="font-semibold text-gray-900">{t('doctorSchedule.assignShift')}</div>
                <div className="text-sm text-gray-500">{t('doctorSchedule.todayShifts')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* On-duty list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">
              Danh sách bác sĩ trực ({rangeTitle})
            </h2>
            <div className="text-xs text-gray-500">{onDutyForRange.length} bác sĩ</div>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-white border border-gray-200 p-4 text-gray-500 text-sm">Loading...</div>
          ) : onDutyForRange.length === 0 ? (
            <div className="rounded-2xl bg-white border border-gray-200 p-4 text-gray-500 text-sm">
              Không có bác sĩ trực vào thời điểm này
            </div>
          ) : (
            <div className="space-y-3">
              {onDutyForRange.map((item, idx) => {
                const avatar = (item.doctor.user as any)?.avatar as string | null | undefined;
                const first = item.doctor.user?.firstName ?? '';
                const last = item.doctor.user?.lastName ?? '';
                return (
                  <div key={`${item.doctor.id}-${idx}-${item.shift.id ?? ''}`} className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                          {avatar ? (
                            <img src={avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-semibold">BS</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-bold text-gray-900 truncate">{`BS. ${first} ${last}`.trim() || 'BS.'}</div>
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {item.doctor.specializations?.[0]?.name ? `Khoa ${item.doctor.specializations[0].name}` : 'Khoa Hỏi sức cấp cứu'}
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {shiftLabel(item.shift.startTime, item.shift.endTime, (k) => (t as any)(k))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
