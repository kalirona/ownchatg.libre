import { useState } from 'react';
import { useGetRoutingRules, useGetProvidersList, useCreateRoutingRuleMutation, useDeleteRoutingRuleMutation } from '~/data-provider';
import type { TRoutingRule, ProviderCategory } from 'librechat-data-provider';
import { useLocalize } from '~/hooks';

export default function RoutingRulesPanel() {
  const localize = useLocalize();
  const { data: rules, refetch } = useGetRoutingRules();
  const { data: providers } = useGetProvidersList();
  const createMutation = useCreateRoutingRuleMutation();
  const deleteMutation = useDeleteRoutingRuleMutation();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', category: 'text' as ProviderCategory,
    priority: 100, targetProviderId: '', targetModelId: '', fallbackProviderId: '',
    conditions: JSON.stringify([{ type: 'model_category', operator: 'eq', value: 'text' }]),
    enabled: true,
  });

  const handleSubmit = async () => {
    await createMutation.mutateAsync({
      ...form,
      conditions: JSON.parse(form.conditions),
      targetModelId: form.targetModelId || undefined,
      fallbackProviderId: form.fallbackProviderId || undefined,
    });
    setShowForm(false);
    refetch();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this routing rule?')) {
      await deleteMutation.mutateAsync(id);
      refetch();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Smart Router - Routing Rules</h2>
        <button onClick={() => setShowForm(!showForm)} className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
          {showForm ? 'Cancel' : 'Add Rule'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-sm font-medium">New Routing Rule</h3>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Rule name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-900" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as ProviderCategory })} className="rounded border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-900">
              {['text','image','video','audio','embedding'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" placeholder="Priority" value={form.priority} onChange={e => setForm({ ...form, priority: Number(e.target.value) })} className="rounded border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-900" />
            <select value={form.targetProviderId} onChange={e => setForm({ ...form, targetProviderId: e.target.value })} className="rounded border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-900">
              <option value="">Target Provider...</option>
              {providers?.map(p => <option key={p._id} value={p._id}>{p.displayName || p.name}</option>)}
            </select>
            <input placeholder="Target Model ID (optional)" value={form.targetModelId} onChange={e => setForm({ ...form, targetModelId: e.target.value })} className="rounded border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-900" />
            <select value={form.fallbackProviderId} onChange={e => setForm({ ...form, fallbackProviderId: e.target.value })} className="rounded border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-900">
              <option value="">Fallback Provider...</option>
              {providers?.map(p => <option key={p._id} value={p._id}>{p.displayName || p.name}</option>)}
            </select>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} /> Enabled
            </label>
          </div>
          <textarea placeholder='[{ "type": "model_category", "operator": "eq", "value": "text" }]' value={form.conditions} onChange={e => setForm({ ...form, conditions: e.target.value })} rows={3} className="mt-3 w-full rounded border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-900" />
          <button onClick={handleSubmit} className="mt-3 rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">Create Rule</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Priority</th>
              <th className="px-3 py-2 font-medium">Target</th>
              <th className="px-3 py-2 font-medium">Fallback</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules?.map(r => (
              <tr key={r._id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2">{r.category}</td>
                <td className="px-3 py-2">{r.priority}</td>
                <td className="px-3 py-2 font-mono text-gray-600">{r.targetModelId || r.targetProviderId.slice(-6)}</td>
                <td className="px-3 py-2">{r.fallbackProviderId ? r.fallbackProviderId.slice(-6) : '-'}</td>
                <td className="px-3 py-2">{r.enabled ? <span className="text-green-600">Active</span> : <span className="text-red-500">Inactive</span>}</td>
                <td className="px-3 py-2">
                  <button onClick={() => handleDelete(r._id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {(!rules || rules.length === 0) && (
              <tr><td colSpan={7} className="px-3 py-4 text-center text-gray-500">No routing rules configured.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
