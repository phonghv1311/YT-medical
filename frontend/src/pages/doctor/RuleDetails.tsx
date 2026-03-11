import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const MOCK_RULE = {
  name: 'High BP Alert',
  lastUpdated: 'Oct 24, 2023',
  category: 'Cardiology',
  trigger: 'Vitals Update',
  status: 'ACTIVE' as const,
  conditions: [
    { field: 'systolic_bp', op: 'greater than', value: 140 },
    { field: 'diastolic_bp', op: 'greater than', value: 90 },
  ],
  action: 'Push notification to Cardiology Staff',
};

const DEFAULT_JSON = '{"patient_id":"123","systolic_bp":150,"diastolic_bp":95}';

export default function DoctorRuleDetails() {
  const { id } = useParams<{ id: string }>();
  const [inputJson, setInputJson] = useState(DEFAULT_JSON);
  const [testResult, setTestResult] = useState<{ success: boolean; matched?: string[] } | null>(null);

  function handleClear() {
    setInputJson('');
    setTestResult(null);
  }

  function handleRunTest() {
    try {
      const data = JSON.parse(inputJson || '{}');
      const systolic = data.systolic_bp ?? 0;
      const diastolic = data.diastolic_bp ?? 0;
      const success = systolic > 140 && diastolic > 90;
      setTestResult({
        success,
        matched: success ? [`Systolic BP (${systolic}) > 140 matched`, `Diastolic BP (${diastolic}) > 90 matched`] : undefined,
      });
    } catch {
      setTestResult({ success: false });
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24">
      <div className="pt-2 mb-4 flex items-center justify-between">
        <div>
          <Link to="/doctor/rules" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700" aria-label="Back to Rules">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-2">Rule Details</h1>
        </div>
        <Link to={`/doctor/rules/${id}/edit`} className="text-sm font-semibold text-blue-600 hover:underline">Edit</Link>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </span>
          <div>
            <h2 className="font-semibold text-gray-900">{MOCK_RULE.name}</h2>
            <p className="text-sm text-gray-500">Last updated: {MOCK_RULE.lastUpdated}</p>
          </div>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div><dt className="text-gray-500 font-medium">Category</dt><dd className="text-gray-900">{MOCK_RULE.category}</dd></div>
          <div><dt className="text-gray-500 font-medium">Trigger</dt><dd className="text-gray-900">{MOCK_RULE.trigger}</dd></div>
          <div><dt className="text-gray-500 font-medium">Status</dt><dd><span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">{MOCK_RULE.status}</span></dd></div>
        </dl>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Logic Configuration</h3>
        <div className="space-y-2 mb-4">
          {MOCK_RULE.conditions.map((c, i) => (
            <p key={i} className="text-sm text-gray-700">CONDITION {i + 1}: If <strong className="text-blue-600">{c.field}</strong> is {c.op} <strong className="text-blue-600">{c.value}</strong></p>
          ))}
          <p className="text-sm font-medium text-gray-500">AND</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-gray-500 uppercase">Then Action</span>
          <span className="flex items-center gap-1 text-gray-900">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            {MOCK_RULE.action}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900">Test Rule</h3>
          <button type="button" onClick={handleClear} className="text-sm font-medium text-gray-600 hover:underline">Clear</button>
        </div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Input Data (JSON)</label>
        <textarea value={inputJson} onChange={(e) => setInputJson(e.target.value)} className="w-full min-h-[120px] rounded-xl border border-gray-200 p-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 resize-y" placeholder='{"patient_id":"123","systolic_bp":150,"diastolic_bp":95}' />
        <button type="button" onClick={handleRunTest} className="mt-4 w-full py-3 rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-blue-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Run Test Case
        </button>
        {testResult && (
          <div className={`mt-4 rounded-xl p-4 ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2 font-semibold">{testResult.success ? 'Test Success: Rule Triggered' : 'Test failed'}</div>
            {testResult.matched && (
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {testResult.matched.map((m, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    {m}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
