import { useState } from 'react';
import { useGetProvidersList, useCreateProviderMutation, useUpdateProviderMutation, useDeleteProviderMutation } from '~/data-provider';
import type { TAIProvider, ProviderCategory } from 'librechat-data-provider';
import { useLocalize } from '~/hooks';

export default function ProvidersTablePanel({ category }: { category?: ProviderCategory }) {
  const localize = useLocalize();
  const { data: providers, isLoading, refetch } = useGetProvidersList(category);
  const createMutation = useCreateProviderMutation();
  const updateMutation = useUpdateProviderMutation();
  const deleteMutation = useDeleteProviderMutation();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', displayName: '', category: 'text' as ProviderCategory, priority: 100, enabled: true, config: '{}' });

  const resetForm = () => {
    setForm({ name: '', displayName: '', category: 'text' as ProviderCategory, priority: 100, enabled: true, config: '{}' });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    const data = { ...form, config: JSON.parse(form.config || '{}') };
    if (editId) {
      await updateMutation.mutateAsync({ id: editId, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    resetForm();
    refetch();
  };

  const handleEdit = (p: TAIProvider) => {
    setForm({
      name: p.name, displayName: p.displayName, category: p.category,
      priority: p.priority, enabled: p.enabled, config: JSON.stringify(p.config, null, 2),
    });
    setEditId(p._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this provider?')) {
      await deleteMutation.mutateAsync(id);
      refetch();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {category ? `${category.charAt(0).toUpperCase() + category.slice(1)} Providers` : 'All Providers'}
        </h2>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">
          {showForm ? 'Cancel' : 'Add Provider'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-sm font-medium">{editId ? 'Edit' : 'New'} Provider</h3>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Name (e.g. openai)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-900" />
            <input placeholder="Display Name (e.g. OpenAI)" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} className="rounded border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-900" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as ProviderCategory })} className="rounded border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-900">
              {['text','image','video','audio','embedding','ocr','moderation'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" placeholder="Priority" value={form.priority} onChange={e => setForm({ ...form, priority: Number(e.target.value) })} className="rounded border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-900" />
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} /> Enabled
            </label>
          </div>
          <textarea placeholder='{"testEndpoint":"..."}' value={form.config} onChange={e => setForm({ ...form, config: e.target.value })} rows={3} className="mt-3 w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-900" />
          <button onClick={handleSubmit} className="mt-3 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
            {editId ? 'Update' : 'Create'}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="text-xs text-gray-500">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Priority</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Health</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {providers?.map(p => (
                <tr key={p._id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="px-3 py-2">{p.displayName || p.name}</td>
                  <td className="px-3 py-2">{p.category}</td>
                  <td className="px-3 py-2">{p.priority}</td>
                  <td className="px-3 py-2">{p.enabled ? <span className="text-green-600">Enabled</span> : <span className="text-red-500">Disabled</span>}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.healthStatus === 'healthy' ? 'bg-green-100 text-green-700' :
                      p.healthStatus === 'degraded' ? 'bg-yellow-100 text-yellow-700' :
                      p.healthStatus === 'down' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                    }`}>{p.healthStatus}</span>
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => handleEdit(p)} className="mr-2 text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(p._id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
