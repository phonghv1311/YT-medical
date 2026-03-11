import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminApi } from '../../api/admin';
import { ListRowSkeleton } from '../../components/skeletons';
import type { Department, Hospital } from '../../types';

const DEPT_ICONS: Record<string, string> = {
  emergency: 'E',
  radiology: 'R',
  pediatrics: 'P',
  cardiology: 'C',
  default: 'D',
};

function getDeptIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const key of Object.keys(DEPT_ICONS)) {
    if (key !== 'default' && lower.includes(key)) return DEPT_ICONS[key];
  }
  return DEPT_ICONS.default;
}

export default function HospitalDepartmentsList() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const hospitalId = id ? parseInt(id, 10) : NaN;
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || isNaN(hospitalId)) {
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    Promise.all([
      adminApi.getHospital(hospitalId, { signal }).then((r) => r.data?.data ?? r.data),
      adminApi.getDepartments(hospitalId, { signal }).then((r) => (r.data?.data ?? r.data) ?? []),
    ])
      .then(([h, depts]) => {
        if (signal.aborted) return;
        setHospital(h as Hospital);
        setDepartments(Array.isArray(depts) ? depts : []);
      })
      .catch(() => {})
      .finally(() => { if (!signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [id, hospitalId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <ListRowSkeleton key={i} lines={2} />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2 h-14 px-4">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label="Back">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex-1">{t('customer.availableDepartments')}</h1>
        </div>
      </header>
      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {hospital && <p className="text-sm text-gray-600 mb-2">{hospital.name}</p>}
        {departments.length === 0 ? (
          <p className="text-gray-500 py-12">{t('customer.noHospitals')}</p>
        ) : (
          departments.map((dept) => (
            <Link
              key={dept.id}
              to={`/customer/departments/${dept.id}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition"
            >
              <span className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center font-bold text-teal-700">{getDeptIcon(dept.name)}</span>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900">{dept.name}</h2>
                {dept.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{dept.description}</p>}
              </div>
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
