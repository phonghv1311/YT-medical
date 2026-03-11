import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminApi } from '../../api/admin';
import { doctorsApi } from '../../api/doctors';
import { FullPageSkeleton } from '../../components/skeletons';
import type { Hospital, Department, Doctor } from '../../types';

const FACILITIES = [
  { icon: 'P', label: 'Parking' },
  { icon: '⚕', label: 'Pharmacy' },
  { icon: 'Wi-Fi', label: 'Free Wi-Fi' },
  { icon: '☕', label: 'Cafeteria' },
];

const OPENING_HOURS = [
  { days: 'Monday - Thursday', hours: '08:00 AM - 10:00 PM' },
  { days: 'Friday', hours: '08:00 AM - 11:00 PM' },
  { days: 'Saturday', hours: '09:00 AM - 08:00 PM' },
  { days: 'Sunday', hours: '09:00 AM - 05:00 PM' },
];

const SPECIALTIES_SAMPLE = [
  { name: 'Emergency Care', desc: 'Level 1 Trauma Center', color: 'text-red-600' },
  { name: 'Radiology', desc: 'Imaging & Diagnostics', color: 'text-blue-600' },
  { name: 'Pediatrics', desc: 'Child & Adolescent Care', color: 'text-amber-600' },
  { name: 'Cardiology', desc: 'Heart & Vascular', color: 'text-purple-600' },
  { name: 'Neurology', desc: 'Brain & Nervous System', color: 'text-indigo-600' },
  { name: 'Ophthalmology', desc: 'Eye Care', color: 'text-teal-600' },
];

function getDoctorName(d: Doctor): string {
  const u = d.user as { firstName?: string; lastName?: string } | undefined;
  if (!u) return 'Doctor';
  const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
  return name || 'Doctor';
}

function getSpecialty(d: Doctor): string {
  const specs = (d as Doctor & { specializations?: { name: string }[] }).specializations;
  return specs?.[0]?.name ?? 'General';
}

