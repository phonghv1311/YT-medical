import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doctorsApi } from '../../api';
import type { Doctor, Schedule, AvailabilitySlot, Review } from '../../types';
import { FullPageSkeleton } from '../../components/skeletons';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
];

type Tab = 'about' | 'schedule' | 'reviews';

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${cls} ${star <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export default function DoctorProfile() {
  const { id } = useParams<{ id: string }>();
  const doctorId = Number(id);

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('about');
  const [selectedDate, setSelectedDate] = useState('');
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotal, setReviewTotal] = useState(0);

  const fetchDoctor = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await doctorsApi.getById(doctorId);
      setDoctor(data.data || data);
    } catch {
      setDoctor(null);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  const fetchSchedule = useCallback(async () => {
    try {
      const { data } = await doctorsApi.getSchedule(doctorId);
      setSchedules((data.data || data) as Schedule[]);
    } catch {
      setSchedules([]);
    }
  }, [doctorId]);

  const fetchAvailability = useCallback(async (date?: string) => {
    try {
      const { data } = await doctorsApi.getAvailability(doctorId, date || undefined);
      const result = data.data || data;
      setSlots(Array.isArray(result) ? result : []);
    } catch {
      setSlots([]);
    }
  }, [doctorId]);

  const fetchReviews = useCallback(async (p: number) => {
    try {
      const { data } = await doctorsApi.getReviews(doctorId, { page: p, limit: 5 });
      const res = data.data || data;
      if (Array.isArray(res)) {
        setReviews(res);
      } else {
        setReviews(res.data ?? []);
        setReviewTotal(res.total ?? 0);
      }
    } catch {
      setReviews([]);
    }
  }, [doctorId]);

  // Single initial load: doctor, schedule, availability (no date), and reviews page 1
  useEffect(() => {
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [docRes, schedRes, availRes, revRes] = await Promise.all([
          doctorsApi.getById(doctorId, { signal }),
          doctorsApi.getSchedule(doctorId, { signal }),
          doctorsApi.getAvailability(doctorId, undefined, { signal }),
          doctorsApi.getReviews(doctorId, { page: 1, limit: 5 }, { signal }),
        ]);
        if (cancelled) return;
        setDoctor(docRes.data?.data ?? docRes.data);
        setSchedules((schedRes.data?.data ?? schedRes.data) as Schedule[]);
        const av = availRes.data?.data ?? availRes.data;
        setSlots(Array.isArray(av) ? av : []);
        const rev = revRes.data?.data ?? revRes.data;
        if (Array.isArray(rev)) setReviews(rev);
        else {
          setReviews(rev?.data ?? []);
          setReviewTotal(rev?.total ?? 0);
        }
      } catch {
        if (!cancelled) setDoctor(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [doctorId]);

  useEffect(() => {
    if (selectedDate) fetchAvailability(selectedDate);
  }, [selectedDate, fetchAvailability]);

  // Only refetch reviews when user changes page (e.g. load more)
  useEffect(() => {
    if (reviewPage === 1) return; // already loaded in initial effect
    fetchReviews(reviewPage);
  }, [reviewPage, fetchReviews]);

  if (loading) return <FullPageSkeleton />;

  if (!doctor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Doctor not found</h2>
        <Link to="/doctors" className="text-blue-600 hover:text-blue-700 font-medium">
          &larr; Back to doctors
        </Link>
      </div>
    );
  }

  const fullName = doctor.user ? `Dr. ${doctor.user.firstName} ${doctor.user.lastName}` : 'Doctor';
  const initials = ((doctor.user?.firstName?.[0] ?? '') + (doctor.user?.lastName?.[0] ?? '')).toUpperCase();
  const colorClass = AVATAR_COLORS[doctor.id % AVATAR_COLORS.length];
  const reviewTotalPages = Math.max(1, Math.ceil(reviewTotal / 5));

  const TABS: { key: Tab; label: string }[] = [
    { key: 'about', label: 'About' },
    { key: 'schedule', label: 'Schedule' },
    { key: 'reviews', label: `Reviews (${doctor.totalReviews})` },
  ];

  const fee = doctor.consultationFee ?? 50;
  const services = [
    { name: 'Online Consultation', price: fee, duration: '30 mins', icon: 'video' },
    { name: 'ECG Analysis', price: (fee * 1.5) | 0, duration: '45 mins', icon: 'ecg' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header: back, title, share */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/doctors" className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label="Back to doctors">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Doctor Profile</h1>
          <button type="button" className="p-2 rounded-lg hover:bg-gray-100" aria-label="Share">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          </button>
        </div>
      </header>

      {/* Doctor header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div
              className={`w-24 h-24 rounded-full ${colorClass} flex items-center justify-center text-white font-bold text-3xl flex-shrink-0 shadow-lg`}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>

              {doctor.specializations && doctor.specializations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {doctor.specializations.map((spec) => (
                    <span
                      key={spec.id}
                      className="inline-block text-sm font-medium bg-blue-50 text-blue-700 rounded-full px-3 py-1"
                    >
                      {spec.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <StarRating rating={Number(doctor.averageRating) || 0} />
                  <span className="text-sm text-gray-600 font-medium">{(Number(doctor.averageRating) || 0).toFixed(1)} ({doctor.totalReviews ?? 0} reviews)</span>
                </div>
                {doctor.yearsOfExperience != null && (
                  <span className="text-sm text-gray-600">
                    <span className="font-semibold">{doctor.yearsOfExperience}</span> years experience
                  </span>
                )}
                {doctor.consultationFee != null && (
                  <span className="text-sm text-gray-600">
                    Fee: <span className="font-semibold text-gray-900">${doctor.consultationFee}</span>
                  </span>
                )}
              </div>

              {doctor.bio && (
                <p className="mt-4 text-gray-600 leading-relaxed max-w-2xl">{doctor.bio}</p>
              )}
            </div>

            <Link
              to={`/customer/booking/${doctor.id}`}
              className="flex-shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white font-semibold px-6 py-3 shadow-sm interactive-btn"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Book Appointment
            </Link>
          </div>
          {/* Stat cards: Experience & Patients */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Experience</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{doctor.yearsOfExperience ?? 0}+ Years</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Patients</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{(doctor.totalReviews ?? 0) >= 1000 ? `${((doctor.totalReviews ?? 0) / 1000).toFixed(1)}k+` : `${doctor.totalReviews ?? 0}+`}</p>
            </div>
          </div>
          {/* Services Offered */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Services Offered</h2>
            <div className="space-y-3">
              {services.map((s) => (
                <Link
                  key={s.name}
                  to={`/customer/booking/${doctor.id}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-sm text-gray-500">${s.price}.00 • {s.duration}</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              ))}
            </div>
          </div>
          {/* Patient Reviews preview */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Patient Reviews</h2>
              <button type="button" onClick={() => setActiveTab('reviews')} className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</button>
            </div>
            {reviews.length > 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-sm">
                    {reviews[0].patient ? (reviews[0].patient.firstName?.[0] ?? '') + (reviews[0].patient.lastName?.[0] ?? '') : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {reviews[0].patient ? `${reviews[0].patient.firstName} ${reviews[0].patient.lastName}` : 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(reviews[0].createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <StarRating rating={reviews[0].rating} size="sm" />
                    {reviews[0].comment && <p className="text-gray-600 text-sm mt-2">&quot;{reviews[0].comment}&quot;</p>}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No reviews yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 text-sm font-medium border-b-2 transition ${activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* About */}
        {activeTab === 'about' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
              <p className="text-gray-600 leading-relaxed">
                {doctor.bio || 'No bio available for this doctor yet.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center interactive-card">
                <p className="text-3xl font-bold text-blue-600">{doctor.yearsOfExperience ?? '—'}</p>
                <p className="text-sm text-gray-500 mt-1">Years of Experience</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center interactive-card">
                <p className="text-3xl font-bold text-blue-600">{doctor.totalReviews}</p>
                <p className="text-sm text-gray-500 mt-1">Patient Reviews</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center interactive-card">
                <p className="text-3xl font-bold text-blue-600">{(Number(doctor.averageRating) || 0).toFixed(1)}</p>
                <p className="text-sm text-gray-500 mt-1">Average Rating</p>
              </div>
            </div>

            {doctor.departments && doctor.departments.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Affiliated Departments</h2>
                <div className="flex flex-wrap gap-2">
                  {doctor.departments.map((dept) => (
                    <span key={dept.id} className="bg-gray-100 text-gray-700 text-sm rounded-lg px-3 py-1.5">
                      {dept.name}
                      {dept.hospital && <span className="text-gray-400"> — {dept.hospital.name}</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Schedule */}
        {activeTab === 'schedule' && (
          <div className="space-y-8">
            {/* Weekly schedule */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Weekly Schedule</h2>
              {schedules.length === 0 ? (
                <p className="text-gray-500">No weekly schedule available.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {schedules
                    .filter((s) => s.isActive)
                    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                    .map((s) => (
                      <div key={s.id} className="flex items-center justify-between py-3">
                        <span className="font-medium text-gray-900">{DAY_NAMES[s.dayOfWeek]}</span>
                        <span className="text-gray-600">
                          {formatTime(s.startTime)} — {formatTime(s.endTime)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Available slots */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Available Slots</h2>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                />
              </div>

              {slots.length === 0 ? (
                <p className="text-gray-500">No available slots for the selected date.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {slots
                    .filter((s) => !s.isBooked)
                    .map((slot) => (
                      <Link
                        key={slot.id}
                        to={`/customer/booking/${doctor.id}?slot=${slot.id}&date=${slot.date}&start=${slot.startTime}&end=${slot.endTime}`}
                        className="rounded-xl border-2 border-blue-100 bg-blue-50 text-center py-3 px-2 interactive-card hover:border-blue-400 hover:bg-blue-100"
                      >
                        <span className="block text-sm font-semibold text-blue-700">
                          {formatTime(slot.startTime)}
                        </span>
                        <span className="block text-xs text-blue-500 mt-0.5">
                          to {formatTime(slot.endTime)}
                        </span>
                      </Link>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {reviews.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <p className="text-gray-500">No reviews yet.</p>
              </div>
            ) : (
              <>
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {review.patient
                            ? `${review.patient.firstName} ${review.patient.lastName}`
                            : 'Anonymous Patient'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                    {review.comment && (
                      <p className="text-gray-600 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))}

                {/* Review pagination */}
                {reviewTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <button
                      onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                      disabled={reviewPage === 1}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-500">
                      Page {reviewPage} of {reviewTotalPages}
                    </span>
                    <button
                      onClick={() => setReviewPage((p) => Math.min(reviewTotalPages, p + 1))}
                      disabled={reviewPage === reviewTotalPages}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
