import { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { doctorsApi } from '../../api/doctors';
import type { AvailabilitySlot, Appointment } from '../../types';
import { ListRowSkeleton } from '../../components/skeletons';

type ViewMode = 'weekly' | 'monthly';
type EventKind = 'booked' | 'available' | 'leave' | 'cancelled';

interface DayEvent {
  id: string;
  kind: EventKind;
  startTime: string;
  endTime: string;
  title: string;
  subtitle: string;
  slotId?: number;
  appointmentId?: number;
  patientName?: string;
}

const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function getWeekStart(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day;
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getWeekDays(weekStart: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12.toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')} ${period}`;
}

function slotDuration(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh - sh) * 60 + (em - sm);
}

export default function DoctorSchedule() {
  const { t } = useLanguage();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [googleSyncOn, setGoogleSyncOn] = useState(false);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlotStart, setNewSlotStart] = useState('09:00');
  const [newSlotEnd, setNewSlotEnd] = useState('12:00');

  const weekStart = useMemo(() => getWeekStart(selectedDate), [selectedDate]);
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const selectedDateStr = selectedDate.toISOString().split('T')[0];

  useEffect(() => {
    const ctrl = new AbortController();
    const cancelled = { current: false };
    Promise.all([
      doctorsApi.me.getAvailability(undefined, { signal: ctrl.signal }),
      doctorsApi.me.getAppointments({ signal: ctrl.signal }),
    ])
      .then(([slotRes, apptRes]) => {
        if (cancelled.current) return;
        setSlots((slotRes.data?.data ?? slotRes.data) ?? []);
        const apptData = apptRes.data?.data ?? apptRes.data;
        setAppointments(Array.isArray(apptData) ? apptData : []);
      })
      .catch(() => {
        if (!cancelled.current) {
          setSlots([]);
          setAppointments([]);
        }
      })
      .finally(() => {
        if (!cancelled.current) setLoading(false);
      });
    return () => {
      cancelled.current = true;
      ctrl.abort();
    };
  }, []);

  const daySlots = useMemo(
    () => slots.filter((s) => s.date === selectedDateStr),
    [slots, selectedDateStr],
  );
  const dayAppointments = useMemo(
    () =>
      appointments.filter((a) => {
        const d = a.scheduledAt?.split('T')[0] ?? a.scheduledAt?.split(' ')[0];
        return d === selectedDateStr;
      }),
    [appointments, selectedDateStr],
  );

  const dayEvents = useMemo((): DayEvent[] => {
    const events: DayEvent[] = [];
    const usedSlots = new Set<string>();

    dayAppointments.forEach((a) => {
      const key = `${a.startTime}-${a.endTime}`;
      usedSlots.add(key);
      const patientName = a.patient
        ? `${a.patient.firstName ?? ''} ${a.patient.lastName ?? ''}`.trim() || 'Patient'
        : 'Patient';
      const duration = slotDuration(a.startTime, a.endTime);
      const durationStr =
        duration >= 60 ? t('schedulePage.durationHours', { count: duration / 60 }) : t('schedulePage.durationMinutes', { count: duration });
      const typeLabel = a.type === 'video' ? t('schedulePage.telemedicineOnly') : t('schedulePage.initialConsultation');
      events.push({
        id: `appt-${a.id}`,
        kind: a.status === 'cancelled' ? 'cancelled' : 'booked',
        startTime: a.startTime,
        endTime: a.endTime,
        title: `${t('schedulePage.patientLabel')}: ${patientName}`,
        subtitle:
          a.status === 'cancelled' ? t('schedulePage.cancelledByPatient') : `${typeLabel} • ${durationStr}`,
        appointmentId: a.id,
        patientName,
      });
    });

    daySlots.forEach((slot) => {
      const key = `${slot.startTime}-${slot.endTime}`;
      if (usedSlots.has(key)) return;
      const duration = slotDuration(slot.startTime, slot.endTime);
      const durationStr =
        duration >= 60 ? t('schedulePage.durationHours', { count: duration / 60 }) : t('schedulePage.durationMinutes', { count: duration });
      events.push({
        id: `slot-${slot.id}`,
        kind: 'available',
        startTime: slot.startTime,
        endTime: slot.endTime,
        title: t('schedulePage.availableSlot'),
        subtitle: `${t('schedulePage.flexibleBooking')} • ${durationStr}`,
        slotId: slot.id,
      });
    });

    const mockLeave: DayEvent = {
      id: 'leave-lunch',
      kind: 'leave',
      startTime: '12:30',
      endTime: '13:30',
      title: t('schedulePage.lunchBreak'),
      subtitle: t('schedulePage.timeOffBlocked'),
    };
    events.push(mockLeave);

    events.sort((a, b) => {
      const [ah, am] = a.startTime.split(':').map(Number);
      const [bh, bm] = b.startTime.split(':').map(Number);
      return ah * 60 + am - (bh * 60 + bm);
    });
    return events;
  }, [daySlots, dayAppointments, t]);

  const hasEventOnDay = (date: Date): boolean => {
    const dStr = date.toISOString().split('T')[0];
    const hasSlot = slots.some((s) => s.date === dStr);
    const hasAppt = appointments.some((a) => {
      const d = a.scheduledAt?.split('T')[0] ?? a.scheduledAt?.split(' ')[0];
      return d === dStr;
    });
    return hasSlot || hasAppt;
  };

  const isSelected = (d: Date) =>
    d.getDate() === selectedDate.getDate() &&
    d.getMonth() === selectedDate.getMonth() &&
    d.getFullYear() === selectedDate.getFullYear();
  const isToday = (d: Date) => {
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  };

  const goPrevWeek = () => setSelectedDate((d) => new Date(d.getTime() - 7 * 24 * 60 * 60 * 1000));
  const goNextWeek = () => setSelectedDate((d) => new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000));
  const goToToday = () => setSelectedDate(new Date());

  async function addSlot(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDateStr) return;
    try {
      const { data } = await doctorsApi.me.createAvailability({
        date: selectedDateStr,
        startTime: newSlotStart,
        endTime: newSlotEnd,
      });
      const created = data?.data ?? data;
      if (created && typeof created === 'object' && 'id' in created) {
        setSlots((prev) => [...prev, created as AvailabilitySlot]);
      }
      setShowAddSlot(false);
    } catch {
      // ignore
    }
  }

  async function deleteSlot(slotId: number) {
    try {
      await doctorsApi.me.deleteAvailability(slotId);
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
    } catch {
      // ignore
    }
  }

  const weekRangeLabel = `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  const dayHeading = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        {[1, 2, 3, 4, 5].map((i) => (
          <ListRowSkeleton key={i} lines={2} />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-24">
      {/* Header: calendar icon + title, headset, + button */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600" aria-hidden>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </span>
          <h1 className="text-lg font-bold text-gray-900 truncate">{t('schedulePage.title')}</h1>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className="p-2 rounded-full hover:bg-gray-100 text-gray-600" aria-label="Support">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setShowAddSlot(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700"
            aria-label={t('schedulePage.addSlot')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Sync with Google Calendar */}
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
            <span className="font-medium text-gray-900">{t('schedulePage.syncWithGoogle')}</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={googleSyncOn}
            onClick={() => setGoogleSyncOn((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${googleSyncOn ? 'bg-blue-600' : 'bg-gray-200'}`}
          >
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform mt-0.5 ${googleSyncOn ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Weekly / Monthly toggle */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setViewMode('weekly')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${viewMode === 'weekly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}
          >
            {t('schedulePage.weekly')}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('monthly')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${viewMode === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}
          >
            {t('schedulePage.monthly')}
          </button>
        </div>

        {/* Week navigation + week strip */}
        {viewMode === 'weekly' && (
          <>
            <div className="flex items-center justify-between">
              <button type="button" onClick={goPrevWeek} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-600" aria-label="Previous week">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="text-sm font-medium text-gray-700">{weekRangeLabel}</span>
              <button type="button" onClick={goNextWeek} className="p-2 -mr-2 rounded-lg hover:bg-gray-100 text-gray-600" aria-label="Next week">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAY_LABELS.map((label) => (
                <span key={label} className="text-xs font-medium text-gray-500 py-1">
                  {label}
                </span>
              ))}
              {weekDays.map((d) => (
                <button
                  key={d.getTime()}
                  type="button"
                  onClick={() => setSelectedDate(new Date(d))}
                  className={`flex flex-col items-center py-2 rounded-lg text-sm font-medium transition ${
                    isSelected(d) ? 'bg-blue-600 text-white' : isToday(d) ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {d.getDate()}
                  {hasEventOnDay(d) && (
                    <span className={`mt-0.5 h-1 w-1 rounded-full ${isSelected(d) ? 'bg-white' : 'bg-blue-500'}`} />
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {viewMode === 'monthly' && (
          <div className="flex items-center justify-between">
            <button type="button" onClick={goPrevWeek} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">&lt;</button>
            <span className="font-medium text-gray-900">{selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            <button type="button" onClick={goNextWeek} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">&gt;</button>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" /> {t('schedulePage.booked')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500" /> {t('schedulePage.available')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> {t('schedulePage.leave')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-gray-400" /> {t('schedulePage.off')}
          </span>
        </div>

        {/* Day heading + Today */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">{dayHeading}</h2>
          {!isToday(selectedDate) && (
            <button type="button" onClick={goToToday} className="text-sm font-medium text-blue-600 hover:underline">
              {t('schedulePage.today')}
            </button>
          )}
        </div>

        {/* Add slot form */}
        {showAddSlot && selectedDateStr && (
          <form onSubmit={addSlot} className="rounded-xl border border-gray-200 bg-white p-4 flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
              <input type="time" value={newSlotStart} onChange={(e) => setNewSlotStart(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
              <input type="time" value={newSlotEnd} onChange={(e) => setNewSlotEnd(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">{t('common.add')}</button>
            <button type="button" onClick={() => setShowAddSlot(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50">{t('common.cancel')}</button>
          </form>
        )}

        {/* Daily schedule list */}
        {dayEvents.length === 0 ? (
          <p className="text-gray-500 py-6 text-center rounded-xl border border-gray-100 bg-gray-50 text-sm">{t('schedulePage.noSlotsForDay')}</p>
        ) : (
          <ul className="space-y-3">
            {dayEvents.map((ev) => (
              <li
                key={ev.id}
                className={`rounded-xl border border-gray-200 bg-white overflow-hidden flex ${ev.kind === 'cancelled' ? 'opacity-75' : ''}`}
              >
                <span
                  className={`w-1 shrink-0 ${
                    ev.kind === 'booked' ? 'bg-blue-500' : ev.kind === 'available' ? 'bg-green-500' : ev.kind === 'leave' ? 'bg-amber-400' : 'bg-gray-400'
                  }`}
                  aria-hidden
                />
                <div className="flex-1 min-w-0 p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{ev.title}</p>
                    <p className={`text-sm truncate ${ev.kind === 'cancelled' ? 'text-gray-500' : 'text-gray-500'}`}>{ev.subtitle}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatTime(ev.startTime)} – {formatTime(ev.endTime)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {ev.kind === 'available' && ev.slotId != null && (
                      <button
                        type="button"
                        className="p-2 rounded-full bg-green-100 text-green-700 hover:bg-green-200"
                        aria-label={t('common.edit')}
                        onClick={() => deleteSlot(ev.slotId!)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                    )}
                    {ev.kind === 'leave' && (
                      <span className="p-2 text-gray-400" aria-hidden>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      </span>
                    )}
                    <button type="button" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" aria-label="Menu">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-20 right-4 max-w-lg mx-auto w-full flex justify-end pointer-events-none z-20">
        <button
          type="button"
          onClick={() => setShowAddSlot(true)}
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
          aria-label={t('schedulePage.addSlot')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
