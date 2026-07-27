import { useGetAdminDashboardStats } from '~/data-provider/Admin';
import { useLocalize } from '~/hooks';

export default function OverviewPanel() {
  const localize = useLocalize();
  const { data, isLoading, isError } = useGetAdminDashboardStats();

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        {localize('com_admin_error_loading')}
      </div>
    );
  }

  const cards = [
    { label: localize('com_admin_total_users'), value: data.totalUsers.toLocaleString() },
    { label: localize('com_admin_active_subscriptions'), value: data.activeSubscriptions.toLocaleString() },
    { label: localize('com_admin_total_revenue'), value: `$${data.totalRevenue.toFixed(2)}` },
    { label: localize('com_admin_credits_awarded'), value: data.totalCreditsAwarded.toLocaleString() },
    { label: localize('com_admin_balance_outstanding'), value: data.totalBalanceOutstanding.toLocaleString() },
    { label: localize('com_admin_balance_accounts'), value: data.balanceAccountCount.toLocaleString() },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {card.label}
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
          </div>
        ))}
      </div>

      {data.recentTransactions && data.recentTransactions.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {localize('com_admin_recent_transactions')}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <th className="pb-2 pr-4 font-medium">{localize('com_admin_date')}</th>
                  <th className="pb-2 pr-4 font-medium">{localize('com_admin_user')}</th>
                  <th className="pb-2 pr-4 font-medium">{localize('com_admin_amount')}</th>
                  <th className="pb-2 font-medium">{localize('com_admin_status')}</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.map((tx, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">
                      {tx.user?.slice(-8)}
                    </td>
                    <td className="py-2 pr-4 font-medium text-gray-900 dark:text-gray-100">
                      ${tx.amount?.toFixed(2)}
                    </td>
                    <td className="py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        tx.status === 'completed'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
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
        </div>
      )}
    </div>
  );
}
