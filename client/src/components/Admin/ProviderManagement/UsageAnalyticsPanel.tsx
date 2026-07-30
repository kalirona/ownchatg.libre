import { useState } from 'react';
import { useGetProviderUsage, useGetProviderCosts, useGetProvidersList } from '~/data-provider';

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function UsageAnalyticsPanel() {
  const { data: providers } = useGetProvidersList();
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [days, setDays] = useState(30);
  const { data: usage } = useGetProviderUsage(selectedProvider || undefined, days);
  const { data: costs } = useGetProviderCosts(days);

  const maxRequests = Math.max(...(usage?.map(u => u.requests) || [0]), 1);
  const maxCost = Math.max(...(costs?.map(c => c.totalCost) || [0]), 1);

  return (
    <div className="p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Usage Analytics</h2>

      <div className="mb-4 flex items-center gap-3">
        <select value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)} className="rounded border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-900">
          <option value="">All Providers</option>
          {providers?.map(p => <option key={p._id} value={p._id}>{p.displayName || p.name}</option>)}
        </select>
        <select value={days} onChange={e => setDays(Number(e.target.value))} className="rounded border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-900">
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-sm font-medium">Daily Requests</h3>
          {usage?.slice(-14).map(u => (
            <div key={u.date} className="mb-2">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>{new Date(u.date).toLocaleDateString()}</span>
                <span>{u.requests.toLocaleString()} req</span>
              </div>
              <Bar value={u.requests} max={maxRequests} color="bg-blue-500" />
            </div>
          ))}
          {(!usage || usage.length === 0) && <p className="text-xs text-gray-500">No usage data yet.</p>}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-sm font-medium">Cost by Provider</h3>
          {costs?.map(c => {
            const pName = providers?.find(p => p._id === c._id)?.displayName || c._id.slice(-8);
            return (
              <div key={c._id} className="mb-2">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>{pName}</span>
                  <span>${c.totalCost.toFixed(4)}</span>
                </div>
                <Bar value={c.totalCost} max={maxCost} color="bg-green-500" />
              </div>
            );
          })}
          {(!costs || costs.length === 0) && <p className="text-xs text-gray-500">No cost data yet.</p>}
        </div>
      </div>
    </div>
  );
}
