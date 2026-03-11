import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { patientsApi } from '../../api';
import type { FamilyMember } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { ListRowSkeleton } from '../../components/skeletons';

export default function Family() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', relationship: 'Spouse', dateOfBirth: '', gender: '', bloodType: '', statusNotes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    patientsApi.getFamilyMembersMe()
      .then((r) => setMembers(r.data?.data ?? r.data ?? []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.firstName || !form.lastName) return;
    setSaving(true);
    try {
      const { data } = await patientsApi.addFamilyMemberMe({
        firstName: form.firstName,
        lastName: form.lastName,
        relationship: form.relationship,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        bloodType: form.bloodType || undefined,
        statusNotes: form.statusNotes || undefined,
      });
      const newMember = data?.data ?? data;
      setMembers((prev) => [...prev, newMember]);
      setForm({ firstName: '', lastName: '', relationship: 'Spouse', dateOfBirth: '', gender: '', bloodType: '', statusNotes: '' });
      setShowModal(false);
    } catch {
      /* noop */
    } finally {
      setSaving(false);
    }
  };

  const getAge = (dob: string | undefined) => {
    if (!dob) return null;
    const y = new Date().getFullYear() - new Date(dob).getFullYear();
    return y > 0 ? `${y} yrs` : null;
  };

  const statusTag = (member: FamilyMember) => {
    const notes = (member as FamilyMember & { statusNotes?: string }).statusNotes;
    if (notes?.toLowerCase().includes('vaccination')) return { label: t('family.vaccinationDue'), className: 'bg-orange-500 text-white' };
    if (notes?.toLowerCase().includes('chronic') || notes?.toLowerCase().includes('hypertension')) return { label: notes, className: 'bg-teal-100 text-sky-700' };
    if (notes) return { label: notes, className: 'bg-teal-100 text-sky-700' };
    return { label: null, className: '' };
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center justify-between h-14 px-4 -mt-4 pt-4">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">{t('family.myFamily')}</h1>
        <Link to="/notifications" className="p-2 rounded-lg hover:bg-gray-100">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        </Link>
      </header>

      <div className="p-4 space-y-6">
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          {t('family.addFamilyMember')}
        </button>

        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('family.familyMembers')}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{t('family.manageDependents')}</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <ListRowSkeleton key={i} lines={3} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((m) => {
              const tag = statusTag(m);
              const age = getAge(m.dateOfBirth);
              const blood = (m as FamilyMember & { bloodType?: string }).bloodType || '—';
              return (
                <Link key={m.id} to={`/customer/family/${m.id}`} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-teal-200 transition">
                  <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0">
                    {m.firstName[0]}{m.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{m.firstName} {m.lastName}</p>
                    <p className="text-sm text-teal-600">{m.relationship}</p>
                    <div className="flex gap-4 mt-1 text-xs text-gray-500">
                      <span><span className="font-medium text-gray-600">{t('family.blood')}</span> {blood}</span>
                      <span><span className="font-medium text-gray-600">{t('family.age')}</span> {age || '—'}</span>
                    </div>
                    {tag.label && (
                      <span className={`inline-block mt-2 px-2.5 py-1 rounded-lg text-xs font-medium ${tag.className}`}>{tag.label}</span>
                    )}
                  </div>
                  <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('family.addMember')}</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder={t('family.firstName')} value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className="px-3 py-2.5 border border-gray-200 rounded-xl" />
                <input required placeholder={t('family.lastName')} value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className="px-3 py-2.5 border border-gray-200 rounded-xl" />
              </div>
              <select value={form.relationship} onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl">
                <option value="Spouse">{t('family.spouse')}</option>
                <option value="Child">{t('family.child')}</option>
                <option value="Parent">{t('family.parent')}</option>
                <option value="Other">{t('family.other')}</option>
              </select>
              <input type="date" placeholder="Date of birth" value={form.dateOfBirth} onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl" />
              <select value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl">
                <option value="">{t('family.gender')}</option>
                <option value="male">{t('family.male')}</option>
                <option value="female">{t('family.female')}</option>
                <option value="other">{t('family.other')}</option>
              </select>
              <input placeholder={t('family.bloodType')} value={form.bloodType} onChange={(e) => setForm((f) => ({ ...f, bloodType: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl" />
              <input placeholder={t('family.statusNotes')} value={form.statusNotes} onChange={(e) => setForm((f) => ({ ...f, statusNotes: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-medium">{t('common.cancel')}</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-teal-500 text-white rounded-xl font-medium disabled:opacity-50">{t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
