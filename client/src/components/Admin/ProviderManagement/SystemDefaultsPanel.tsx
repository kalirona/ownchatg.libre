import { useState } from 'react';
import { useGetSystemDefaults, useGetProvidersList, useUpsertSystemDefaultMutation } from '~/data-provider';
import type { DefaultCategory } from 'librechat-data-provider';

export default function SystemDefaultsPanel() {
  const { data: defaults, refetch } = useGetSystemDefaults();
  const { data: providers } = useGetProvidersList();
  const upsertMutation = useUpsertSystemDefaultMutation();
  const [editCategory, setEditCategory] = useState<DefaultCategory | null>(null);
  const [form, setForm] = useState({ defaultProviderId: '', fallbackProviderId: '', config: '{}' });

  const categories: DefaultCategory[] = ['chat', 'image', 'video', 'audio', 'embedding', 'ocr', 'moderation'];

  const handleEdit = (d: typeof defaults extends (infer U)[] ? U : never) => {
    if (!d) return;
    setEditCategory(d.category as DefaultCategory);
    setForm({
      defaultProviderId: d.defaultProviderId || '',
      fallbackProviderId: d.fallbackProviderId || '',
      config: JSON.stringify(d.config || {}, null, 2),
    });
  };

  const handleSave = async () => {
    if (!editCategory) return;
    await upsertMutation.mutateAsync({
      category: editCategory,
      defaultProviderId: form.defaultProviderId || undefined,
      fallbackProviderId: form.fallbackProviderId || undefined,
      config: JSON.parse(form.config || '{}'),
    });
    setEditCategory(null);
    refetch();
  };

  return (
    <div className="p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">System Defaults</h2>
      <p className="mb-4 text-xs text-gray-500">Configure default and fallback providers for each AI category. These are used when no routing rule matches.</p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Default Provider</th>
              <th className="px-3 py-2 font-medium">Fallback Provider</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => {
              const def = defaults?.find(d => d.category === cat);
              const defaultPName = def?.defaultProviderId
                ? providers?.find(p => p._id === def.defaultProviderId)?.displayName || def.defaultProviderId.slice(-8)
                : '-';
              const fallbackPName = def?.fallbackProviderId
                ? providers?.find(p => p._id === def.fallbackProviderId)?.displayName || def.fallbackProviderId.slice(-8)
                : '-';
              return (
                <tr key={cat} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="px-3 py-2 font-medium capitalize">{cat}</td>
                  <td className="px-3 py-2">{defaultPName}</td>
                  <td className="px-3 py-2">{fallbackPName}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => handleEdit(def)} className="text-blue-600 hover:underline">Configure</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editCategory && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-sm font-medium">Configure {editCategory}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Default Provider</label>
              <select value={form.defaultProviderId} onChange={e => setForm({ ...form, defaultProviderId: e.target.value })} className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-900">
                <option value="">None</option>
                {providers?.filter(p => p.category === editCategory || p.category === 'text').map(p => (
                  <option key={p._id} value={p._id}>{p.displayName || p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Fallback Provider</label>
              <select value={form.fallbackProviderId} onChange={e => setForm({ ...form, fallbackProviderId: e.target.value })} className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-900">
                <option value="">None</option>
                {providers?.map(p => <option key={p._id} value={p._id}>{p.displayName || p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={handleSave} className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">Save</button>
            <button onClick={() => setEditCategory(null)} className="rounded bg-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
