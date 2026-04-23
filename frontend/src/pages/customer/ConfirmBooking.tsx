import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doctorsApi, appointmentsApi, paymentsApi } from '../../api';
import type { Doctor, AvailabilitySlot, PaymentMethod } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { FullPageSkeleton } from '../../components/skeletons';

const doctorFetchCache: Record<number, Promise<{ data?: unknown }>> = {};
function getDoctorOnce(id: number) {
  if (!doctorFetchCache[id]) {
    doctorFetchCache[id] = doctorsApi.getById(id).finally(() => {
      delete doctorFetchCache[id];
    });
  }
  return doctorFetchCache[id];
}

let paymentMethodsPromise: Promise<{ data?: { data?: PaymentMethod[] }; data?: PaymentMethod[] }> | null = null;
function getPaymentMethodsOnce() {
  if (!paymentMethodsPromise) {
    paymentMethodsPromise = paymentsApi.getPaymentMethods().finally(() => {
      paymentMethodsPromise = null;
    });
  }
  return paymentMethodsPromise;
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export default function ConfirmBooking() {
  const { t } = useLanguage();
  const toast = useToast();
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const id = Number(doctorId);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [consultType, setConsultType] = useState<'video' | 'in_person'>('video');
  const [date, setDate] = useState('');
  const [slotId, setSlotId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null);

  useEffect(() => {
    const u = new URLSearchParams(window.location.search);
    const urlDate = u.get('date') || '';
    setDate(urlDate);
    const s = u.get('slot');
    if (s) setSlotId(Number(s));
    setStartTime(u.get('start') || '10:00');
    setEndTime(u.get('end') || '10:30');
    if (!id) {
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    getDoctorOnce(id, { signal: ctrl.signal })
      .then(({ data }) => setDoctor(data?.data ?? data ?? null))
      .catch((err) => { if (err?.code !== 'ERR_CANCELED') setDoctor(null); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [id]);

  const fetchSlots = useCallback((d: string, signal?: AbortSignal) => {
    if (!id || !d) {
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    doctorsApi.getAvailability(id, d, { signal })
      .then(({ data }) => {
        const raw = data?.data ?? data;
        setSlots(Array.isArray(raw) ? raw : []);
      })
      .catch((err) => { if (err?.code !== 'ERR_CANCELED') setSlots([]); })
      .finally(() => setSlotsLoading(false));
  }, [id]);

  useEffect(() => {
    const ctrl = new AbortController();
    if (date) fetchSlots(date, ctrl.signal);
    else setSlots([]);
    return () => ctrl.abort();
  }, [date, fetchSlots]);

  useEffect(() => {
    const ctrl = new AbortController();
    getPaymentMethodsOnce({ signal: ctrl.signal })
      .then((res) => {
        const raw = res.data?.data ?? res.data;
        const list = Array.isArray(raw) ? raw : [];
        setPaymentMethods(list);
        const defaultMethod = list.find((m: PaymentMethod) => m.isDefault) ?? list[0];
        if (defaultMethod) setSelectedPaymentMethodId(defaultMethod.id);
      })
      .catch((err) => { if (err?.code !== 'ERR_CANCELED') setPaymentMethods([]); })
      .finally(() => setPaymentMethodsLoading(false));
    return () => ctrl.abort();
  }, []);

  const handleConfirm = async () => {
    if (!doctor || !date || !startTime || !endTime) return;
    setSubmitting(true);
    try {
      await appointmentsApi.create({
        doctorId: doctor.id,
        slotId: slotId ?? undefined,
        scheduledAt: date,
        startTime,
        endTime,
        type: consultType,
      });
      navigate('/customer', { state: { message: t('messages.bookingSuccess') } });
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string } } };
      if (e.response?.status === 401) {
        toast.error(t('messages.sessionExpired'));
        navigate('/', { replace: true, state: { message: t('messages.sessionExpired') } });
      } else {
        const msg = e.response?.data?.message || t('messages.bookingFailed');
        toast.error(msg);
        navigate('/customer', { replace: true, state: { message: msg, isError: true } });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <FullPageSkeleton />;
  if (!doctor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-600">{t('booking.doctorNotFound')}</p>
        <Link to="/doctors" className="mt-4 text-blue-600 font-medium">{t('booking.backToDoctors')}</Link>
      </div>
    );
  }

  const fee = doctor.consultationFee ?? 120;
  const fullName = doctor.user ? `Dr. ${doctor.user.firstName} ${doctor.user.lastName}` : 'Doctor';
  const rating = (Number(doctor.averageRating) || 0).toFixed(1);
  const today = new Date().toISOString().slice(0, 10);
  const isDateExpired = !!date && date < today;
  const hasPayment = paymentMethods.length === 0 || selectedPaymentMethodId != null;
  const canSubmit = !submitting && !!date && !!startTime && !isDateExpired && hasPayment;

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 h-14 flex items-center justify-between px-4">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label="Back">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">{t('booking.confirmBooking')}</h1>
        <div className="w-10" />
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        <section className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-3">{t('booking.appointmentSummary')}</h2>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-lg shrink-0">
              {doctor.user?.firstName?.[0]}{doctor.user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900">{fullName}</p>
              <p className="text-sm text-gray-600">{doctor.specializations?.[0]?.name ?? 'General'} • {doctor.yearsOfExperience ?? 0} years exp.</p>
              <p className="text-sm text-amber-600 mt-1">★ {rating} ({doctor.totalReviews ?? 0} reviews)</p>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">📅 {t('booking.selectDate')}</label>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => {
                setDate(e.target.value);
                setSlotId(null);
                setStartTime('');
                setEndTime('');
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          {date && !isDateExpired && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Time slot</p>
              {slotsLoading ? (
                <p className="text-sm text-gray-500">{t('common.loading')}</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-amber-600">No available slots for this date.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.filter((s) => !s.isBooked).map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => {
                        setSlotId(slot.id);
                        setStartTime(slot.startTime);
                        setEndTime(slot.endTime);
                      }}
                      className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${slotId === slot.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300'
                        }`}
                    >
                      {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {isDateExpired && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {t('booking.dateExpired')}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-gray-600">{t('booking.consultationFee')}</span>
            <span className="font-bold text-gray-900">${fee}.00</span>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-3">{t('booking.consultationType')}</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setConsultType('video')}
              className={`p-4 rounded-xl border-2 text-left transition ${consultType === 'video' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
            >
              <span className="block font-medium text-gray-900">{t('booking.onlineVideo')}</span>
              <span className="text-xs text-gray-500">{t('booking.videoCall')}</span>
            </button>
            <button
              type="button"
              onClick={() => setConsultType('in_person')}
              className={`p-4 rounded-xl border-2 text-left transition ${consultType === 'in_person' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
            >
              <span className="block font-medium text-gray-900">{t('booking.inPersonVisit')}</span>
              <span className="text-xs text-gray-500">{t('booking.atClinic')}</span>
            </button>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">{t('booking.paymentMethod')}</h2>
            <Link to="/customer/payment-methods" className="text-sm text-blue-600 font-medium">{t('booking.managePaymentInSettings')}</Link>
          </div>
          {paymentMethodsLoading ? (
            <p className="text-sm text-gray-500 py-3">{t('common.loading')}</p>
          ) : paymentMethods.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-sm text-amber-800">{t('booking.addPaymentInSettingsFirst')}</p>
              <Link to="/customer/payment-methods" className="inline-block mt-2 text-sm font-medium text-blue-600 hover:underline">{t('booking.managePaymentInSettings')}</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setSelectedPaymentMethodId(pm.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition ${selectedPaymentMethodId === pm.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}
                >
                  <span className="text-gray-400">💳</span>
                  <span className="text-sm text-gray-700">
                    **** **** **** {pm.last4 ?? '····'} {pm.isDefault ? `(${t('payments.default')})` : ''}
                  </span>
                  {selectedPaymentMethodId === pm.id && (
                    <span className="ml-auto w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-gray-500">{t('booking.havePromoCode')} <button type="button" className="text-blue-600 font-medium">{t('booking.apply')}</button></p>
        </section>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          {t('booking.securePayment')}
        </div>
      </div>

      <footer className="fixed left-0 right-0 bottom-16 z-30 bg-white border-t border-gray-200 safe-area-pb p-4 max-w-lg mx-auto">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <p className="text-xs text-gray-500">{t('booking.totalAmount')}</p>
            <p className="text-xl font-bold text-gray-900">${fee}.00</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canSubmit}
          aria-label={submitting ? t('booking.processing') : (t('booking.scheduleAppointment') || 'Schedule appointment')}
          className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:bg-blue-700 active:scale-[0.98] transition"
        >
          <span className="min-w-0 truncate">
            {submitting ? t('booking.processing') : (t('booking.scheduleAppointment') || 'Đặt lịch')}
          </span>
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
      </footer>
    </div>
  );
}
