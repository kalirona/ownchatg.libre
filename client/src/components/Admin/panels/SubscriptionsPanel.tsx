import { useState } from 'react';
import { useGetAdminSubscriptions, useCancelAdminSubscriptionMutation } from '~/data-provider/Admin';
import { useLocalize } from '~/hooks';

export default function SubscriptionsPanel() {
  const localize = useLocalize();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetAdminSubscriptions({ page, limit: 25 });
  const cancelMutation = useCancelAdminSubscriptionMutation();

  const handleCancel = (id: string) => {
    if (confirm(localize('com_admin_confirm_cancel'))) {
      cancelMutation.mutate(id);
    }
  };

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
            <p className="text-xs text-gray-500">{localize('com_admin_total')}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {data.stats.total.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs text-gray-500">{localize('com_admin_active_subscriptions')}</p>
            <p className="text-lg font-bold text-green-600">{data.stats.active.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs text-gray-500">{localize('com_admin_canceled')}</p>
            <p className="text-lg font-bold text-red-500">{data.stats.canceled.toLocaleString()}</p>
          </div>
        </div>
      )}

      {data?.subscriptions && data.subscriptions.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <th className="px-3 py-2 font-medium">{localize('com_admin_user')}</th>
                  <th className="px-3 py-2 font-medium">{localize('com_admin_plan')}</th>
                  <th className="px-3 py-2 font-medium">{localize('com_admin_status')}</th>
                  <th className="px-3 py-2 font-medium">{localize('com_admin_period_end')}</th>
                  <th className="px-3 py-2 font-medium">{localize('com_admin_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data.subscriptions.map((sub) => (
                  <tr key={sub._id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2 font-mono text-gray-600 dark:text-gray-300">
                      {sub.user?.slice(-8)}
                    </td>
                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{sub.planName}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        sub.status === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                      {sub.currentPeriodEnd
                        ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-3 py-2">
                      {sub.status === 'active' && (
                        <button
                          onClick={() => handleCancel(sub._id)}
                          className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400"
                        >
                          {localize('com_admin_cancel')}
                        </button>
                      )}
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

      {data?.subscriptions?.length === 0 && (
        <p className="text-center text-sm text-gray-500">{localize('com_admin_no_subscriptions')}</p>
      )}
    </div>
  );
}
