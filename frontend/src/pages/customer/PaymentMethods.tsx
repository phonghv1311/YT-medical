import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { paymentsApi } from '../../api';
import type { PaymentMethod } from '../../types';
import { ListRowSkeleton } from '../../components/skeletons';

function CardIcon({ type }: { type: string }) {
  const isCard = type === 'card' || type === 'credit_card';
  return (
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isCard ? 'bg-amber-50' : 'bg-slate-100'}`}>
      <svg
        className={`h-7 w-7 ${isCard ? 'text-amber-600' : 'text-slate-600'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    </div>
  );
}

function normalizePaymentMethodsList(res: unknown): PaymentMethod[] {
  if (!res || typeof res !== 'object') return [];
  const r = res as { data?: unknown; paymentMethods?: unknown };
  const raw = r.data ?? r.paymentMethods ?? (Array.isArray(res) ? res : null);
  if (Array.isArray(raw)) {
    return raw.map((item: Record<string, unknown>) => ({
      id: Number(item.id),
      userId: Number(item.userId),
      type: String(item.type ?? ''),
      provider: String(item.provider ?? ''),
      last4: item.last4 != null ? String(item.last4) : undefined,
      isDefault: Boolean(item.isDefault),
    })) as PaymentMethod[];
  }
  return [];
}

export default function PaymentMethods() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: 'credit_card' as const, provider: '', last4: '' });
  const [fetchError, setFetchError] = useState<string | null>(null);

  const formatType = (type: string) => {
    if (type === 'credit_card' || type === 'card') return t('payments.creditCard');
    if (type === 'bank') return t('payments.bankAccount');
    if (type === 'wallet') return t('payments.digitalWallet');
    return type.replace(/_/g, ' ');
  };

  useEffect(() => {
    let cancelled = false;
    setFetchError(null);
    paymentsApi
      .getPaymentMethods()
      .then((res) => {
        if (cancelled) return;
        const list = normalizePaymentMethodsList(res?.data ?? res);
        setMethods(list);
      })
      .catch(() => {
        if (!cancelled) {
          setFetchError(t('payments.loadFailed') ?? 'Could not load payment methods.');
          setMethods([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleAdd = async () => {
    if (!form.provider) return;
    setSaving(true);
    try {
      const { data } = await paymentsApi.addPaymentMethod({
        type: form.type,
        provider: form.provider,
        last4: form.last4 || undefined,
        isDefault: methods.length === 0,
      });
      const newMethod: PaymentMethod = data.data ?? data;
      setMethods((prev) => [...prev, newMethod]);
      setForm({ type: 'credit_card', provider: '', last4: '' });
      setShowModal(false);
    } catch {
      /* noop */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 h-14 flex items-center justify-between px-4">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">{t('payments.paymentMethods')}</h1>
        <div className="w-10" />
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-gray-500">{t('payments.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="shrink-0 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition"
          >
            + {t('payments.addPaymentMethod')}
          </button>
        </div>

        {fetchError && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {fetchError}
            <button type="button" onClick={() => window.location.reload()} className="mt-2 block font-medium text-amber-700 hover:underline">
              {t('common.retry') ?? 'Retry'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <ListRowSkeleton key={i} lines={2} />
            ))}
          </div>
        ) : methods.length === 0 && !fetchError ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
            <p className="text-gray-500">{t('payments.noMethodsYet')}</p>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="mt-4 text-sm font-medium text-violet-600 hover:text-violet-700 hover:underline"
            >
              {t('payments.addPaymentMethod')}
            </button>
          </div>
        ) : (
          <div className="space-y-4" data-testid="payment-methods-list">
            {methods.map((m) => (
              <div
                key={m.id ?? `pm-${m.provider}-${m.last4 ?? 'x'}`}
                className="relative rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                {m.isDefault && (
                  <span className="absolute right-4 top-4 inline-flex rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-medium text-white">
                    {t('payments.setAsDefault')}
                  </span>
                )}
                <div className="flex items-center gap-4">
                  <CardIcon type={m.type} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">{m.provider}</p>
                    <p className="text-sm text-gray-500">{formatType(m.type)}</p>
                    {m.last4 && (
                      <p className="mt-0.5 font-mono text-sm text-gray-500">.... {m.last4}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900">{t('payments.addPaymentMethod')}</h3>
              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('common.select')}</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  >
                    <option value="credit_card">{t('payments.creditCard')}</option>
                    <option value="paypal">PayPal</option>
                    <option value="vnpay">VNPay</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('payments.provider')} *</label>
                  <input
                    placeholder="e.g. Stripe, Visa, Mastercard"
                    value={form.provider}
                    onChange={(e) => setForm({ ...form, provider: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('payments.last4')}</label>
                  <input
                    maxLength={4}
                    placeholder="1489"
                    value={form.last4}
                    onChange={(e) => setForm({ ...form, last4: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={saving || !form.provider}
                  className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60 transition"
                >
                  {saving ? t('admin.saving') : t('payments.save')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
