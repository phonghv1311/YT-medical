import { useEffect, useState } from 'react';
import { doctorsApi } from '../../api/doctors';
import type { Transaction } from '../../types';
import { TableSkeleton } from '../../components/skeletons';

interface EarningsSummary {
  totalEarnings: number;
  thisMonth: number;
  totalTips: number;
}

function currency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default function DoctorEarnings() {
  const [summary, setSummary] = useState<EarningsSummary>({ totalEarnings: 0, thisMonth: 0, totalTips: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  async function load(signal?: AbortSignal) {
    setLoading(true);
    try {
      const params: { dateFrom?: string; dateTo?: string } = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const { data } = await doctorsApi.me.getEarnings(params, signal ? { signal } : undefined);
      if (signal?.aborted) return;
      const payload = data.data ?? data;

      if (payload.summary) {
        setSummary(payload.summary);
        setTransactions(payload.transactions ?? []);
      } else if (Array.isArray(payload)) {
        const txns = payload as Transaction[];
        setTransactions(txns);
        const now = new Date();
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        setSummary({
          totalEarnings: txns.filter((t) => t.status === 'completed').reduce((s, t) => s + t.amount, 0),
          thisMonth: txns.filter((t) => t.status === 'completed' && t.createdAt?.startsWith(monthStart)).reduce((s, t) => s + t.amount, 0),
          totalTips: txns.filter((t) => t.type === 'tip' && t.status === 'completed').reduce((s, t) => s + t.amount, 0),
        });
      }
    } catch (err) {
      if (signal?.aborted) return;
      console.error('Failed to load earnings', err);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, []);

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    load();
  }

  const typeColor: Record<string, string> = {
    consultation: 'bg-blue-100 text-blue-800',
    package: 'bg-indigo-100 text-indigo-800',
    tip: 'bg-amber-100 text-amber-800',
    refund: 'bg-red-100 text-red-800',
  };

  if (loading) {
    return (
      <TableSkeleton rows={5} cols={4} headerLabels={['Date', 'Patient', 'Amount', 'Type']} />
    );
  }

  const cards = [
    { label: 'Total Earnings', value: currency(summary.totalEarnings), color: 'bg-green-50 text-green-700' },
    { label: 'This Month', value: currency(summary.thisMonth), color: 'bg-blue-50 text-blue-700' },
    { label: 'Tips Received', value: currency(summary.totalTips), color: 'bg-amber-50 text-amber-700' },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-xl p-6 ${c.color}`}>
            <p className="text-sm font-medium opacity-75">{c.label}</p>
            <p className="mt-2 text-3xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Date filter */}
      <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4 bg-white p-4 rounded-xl border border-gray-200">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2 border" />
        </div>
        <button type="submit" className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition">Filter</button>
        {(dateFrom || dateTo) && (
          <button type="button" onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-sm text-blue-600 hover:underline">Clear</button>
        )}
      </form>

      {/* Transactions table */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-sm">No transactions found.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((txn, i) => (
                  <tr key={txn.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{txn.createdAt?.split('T')[0] ?? '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">User #{txn.userId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{currency(txn.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColor[txn.type] ?? 'bg-gray-100 text-gray-800'}`}>
                        {txn.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
