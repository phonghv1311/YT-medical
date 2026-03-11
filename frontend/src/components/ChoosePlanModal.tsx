import { useEffect, useState } from 'react';
import { paymentsApi } from '../api';
import type { Package } from '../types';
import { CardSkeleton } from './skeletons';

const BADGES: Record<string, string> = {
  'Free Trial': 'RECOMMENDED',
  '6 Months': 'POPULAR',
  '1 Year': 'BEST VALUE',
};

interface Props {
  onSelectPlan: (pkg: Package) => void;
  onClose: () => void;
}

export default function ChoosePlanModal({ onSelectPlan, onClose }: Props) {
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
    onSelectPlan(pkg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 flex items-center justify-between px-4 py-3 z-10">
          <h1 className="text-lg font-bold text-gray-900">Choose Your Plan</h1>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900">Invest in your health</h2>
          <p className="text-gray-500 mt-1">Unlock unlimited consultations and premium tools</p>

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2, 3].map((i) => (
                <CardSkeleton key={i} lines={3} showImage={false} />
              ))}
            </div>
          ) : (
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
                      <button type="button" onClick={() => handleSelect(pkg)} className={`mt-4 ${isRecommended ? 'w-full py-3 rounded-xl bg-sky-500 text-white font-bold' : 'ml-auto block px-5 py-2 rounded-xl bg-sky-500 text-white font-medium'}`}>
                        {isRecommended ? `Select ${pkg.name}` : 'Select'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          <p className="mt-8 text-xs text-gray-500 text-center leading-relaxed">
            All plans include 24/7 access to health management tools, priority support, and secure digital records. Recurring billing, cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
