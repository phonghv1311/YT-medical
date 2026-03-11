import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { TableSkeleton } from '../../components/skeletons';

interface LogEntry {
  id: number;
  userId: number;
  user?: { firstName: string; lastName: string; email: string };
  action: string;
  resource: string;
  details?: string;
  createdAt: string;
}

const ACTION_OPTIONS = ['all', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'] as const;

export default function AdminLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterUser, setFilterUser] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  async function loadLogs(p = page, signal?: AbortSignal) {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page: p, limit };
      if (filterAction !== 'all') params.action = filterAction;
      if (filterUser) params.userId = Number(filterUser);

      const { data } = await adminApi.getLogs(params as Parameters<typeof adminApi.getLogs>[0], signal ? { signal } : undefined);
      if (signal?.aborted) return;
      const payload = data?.data ?? data;

      if (Array.isArray(payload)) {
        let filtered = payload as LogEntry[];
        if (filterDateFrom) filtered = filtered.filter((l) => l.createdAt >= filterDateFrom);
        if (filterDateTo) filtered = filtered.filter((l) => l.createdAt <= filterDateTo + 'T23:59:59');
        setLogs(filtered);
        setTotal(filtered.length);
      } else {
        setLogs(payload?.data ?? []);
        setTotal(payload?.total ?? 0);
      }
    } catch (err) {
      if (!signal?.aborted) console.error('Failed to load logs', err);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const ctrl = new AbortController();
    loadLogs(page, ctrl.signal);
    return () => ctrl.abort();
  }, [page]);

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadLogs(1);
  }

  function clearFilters() {
    setFilterAction('all');
    setFilterUser('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setPage(1);
    loadLogs(1);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
        <p className="mt-1 text-sm text-gray-500">Superadmin only — audit trail of system actions</p>
      </div>

      {/* Filters */}
      <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4 bg-white p-4 rounded-xl border border-gray-200">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
          <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2 border">
            {ACTION_OPTIONS.map((a) => <option key={a} value={a}>{a === 'all' ? 'All Actions' : a}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
          <input type="number" min={1} value={filterUser} onChange={(e) => setFilterUser(e.target.value)} placeholder="Any" className="rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2 border w-24" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
          <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
          <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2 border" />
        </div>
        <button type="submit" className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition">Filter</button>
        <button type="button" onClick={clearFilters} className="text-sm text-blue-600 hover:underline">Clear</button>
      </form>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={8} headerLabels={['Timestamp', 'User', 'Action', 'Resource', 'Details']} />
      ) : logs.length === 0 ? (
        <p className="text-gray-500">No log entries found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log, i) => (
                <tr key={log.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.user ? `${log.user.firstName} ${log.user.lastName}` : `User #${log.userId}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{log.action}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{log.resource}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{log.details ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50 transition">Prev</button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50 transition">Next</button>
        </div>
      )}
    </div>
  );
}
