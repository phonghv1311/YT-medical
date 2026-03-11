import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../contexts/LanguageContext';
import { doctorsApi } from '../../../api/doctors';

type Specialization = { id: number; name: string };
type Qualification = { qualification: string; institution: string; year: string };

export default function DoctorOnboardingStep2() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [specializationIds, setSpecializationIds] = useState<number[]>([]);
  const [bio, setBio] = useState('');
  const [qualifications, setQualifications] = useState<Qualification[]>([{ qualification: '', institution: '', year: '' }]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showAddSpecialty, setShowAddSpecialty] = useState(false);
  const [specialtySelect, setSpecialtySelect] = useState<number | ''>('');

  useEffect(() => {
    doctorsApi.getSpecializations()
      .then((res) => {
        const raw = res.data as unknown;
        const list = Array.isArray(raw) ? raw : (raw as { data?: unknown[] })?.data ?? [];
        setSpecializations(Array.isArray(list) ? list : []);
      })
      .catch(() => setSpecializations([]))
      .finally(() => setLoading(false));
  }, []);

  const addSpecialty = () => {
    if (specialtySelect && !specializationIds.includes(Number(specialtySelect))) {
      setSpecializationIds((prev) => [...prev, Number(specialtySelect)]);
      setSpecialtySelect('');
      setShowAddSpecialty(false);
    }
  };

  const removeSpecialty = (id: number) => {
    setSpecializationIds((prev) => prev.filter((s) => s !== id));
  };

  const addQualification = () => {
    setQualifications((prev) => [...prev, { qualification: '', institution: '', year: '' }]);
  };

  const updateQualification = (index: number, field: keyof Qualification, value: string) => {
    setQualifications((prev) => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)));
  };

  const removeQualification = (index: number) => {
    setQualifications((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : [{ qualification: '', institution: '', year: '' }]));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const parsedYears = yearsOfExperience.trim() ? parseInt(yearsOfExperience, 10) : undefined;
    const yearsValid = parsedYears === undefined || (!Number.isNaN(parsedYears) && parsedYears >= 0);
    const quals = qualifications
      .filter((q) => q.qualification.trim())
      .map((q) => {
        const yearStr = q.year.trim();
        let year: number | undefined;
        if (yearStr) {
          const y = parseInt(yearStr, 10);
          if (!Number.isNaN(y) && y >= 1900) year = y;
        }
        return {
          qualification: q.qualification.trim(),
          institution: q.institution?.trim() || undefined,
          year,
        };
      })
      .filter((q) => q.qualification);
    if (!yearsValid) {
      setSubmitError(t('onboarding.invalidYears'));
      return;
    }
    setSubmitting(true);
    try {
      await doctorsApi.updateOnboarding({
        yearsOfExperience: parsedYears,
        specializationIds: specializationIds.length ? specializationIds : undefined,
        bio: bio.trim() || undefined,
        qualifications: quals.length ? quals : undefined,
      });
      navigate('/doctor', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] }; status?: number } })?.response?.data?.message;
      const str = Array.isArray(msg) ? msg[0] : msg;
      setSubmitError(str ?? t('onboarding.submitError'));
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
        <Link to="/register/doctor" className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-900">{t('onboarding.professionalDetails')}</h1>
      </header>

      <main className="px-4 max-w-lg mx-auto py-6 pb-40">
        <div className="flex justify-center gap-1.5 mb-2">
          <span className="w-2 h-2 rounded-full bg-gray-300" />
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          <span className="w-2 h-2 rounded-full bg-gray-300" />
        </div>
        <p className="text-sm text-gray-500 text-center mb-6">{t('onboarding.stepOf', { current: '2', total: '3' })}: {t('onboarding.verificationPending')}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-1">{t('onboarding.expertiseTitle')}</h2>
            <p className="text-sm text-gray-500 mb-4">{t('onboarding.expertiseDescription')}</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('onboarding.yearsOfExperience')}</label>
              <input
                type="number"
                min={0}
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value)}
                placeholder={t('onboarding.yearsPlaceholder')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('onboarding.areasOfExpertise')}</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {specializationIds.map((id) => {
                  const name = specializations.find((s) => s.id === id)?.name ?? '';
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-sm"
                    >
                      {name}
                      <button
                        type="button"
                        onClick={() => removeSpecialty(id)}
                        className="p-0.5 rounded hover:bg-blue-200"
                        aria-label={`Remove ${name}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </span>
                  );
                })}
                {!showAddSpecialty ? (
                  <button
                    type="button"
                    onClick={() => setShowAddSpecialty(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 text-sm font-medium hover:border-blue-400 hover:text-blue-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    {t('onboarding.addSpecialty')}
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 flex-wrap">
                    <select
                      value={specialtySelect}
                      onChange={(e) => setSpecialtySelect(e.target.value === '' ? '' : Number(e.target.value))}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm"
                    >
                      <option value="">Select</option>
                      {specializations
                        .filter((s) => !specializationIds.includes(s.id))
                        .map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                    <button type="button" onClick={addSpecialty} className="text-sm text-blue-600 font-medium">Add</button>
                    <button type="button" onClick={() => { setShowAddSpecialty(false); setSpecialtySelect(''); }} className="text-sm text-gray-500">Cancel</button>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">{t('onboarding.professionalBio')}</h2>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t('onboarding.bioPlaceholder')}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">{t('onboarding.educationCertifications')}</h2>
            <div className="space-y-3">
              {qualifications.map((q, index) => (
                <div key={index} className="p-4 rounded-xl border border-gray-200 bg-white flex gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <input
                      type="text"
                      value={q.institution}
                      onChange={(e) => updateQualification(index, 'institution', e.target.value)}
                      placeholder="Institution (e.g. Johns Hopkins University)"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    />
                    <input
                      type="text"
                      value={q.qualification}
                      onChange={(e) => updateQualification(index, 'qualification', e.target.value)}
                      placeholder="Degree / Certificate (e.g. Doctor of Medicine (MD))"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    />
                    <input
                      type="text"
                      value={q.year}
                      onChange={(e) => updateQualification(index, 'year', e.target.value)}
                      placeholder="Year (optional)"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeQualification(index)}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600"
                    aria-label="Remove"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addQualification}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 text-sm font-medium hover:border-blue-400 hover:text-blue-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                {t('onboarding.addEducation')}
              </button>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-2">{t('onboarding.notableAchievements')}</h2>
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 flex gap-3">
              <span className="text-amber-500 flex-shrink-0 mt-0.5" aria-hidden>🏅</span>
              <p className="text-sm text-blue-800">
                {t('onboarding.achievementsNote')}
              </p>
            </div>
          </section>

          <div className="fixed bottom-0 left-0 right-0 z-20 p-4 pb-6 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] max-w-lg mx-auto">
            {submitError && (
              <p className="mb-3 px-4 py-2 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">
                {submitError}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-blue-700 transition"
            >
              {submitting ? t('onboarding.loading') : t('onboarding.completeRegistration')}
              {!submitting && (
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </span>
              )}
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">{t('onboarding.stepOf', { current: '2', total: '3' })}: {t('onboarding.verificationPending')}</p>
          </div>
        </form>
      </main>
    </div>
  );
}
