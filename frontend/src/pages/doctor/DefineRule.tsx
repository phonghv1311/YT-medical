import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const DEFAULT_JSON = `{
  "condition": "AND",
  "rules": [
    {
      "field": "vitals.systolic",
      "operator": ">=",
      "value": 160
    },
    {
      "field": "vitals.diastolic",
      "operator": ">=",
      "value": 100
    }
  ]
}`;

const ACTION_OPTIONS = ['Notify Attending Doctor', 'Push notification to Cardiology Staff', 'Send SMS to Patient', 'Create Follow-up Task'];

export default function DoctorDefineRule() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useEffect(() => {
    if (id) {
      // TODO: load rule by id for edit mode
    }
  }, [id]);
  const [active, setActive] = useState(true);
  const [ruleName, setRuleName] = useState('Critical BP Warning');
  const [description, setDescription] = useState('Triggers a notification to the attending physician when systolic BP exceeds 160mmHg for two consecutive readings.');
  const [conditionJson, setConditionJson] = useState(DEFAULT_JSON);
  const [action, setAction] = useState(ACTION_OPTIONS[0]);
  const [, setJsonMode] = useState(true);
  const [saving, setSaving] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(conditionJson);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      navigate('/doctor/rules');
    }, 500);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24">
      <div className="pt-2 mb-4 flex items-center justify-between">
        <div>
          <Link to="/doctor/rules" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700" aria-label="Back to Rules">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-2">Define Rule</h1>
        </div>
        <button type="button" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" aria-label="Help">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">General Information</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Active</span>
              <button type="button" role="switch" aria-checked={active} onClick={() => setActive((a) => !a)} className={`relative w-11 h-6 rounded-full transition ${active ? 'bg-blue-600' : 'bg-gray-200'}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition left-1 ${active ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
            <input type="text" value={ruleName} onChange={(e) => setRuleName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Critical BP Warning" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-y" placeholder="Describe when this rule triggers and what it does." rows={4} />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Condition Builder</h2>
            <button type="button" onClick={() => setJsonMode((m) => !m)} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100">
              JSON Mode
            </button>
          </div>
          <div className="relative">
            <textarea value={conditionJson} onChange={(e) => setConditionJson(e.target.value)} className="w-full min-h-[200px] rounded-xl border border-gray-200 bg-gray-50 p-4 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y" spellCheck={false} />
            <button type="button" onClick={handleCopy} className="absolute top-2 right-2 p-2 rounded-lg hover:bg-gray-200 text-gray-600" aria-label="Copy">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Supports standard JSON schema for rule expressions.</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Action</h2>
          <label className="block text-sm font-medium text-gray-700 mb-1">Execute Action</label>
          <select value={action} onChange={(e) => setAction(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-4">
          <button type="button" onClick={() => navigate(-1)} className="flex-1 py-3 rounded-xl border border-blue-600 text-blue-600 font-semibold hover:bg-blue-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1-4l-4-4m0 0L8 8m4-4v12" /></svg>
            Save Rule
          </button>
        </div>
      </form>
    </div>
  );
}
