import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { paymentsApi } from '../../api';
import type { Package } from '../../types';

export default function PaymentDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const pkg = (location.state as { package?: Package })?.package;
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [loading, setLoading] = useState(false);

  const displayName = pkg?.name ?? 'Annual Family Health';
  const displayPrice = pkg ? Number(pkg.price) : 199;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkg) return;
    setLoading(true);
    try {
      await paymentsApi.buyPackage({ packageId: pkg.id });
      navigate('/customer/packages');
    } catch {
      /* show error */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center justify-between h-14 px-4 -mt-4 pt-4">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">Payment Details</h1>
        <div className="w-10" />
      </header>

      <div className="p-6 space-y-6">
        <div className="rounded-2xl bg-slate-100 p-5 border border-slate-200">
          <p className="text-sm text-gray-500">Plan Selected</p>
          <div className="flex items-start justify-between gap-2 mt-1">
            <div>
              <span className="inline-block rounded-lg bg-blue-600 text-white text-xs font-bold px-2 py-0.5 mb-2">PREMIUM</span>
              <p className="text-lg font-bold text-gray-900">{displayName}</p>
              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</span>
                24/7 Unlimited Consultations
              </p>
            </div>
            <p className="text-xl font-bold text-blue-600">${displayPrice}<span className="text-sm font-normal text-blue-500">/year</span></p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="font-bold text-gray-900">Card Information</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
            <input type="text" placeholder="Enter your full name" value={cardName} onChange={(e) => setCardName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
            <div className="relative">
              <input type="text" placeholder="0000 0000 0000 0000" value={cardNumber} onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input type="text" placeholder="MM/YY" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
              <div className="relative">
                <input type="text" placeholder="123" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-help">?</span>
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-600">Securely save card for future billing.</span>
          </label>

          <div className="flex gap-6 py-4 text-center text-sm text-gray-500">
            <span className="flex items-center justify-center gap-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> SSL SECURE</span>
            <span className="flex items-center justify-center gap-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> VISA/MC</span>
            <span className="flex items-center justify-center gap-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> HIPAA COMPLIANT</span>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Pay Now ${displayPrice.toFixed(2)}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center">
          By clicking &quot;Pay Now&quot;, you agree to our <Link to="/terms" className="text-blue-600 underline">Terms of Service</Link> and <Link to="/subscription" className="text-blue-600 underline">Subscription Agreement</Link>.
        </p>
      </div>
    </div>
  );
}
