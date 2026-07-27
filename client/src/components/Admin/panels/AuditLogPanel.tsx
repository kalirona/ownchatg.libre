import { useState } from 'react';
import { useGetAdminAuditLog, useGetAdminFeatureFlags } from '~/data-provider/Admin';
import { useLocalize } from '~/hooks';

export default function AuditLogPanel() {
  const localize = useLocalize();
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const { data, isLoading } = useGetAdminAuditLog({ page, limit: 50, category: category || undefined });
  const { data: features } = useGetAdminFeatureFlags();

  const entries: Record<string, unknown>[] = Array.isArray(data)
    ? data
    : (data as { entries?: Record<string, unknown>[] })?.entries ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-500">{localize('com_admin_feature_flags')}</p>
          <div className="mt-2 space-y-1">
            {features?.features &&
              Object.entries(features.features).map(([key, enabled]) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                  <span className="text-gray-700 dark:text-gray-300">{key}</span>
                  <span className="text-gray-500">
                    {enabled ? localize('com_admin_enabled') : localize('com_admin_disabled')}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          <option value="">{localize('com_admin_all_categories')}</option>
          <option value="auth">auth</option>
          <option value="config">config</option>
          <option value="permission">permission</option>
          <option value="agent_run">agent_run</option>
          <option value="tool_call">tool_call</option>
          <option value="grant">grant</option>
        </select>
      </div>

      {isLoading && (
        <div className="flex h-20 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
        </div>
      )}

      {entries.length > 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <th className="px-3 py-2 font-medium">{localize('com_admin_date')}</th>
                  <th className="px-3 py-2 font-medium">{localize('com_admin_category')}</th>
                  <th className="px-3 py-2 font-medium">{localize('com_admin_action')}</th>
                  <th className="px-3 py-2 font-medium">{localize('com_admin_outcome')}</th>
                  <th className="px-3 py-2 font-medium">{localize('com_admin_severity')}</th>
                  <th className="px-3 py-2 font-medium">{localize('com_admin_actor')}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry: Record<string, unknown>, i: number) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                      {entry.createdAt
                        ? new Date(entry.createdAt as string).toLocaleString()
                        : '-'}
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {entry.category as string}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-gray-900 dark:text-gray-100">
                      {entry.action as string}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          entry.outcome === 'success'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : entry.outcome === 'failure'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}
                      >
                        {entry.outcome as string}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                      {entry.severity as string}
                    </td>
                    <td className="px-3 py-2 font-mono text-gray-600 dark:text-gray-300">
                      {(entry.actor as Record<string, string>)?.id?.slice(-8) ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        !isLoading && (
          <p className="text-center text-sm text-gray-500">{localize('com_admin_no_audit_logs')}</p>
        )
      )}
    </div>
  );
}
