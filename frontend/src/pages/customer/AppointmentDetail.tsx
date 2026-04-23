import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { appointmentsApi } from '../../api';
import type { Appointment } from '../../types';
import { FullPageSkeleton } from '../../components/skeletons';

function formatDateTime(scheduledAt?: string): string {
  if (!scheduledAt) return '—';
  const d = new Date(scheduledAt);
  const weekdays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const w = weekdays[d.getDay()];
  return `${day}/${month}/${year} - ${w}`;
}

export default function AppointmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const numId = Number(id);
    if (!numId) {
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    appointmentsApi.getById(numId, { signal: ctrl.signal })
      .then(({ data }) => setAppointment(data?.data ?? data))
      .catch((err) => { if (err?.code !== 'ERR_CANCELED') setAppointment(null); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [id]);

  if (loading) return <FullPageSkeleton />;
  if (!appointment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-600">Appointment not found.</p>
        <Link to="/customer/appointments" className="mt-4 text-blue-600 font-medium">Back to appointments</Link>
      </div>
    );
  }

  const doctor = appointment.doctor;
  const doctorName = doctor?.user ? `BS. ${doctor.user.firstName} ${doctor.user.lastName}` : 'BS.';
  const specialty = doctor?.specializations?.[0]?.name ?? 'Chuyên khoa Nội tổng quát';
  const scheduledAt = appointment.scheduledAt;
  const locationName = (appointment as { location?: string }).location ?? 'Bệnh viện Đa khoa Tâm Anh';
  const address = '108 Hoàng Như Tiếp, Bồ Đề, Long Biên, Hà Nội';
  const isConfirmed = appointment.status === 'confirmed' || appointment.status === 'in_progress';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 h-14 flex items-center justify-between px-4 gap-2">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900 truncate flex-1">{t('customerAppointmentDetail.title')}</h1>
        {isConfirmed && (
          <span className="shrink-0 px-3 py-1 rounded-lg bg-green-100 text-green-800 text-xs font-semibold uppercase">
            {t('customerAppointmentDetail.statusConfirmed')}
          </span>
        )}
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xl shrink-0">
            {doctor?.user?.firstName?.[0]}{doctor?.user?.lastName?.[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900">{doctorName}</p>
            <p className="text-sm text-gray-600">{specialty}</p>
            <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              Bác sĩ ưu tú
            </p>
          </div>
        </div>

        <section>
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">{t('customerAppointmentDetail.appointmentInfo')}</h3>
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 flex items-start gap-3">
              <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </span>
              <div>
                <p className="text-xs text-gray-500">{t('customerAppointmentDetail.time')}</p>
                <p className="font-bold text-gray-900">{appointment.startTime}, {formatDateTime(scheduledAt)}</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex items-start gap-3">
              <span className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">{t('customerAppointmentDetail.location')}</p>
                <p className="font-bold text-gray-900">{locationName}</p>
                <p className="text-sm text-gray-600 mt-0.5">{address}</p>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationName + ' ' + address)}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 inline-flex items-center gap-1">
                  {t('customerAppointmentDetail.viewOnMap')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </div>
            </div>
          </div>
        </section>

        <div className="rounded-2xl bg-white border border-gray-100 p-4 text-center">
          <p className="font-bold text-blue-600 mb-2">{t('customerAppointmentDetail.qrCheckIn')}</p>
          <div className="w-40 h-40 mx-auto bg-orange-100 rounded-xl flex items-center justify-center text-gray-500 text-sm">QR Code</div>
          <p className="text-xs text-gray-500 mt-2">{t('customerAppointmentDetail.qrNote')}</p>
        </div>

        {appointment.type === 'video' && (
          <div className="rounded-2xl bg-blue-600 text-white p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-white/90">{t('customerAppointmentDetail.videoConsultAvailable')}</p>
              <p className="font-bold">{t('customerAppointmentDetail.consultViaVideo')}</p>
            </div>
            <button type="button" className="px-4 py-2 rounded-xl bg-white text-blue-600 text-sm font-semibold uppercase">
              {t('customerAppointmentDetail.recordVideo')}
            </button>
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            {t('customerAppointmentDetail.reschedule')}
          </button>
          <button type="button" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            {t('customerAppointmentDetail.cancelAppointment')}
          </button>
        </div>

        <Link
          to={id ? `/customer/appointments/${id}/call` : '/customer/appointments'}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          {t('customerAppointmentDetail.prepareForVisit')}
        </Link>
      </div>
    </div>
  );
}
