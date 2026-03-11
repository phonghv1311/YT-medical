import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminApi } from '../../api/admin';
import { DoctorCardSkeleton } from '../../components/skeletons';
import type { Department } from '../../types';

export default function DepartmentDetail() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const deptId = id ? parseInt(id, 10) : NaN;
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || isNaN(deptId)) {
      setLoading(false);
      return;
    }
    adminApi
      .getDepartment(deptId)
      .then((r) => setDepartment(r.data?.data ?? r.data))
      .catch(() => setDepartment(null))
      .finally(() => setLoading(false));
  }, [id, deptId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <DoctorCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (!department) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">{t('customer.noHospitals')}</p>
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
          <h1 className="text-lg font-bold text-gray-900 flex-1">{t('customer.departmentDetails')}</h1>
        </div>
      </header>
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <h2 className="text-xl font-bold text-gray-900">{department.name}</h2>
          {department.hospitalId && (
            <Link to={`/customer/hospitals/${department.hospitalId}`} className="text-sm text-blue-600 font-medium mt-1 inline-block">
              {t('customer.viewHospital')}
            </Link>
          )}
          {department.description && <p className="text-gray-600 mt-3 leading-relaxed">{department.description}</p>}
        </div>
      </div>
    </div>
  );
}
