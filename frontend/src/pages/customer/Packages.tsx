import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { paymentsApi } from '../../api';
import type { Package } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { CardSkeleton } from '../../components/skeletons';

const BADGES: Record<string, string> = {
  'Free Trial': 'RECOMMENDED',
  '6 Months': 'POPULAR',
  '1 Year': 'BEST VALUE',
};

export default function Packages() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentsApi.getPackages()
      .then((r) => {
        const list = r.data?.data ?? r.data ?? [];
        setPackages(Array.isArray(list) ? list.filter((p: Package) => p.isActive) : []);
      })
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (pkg: Package) => {
    navigate('/customer/payment-details', { state: { package: pkg } });
  };

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <CardSkeleton key={i} lines={3} showImage={false} />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center justify-between h-14 px-4 -mt-4 pt-4">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">{t('packages.chooseYourPlan')}</h1>
        <div className="w-10" />
      </header>

      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('packages.investInHealth')}</h2>
        <p className="text-gray-500 mt-1">{t('packages.unlockTools')}</p>

        <div className="mt-8 space-y-4">
          {packages.length === 0 ? (
            <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-6 relative">
              <span className="absolute top-4 right-4 rounded-lg bg-sky-500 text-white text-xs font-bold px-2 py-0.5">RECOMMENDED</span>
              <p className="text-sky-600 font-semibold">Free Trial</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">$0 <span className="text-sm font-normal text-gray-500">/ 2 months</span></p>
              <ul className="mt-3 space-y-1 text-sm text-gray-600">
                <li className="flex items-center gap-2">✓ Access to all features</li>
                <li className="flex items-center gap-2">✓ No credit card required</li>
              </ul>
              <button type="button" onClick={() => handleSelect({ id: 0, name: 'Free Trial', price: 0, durationDays: 60, isActive: true } as Package)} className="w-full mt-4 py-3 rounded-xl bg-sky-500 text-white font-bold">Select Free Trial</button>
            </div>
          ) : (
            packages.map((pkg) => {
              const badge = BADGES[pkg.name];
              const isRecommended = pkg.name.toLowerCase().includes('free') || badge === 'RECOMMENDED';
              return (
                <div key={pkg.id} className={`rounded-2xl border-2 p-6 relative ${isRecommended ? 'border-sky-300 bg-sky-50/50' : 'border-gray-200 bg-gray-50'}`}>
                  {badge && <span className={`absolute top-4 right-4 rounded-lg text-white text-xs font-bold px-2 py-0.5 ${badge === 'RECOMMENDED' ? 'bg-sky-500' : badge === 'POPULAR' ? 'bg-green-500' : 'bg-teal-500'}`}>{badge}</span>}
                  <p className={`font-semibold ${isRecommended ? 'text-sky-600' : 'text-gray-900'}`}>{pkg.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">${Number(pkg.price)} <span className="text-sm font-normal text-gray-500">/ {pkg.durationDays === 365 ? 'year' : pkg.durationDays === 30 ? 'month' : `${pkg.durationDays} months`}</span></p>
                  {pkg.description && <p className="text-sm text-gray-600 mt-2">{pkg.description}</p>}
                  <div className="mt-4 flex flex-wrap gap-2 items-center">
                    <Link to={`/customer/packages/${pkg.id}`} className="px-4 py-2 rounded-xl border border-sky-500 text-sky-600 font-medium hover:bg-sky-50 transition">
                      {t('packages.viewDetails')}
                    </Link>
                    <button type="button" onClick={() => handleSelect(pkg)} className={`${isRecommended ? 'flex-1 min-w-0 py-3 rounded-xl bg-sky-500 text-white font-bold' : 'px-5 py-2 rounded-xl bg-sky-500 text-white font-medium'}`}>
                      {isRecommended ? `Select ${pkg.name}` : 'Select'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <p className="mt-8 text-xs text-gray-500 text-center leading-relaxed">
          {t('packages.plansDisclaimer')}
        </p>
      </div>
    </div>
  );
}
