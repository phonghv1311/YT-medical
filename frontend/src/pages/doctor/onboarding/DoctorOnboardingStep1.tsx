import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../contexts/LanguageContext';
import { doctorsApi } from '../../../api/doctors';

type Specialization = { id: number; name: string };
type Hospital = { id: number; name: string };
type Department = { id: number; name: string; hospitalId: number };

export default function DoctorOnboardingStep1() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    Promise.all([
      doctorsApi.getSpecializations({ signal: ctrl.signal }),
      doctorsApi.getHospitals({ signal: ctrl.signal }),
    ])
      .then(([specRes, hospRes]) => {
        const specList = Array.isArray(specRes.data) ? specRes.data : (specRes.data as { data?: unknown[] })?.data ?? [];
        const hospRaw = Array.isArray(hospRes.data) ? hospRes.data : (hospRes.data as { data?: unknown[] })?.data ?? hospRes.data;
        const hospList = Array.isArray(hospRaw) ? hospRaw : (hospRaw as { hospitals?: unknown[] })?.hospitals ?? (hospRaw as { rows?: unknown[] })?.rows ?? [];
        setSpecializations(Array.isArray(specList) ? specList : []);
        setHospitals(Array.isArray(hospList) ? hospList : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const [firstName, ...lastParts] = fullName.trim().split(/\s+/);
    const lastName = lastParts.join(' ') || firstName;
    const years = yearsOfExperience.trim() ? parseInt(yearsOfExperience, 10) : undefined;
    setSubmitting(true);
    try {
      await doctorsApi.updateOnboarding({
        firstName: firstName || fullName,
        lastName,
        licenseNumber: licenseNumber || undefined,
        yearsOfExperience: years !== undefined && !Number.isNaN(years) ? years : undefined,
      });
      if (certificateFile) {
        try {
          await doctorsApi.me.uploadCertificate(certificateFile, 'medical_license');
        } catch {
          /* optional */
        }
      }
      navigate('/register/doctor/step-2', { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{t('onboarding.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center gap-4 px-4 h-14 border-b border-gray-100">
        <Link to="/doctor" className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-900">{t('auth.doctorInfoTitle')}</h1>
      </header>

      <main className="px-4 max-w-lg mx-auto py-6">
        <p className="text-xs text-gray-500 mb-1">{t('auth.step1BasicInfo')}</p>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1">
          <div className="h-full w-1/2 bg-blue-600 rounded-full" />
        </div>
        <p className="text-sm text-gray-500 mb-6">1/2</p>

        <div className="flex flex-col items-center mb-6">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="relative w-28 h-28 rounded-full bg-sky-100 border-2 border-white shadow-inner overflow-hidden"
          >
            <div className="w-full h-full flex items-center justify-center text-sky-600">
              <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
            </span>
            <span className="absolute bottom-0 left-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </span>
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={() => {}} />
          <p className="text-sm font-medium text-gray-700 mt-2">{t('auth.profilePicture')}</p>
          <p className="text-xs text-gray-500">{t('auth.clickToUploadPortrait')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">{t('auth.doctorFullName')} *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">{t('auth.dateOfBirth')} *</label>
            <div className="relative">
              <input
                type="text"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                placeholder={t('auth.datePlaceholder')}
                className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">{t('auth.gender')} *</label>
            <div className="relative">
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
              >
                <option value="">{t('auth.selectGender')}</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">{t('auth.phone')} *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('auth.phonePlaceholder')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">{t('auth.emailAddress')} *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">{t('auth.idCard')} *</label>
            <input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder={t('auth.enterIdCard')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">{t('auth.practiceCertificate')} *</label>
            <button
              type="button"
              onClick={() => certInputRef.current?.click()}
              className="w-full px-4 py-6 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/30 text-blue-700 flex flex-col items-center gap-2"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-sm font-medium">{t('auth.uploadCertificate')}</span>
            </button>
            <input
              ref={certInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => setCertificateFile(e.target.files?.[0] ?? null)}
            />
            {certificateFile && <p className="text-xs text-gray-500 mt-1">{certificateFile.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">{t('auth.yearsOfExperienceShort')} *</label>
            <input
              type="text"
              inputMode="numeric"
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(e.target.value.replace(/\D/g, '').slice(0, 3))}
              placeholder={t('auth.enterYears')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {t('auth.continue')}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>
      </main>
    </div>
  );
}
