import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doctorsApi } from '../../api/doctors';

type StatusFilter = 'All Status' | 'Clinical' | 'Admin';

interface RuleCard {
  id: string;
  title: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  modified: string;
}

function normalizeRule(item: unknown): RuleCard {
  const r = item as Record<string, unknown>;
  const id = r?.id != null ? String(r.id) : '';
  const title = (r?.title as string) ?? (r?.name as string) ?? 'Untitled';
  const description = (r?.description as string) ?? '';
  const status = (r?.status as string) === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const rawDate = (r?.updatedAt ?? r?.modifiedAt ?? r?.modified) as string | undefined;
  const modified = rawDate
    ? (() => {
      try {
        const d = new Date(rawDate);
        if (Number.isNaN(d.getTime())) return rawDate;
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        if (diffMs < 60 * 60 * 1000) return `${Math.round(diffMs / 60000)}m ago`;
        if (diffMs < 24 * 60 * 60 * 1000) return `${Math.round(diffMs / 3600000)}h ago`;
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      } catch {
        return rawDate;
      }
    })()
    : '—';
  return { id, title, description, status, modified };
}

export default function DoctorRuleManagement() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All Status');
  const [rules, setRules] = useState<RuleCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    let cancelled = false;
    doctorsApi.me.getRules({ signal: ctrl.signal })
      .then((res) => {
        if (cancelled) return;
        const raw = (res.data as unknown[]) ?? [];
        setRules(Array.isArray(raw) ? raw.map(normalizeRule) : []);
      })
      .catch(() => { if (!cancelled) setRules([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, []);

  const filtered = rules.filter((r) => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All Status' || (statusFilter === 'Clinical' && r.status === 'ACTIVE') || (statusFilter === 'Admin' && r.status === 'INACTIVE');
    return matchSearch && matchStatus;
  });

  const activeCount = filtered.filter((r) => r.status === 'ACTIVE').length;

  return (
    <div className="max-w-4xl mx-auto px-4 pb-24">
      <div className="pt-2 mb-4">
        <Link to="/doctor" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700" aria-label="Back to Dashboard">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </Link>
        <h1 className="text-xl font-bold text-gray-900 mt-2">Rule Management</h1>
      </div>

      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </span>
        <input
          type="text"
          placeholder="Search rules..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(['All Status', 'Clinical', 'Admin'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setStatusFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${statusFilter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            {f}
            {f === 'All Status' && <span className="ml-1 inline-block w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-current align-middle" />}
          </button>
        ))}
      </div>

      <Link to="/doctor/rules/new" className="block w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-center mb-6 flex items-center justify-center gap-2 hover:bg-blue-700">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        Create New Rule
      </Link>

      <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Active Rules ({activeCount})</h2>
      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading rules...</div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No rules found. Create one above.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((rule) => (
            <div key={rule.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-gray-900">{rule.title}</h3>
                <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${rule.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                  {rule.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
              <p className="text-xs text-gray-500 mb-3">Modified: {rule.modified}</p>
              <div className="flex items-center gap-2">
                <Link to={`/doctor/rules/${rule.id}`} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" aria-label="View">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </Link>
                <Link to={`/doctor/rules/${rule.id}/edit`} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" aria-label="Edit">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </Link>
                <button type="button" className="p-2 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-600" aria-label="Delete">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
