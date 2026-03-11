import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doctorsApi } from '../../api';
import type { Doctor } from '../../types';
import { DoctorCardSkeleton } from '../../components/skeletons';

const SPECIALTIES = [
  'All Specialties',
  'General Practice',
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'Psychiatry',
  'Ophthalmology',
];

const RATING_OPTIONS = [
  { value: 0, label: 'Any Rating' },
  { value: 3, label: '3+ Stars' },
  { value: 4, label: '4+ Stars' },
  { value: 4.5, label: '4.5+ Stars' },
];

function getInitials(doctor: Doctor): string {
  const first = doctor.user?.firstName?.[0] ?? '';
  const last = doctor.user?.lastName?.[0] ?? '';
  return (first + last).toUpperCase() || '?';
}

function getFullName(doctor: Doctor): string {
  if (!doctor.user) return 'Doctor';
  return `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`;
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1.5 text-sm text-gray-600 font-medium">{(Number(rating) || 0).toFixed(1)}</span>
    </div>
  );
}

export default function DoctorsList() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 9;

  useEffect(() => {
    const ctrl = new AbortController();
    const cancelled = { current: false };
    setLoading(true);
    const params: Record<string, unknown> = { page, limit };
    if (specialty) params.specialty = specialty;
    if (minRating > 0) params.minRating = minRating;
    doctorsApi
      .getAll(params as Parameters<typeof doctorsApi.getAll>[0], { signal: ctrl.signal })
      .then(({ data }) => {
        if (cancelled.current) return;
        const res = (data?.data || data) as { doctors?: Doctor[]; data?: Doctor[]; total?: number };
        const list = res.doctors ?? res.data ?? [];
        setDoctors(Array.isArray(list) ? list : []);
        setTotal(Number(res.total) || 0);
      })
      .catch((err) => {
        if (!cancelled.current && err?.code !== 'ERR_CANCELED' && err?.name !== 'AbortError') setDoctors([]);
      })
      .finally(() => {
        if (!cancelled.current) setLoading(false);
      });
    return () => {
      cancelled.current = true;
      ctrl.abort();
    };
  }, [page, specialty, minRating]);

  useEffect(() => {
    setPage(1);
  }, [specialty, minRating]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const filtered = search
    ? doctors.filter((d) => getFullName(d).toLowerCase().includes(search.toLowerCase()))
    : doctors;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Find a Doctor</h1>
              <p className="text-gray-500 mt-1">Browse our network of qualified healthcare professionals</p>
            </div>
            <Link to="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              &larr; Home
            </Link>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              />
            </div>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
            >
              {SPECIALTIES.map((s) => (
                <option key={s} value={s === 'All Specialties' ? '' : s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
            >
              {RATING_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <DoctorCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <svg className="mx-auto w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No doctors found</h3>
            <p className="text-gray-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((doctor) => (
                <div
                  key={doctor.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={`w-14 h-14 rounded-full ${AVATAR_COLORS[doctor.id % AVATAR_COLORS.length]} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}
                    >
                      {getInitials(doctor)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{getFullName(doctor)}</h3>
                      {doctor.specializations && doctor.specializations.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {doctor.specializations.slice(0, 3).map((spec) => (
                            <span
                              key={spec.id}
                              className="inline-block text-xs font-medium bg-blue-50 text-blue-700 rounded-full px-2.5 py-0.5"
                            >
                              {spec.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <StarRating rating={Number(doctor.averageRating) || 0} />
                    <span className="text-xs text-gray-400 ml-1">({doctor.totalReviews} reviews)</span>
                  </div>

                  {doctor.consultationFee != null && (
                    <p className="text-sm text-gray-600 mb-4">
                      Consultation fee:{' '}
                      <span className="font-semibold text-gray-900">${doctor.consultationFee}</span>
                    </p>
                  )}

                  <div className="mt-auto pt-2">
                    <Link
                      to={`/doctors/${doctor.id}`}
                      className="block w-full text-center rounded-lg border-2 border-blue-600 text-blue-600 font-semibold py-2 hover:bg-blue-600 hover:text-white transition"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | string)[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    typeof item === 'string' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item)}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition ${item === page
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        {item}
                      </button>
                    ),
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
