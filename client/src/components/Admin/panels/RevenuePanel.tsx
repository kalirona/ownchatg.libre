import { useState } from 'react';
import { useGetAdminRevenue } from '~/data-provider/Admin';
import { useLocalize } from '~/hooks';

export default function RevenuePanel() {
  const localize = useLocalize();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetAdminRevenue({ page, limit: 25 });

  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="flex h-20 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
        </div>
      )}

      {data?.stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs text-gray-500">{localize('com_admin_total_revenue')}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              ${data.stats.totalRevenue.toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs text-gray-500">{localize('com_admin_credits_awarded')}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {data.stats.totalCreditsAwarded.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs text-gray-500">{localize('com_admin_completed_transactions')}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {data.stats.completedCount.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {data?.transactions && data.transactions.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <th className="px-3 py-2 font-medium">{localize('com_admin_date')}</th>
                  <th className="px-3 py-2 font-medium">{localize('com_admin_type')}</th>
                  <th className="px-3 py-2 font-medium">{localize('com_admin_amount')}</th>
                  <th className="px-3 py-2 font-medium">{localize('com_admin_credits')}</th>
                  <th className="px-3 py-2 font-medium">{localize('com_admin_status')}</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((tx) => (
                  <tr key={tx._id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{tx.type}</td>
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                      ${tx.amount?.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                      {tx.creditsAwarded?.toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        tx.status === 'completed'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : tx.status === 'refunded'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.pagination && data.pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-3 py-2 dark:border-gray-700">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                {localize('com_admin_prev')}
              </button>
              <span className="text-xs text-gray-500">
                {localize('com_admin_page')} {page} / {data.pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                disabled={page >= data.pagination.pages}
                className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                {localize('com_admin_next')}
              </button>
            </div>
          )}
        </div>
      )}

      {data?.transactions?.length === 0 && (
        <p className="text-center text-sm text-gray-500">{localize('com_admin_no_transactions')}</p>
      )}
    </div>
  );
}