export default function HospitalDetail() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const hospitalId = id ? parseInt(id, 10) : NaN;
  const [hospital, setHospital] = useState<(Hospital & { departments?: Department[] }) | null>(null);
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
        if (!cancelled.current) setHospital(r.data?.data ?? r.data);
      }),
      doctorsApi.getAll({ hospitalId, limit: 20 }, { signal }).then((r) => {
        if (!cancelled.current) {
          const list = r.data?.doctors ?? r.data?.data?.doctors ?? r.data ?? [];
          setDoctors(Array.isArray(list) ? list : []);
        }
      }),
    ]).catch(() => { if (!cancelled.current) setDoctors([]); }).finally(() => { if (!cancelled.current) setLoading(false); });
    return () => {
      cancelled.current = true;
      ctrl.abort();
    };
  }, [id, hospitalId]);

  if (loading || !hospital) {
    return loading ? <FullPageSkeleton /> : (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">{t('customer.noHospitals')}</p>
      </div>
    );
  }

  const mapAddress = (hospital.address || '').replace(/\s+/g, '+');
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapAddress)}`;
  const departments = hospital.departments ?? [];
  const specialtiesToShow = departments.length >= 6 ? departments.slice(0, 6).map((d, i) => ({ name: d.name, desc: '', color: SPECIALTIES_SAMPLE[i % SPECIALTIES_SAMPLE.length].color })) : SPECIALTIES_SAMPLE;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center justify-between h-14 px-4">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label="Back">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">Hospital Details</h1>
        <button type="button" className="p-2 rounded-lg hover:bg-gray-100" aria-label="Share">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
        </button>
      </header>

      <div className="max-w-lg mx-auto">
        {/* Hospital image + rating badge */}
        <div className="relative h-52 bg-gradient-to-br from-teal-100 to-cyan-100">
          <span className="absolute bottom-3 right-3 rounded-lg bg-white/95 text-gray-800 text-sm font-medium px-2.5 py-1.5 flex items-center gap-1 shadow">
            <span className="text-amber-500">★</span> 4.8 (1.2k reviews)
          </span>
        </div>

        {/* Name + status + add */}
        <div className="px-4 -mt-2 relative z-[1]">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold text-gray-900 flex-1">{hospital.name}</h2>
            <button type="button" className="shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-light hover:bg-blue-200" aria-label="Add to favorites">+</button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1">Open Now</span>
            <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1">Emergency 24/7</span>
          </div>
        </div>

        {/* Reception & Appointments card */}
        <div className="px-4 mt-4">
          <a
            href={`tel:${(hospital.phone || '').replace(/\D/g, '')}`}
            className="flex items-center gap-3 p-4 rounded-xl bg-gray-100 border border-gray-200"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reception & Appointments</p>
              <p className="text-base font-bold text-gray-900 mt-0.5">{hospital.phone || '+1 (212) 555-0198'}</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </a>
        </div>

        {/* Address card */}
        <div className="px-4 mt-3">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-100 border border-gray-200">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Address</p>
              <p className="text-sm text-gray-900 mt-0.5">{hospital.address || '123 Health Avenue, Medical District, New York, NY 10021, United States'}</p>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 mt-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>

        {/* Opening Hours */}
        <div className="px-4 mt-6">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Opening Hours
          </h3>
          <div className="mt-2 rounded-xl bg-white border border-gray-200 overflow-hidden">
            {OPENING_HOURS.map((row) => (
              <div key={row.days} className="flex justify-between items-center py-2.5 px-4 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700">{row.days}</span>
                <span className="text-sm font-medium text-gray-900">{row.hours}</span>
              </div>
            ))}
            <div className="py-2.5 px-4 bg-red-50 border-t border-red-100">
              <p className="text-xs font-bold text-red-600 uppercase">Emergency ER</p>
              <p className="text-sm text-red-700 font-medium">24 Hours / 7 Days</p>
            </div>
          </div>
        </div>

        {/* Our Specialties */}
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">Our Specialties</h3>
            <Link to={`/customer/hospitals/${hospitalId}/departments`} className="text-sm font-medium text-blue-600">View All ({departments.length || 24})</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {specialtiesToShow.map((s) => (
              <div key={s.name} className="rounded-xl bg-gray-100 border border-gray-200 p-3">
                <p className={`text-lg font-bold ${s.color}`}>•</p>
                <p className="font-semibold text-gray-900 text-sm mt-0.5">{s.name}</p>
                {s.desc ? <p className="text-xs text-gray-600 mt-0.5">{s.desc}</p> : null}
              </div>
            ))}
          </div>
        </div>

        {/* Doctors at this Hospital */}
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">Doctors at this Hospital</h3>
            <Link to={`/customer/hospitals/${hospitalId}/doctors`} className="text-sm font-medium text-blue-600">View All</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
            {doctors.slice(0, 6).map((d) => (
              <Link
                key={d.id}
                to={`/doctors/${d.id}`}
                className="shrink-0 w-28 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-lg mx-auto">
                  {(d.user as { firstName?: string } | undefined)?.firstName?.[0]}
                  {(d.user as { lastName?: string } | undefined)?.lastName?.[0]}
                </div>
                <p className="text-sm font-semibold text-gray-900 mt-2 truncate">{getDoctorName(d)}</p>
                <p className="text-xs text-gray-600 truncate">{getSpecialty(d)}</p>
              </Link>
            ))}
          </div>
          {doctors.length === 0 && <p className="text-sm text-gray-500 py-2">No doctors listed.</p>}
        </div>

        {/* On-site Facilities */}
        <div className="px-4 mt-6 pb-8">
          <h3 className="font-bold text-gray-900 mb-3">On-site Facilities</h3>
          <div className="grid grid-cols-4 gap-3">
            {FACILITIES.map((f) => (
              <div key={f.label} className="rounded-xl bg-gray-100 border border-gray-200 p-3 text-center">
                <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 mx-auto">{f.icon}</div>
                <p className="text-xs font-medium text-gray-700 mt-2">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
