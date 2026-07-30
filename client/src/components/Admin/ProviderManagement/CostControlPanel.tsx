import { useState } from 'react';
import { useGetProviderCosts, useGetProvidersList } from '~/data-provider';

export default function CostControlPanel() {
  const [days] = useState(30);
  const { data: costs } = useGetProviderCosts(days);
  const { data: providers } = useGetProvidersList();

  const totalCost = costs?.reduce((s, c) => s + c.totalCost, 0) || 0;
  const totalTokens = costs?.reduce((s, c) => s + c.totalTokens, 0) || 0;

  return (
    <div className="p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Cost Control</h2>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Cost (30d)</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">${totalCost.toFixed(4)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Tokens (30d)</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{totalTokens.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Avg Cost / 1K Tokens</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
            ${totalTokens > 0 ? ((totalCost / totalTokens) * 1000).toFixed(6) : '0.000000'}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-sm font-medium">Cost by Provider</h3>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-3 py-2 font-medium">Provider</th>
              <th className="px-3 py-2 font-medium">Cost</th>
              <th className="px-3 py-2 font-medium">Requests</th>
              <th className="px-3 py-2 font-medium">% of Total</th>
            </tr>
          </thead>
          <tbody>
            {costs?.map(c => {
              const pName = providers?.find(p => p._id === c._id)?.displayName || c._id.slice(-8);
              const pct = totalCost > 0 ? ((c.totalCost / totalCost) * 100).toFixed(1) : '0';
              return (
                <tr key={c._id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="px-3 py-2">{pName}</td>
                  <td className="px-3 py-2">${c.totalCost.toFixed(4)}</td>
                  <td className="px-3 py-2">{c.totalRequests.toLocaleString()}</td>
                  <td className="px-3 py-2">{pct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
