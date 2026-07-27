import { useGetAdminHealth } from '~/data-provider/Admin';
import { useLocalize } from '~/hooks';

export default function HealthPanel() {
  const localize = useLocalize();
  const { data, isLoading } = useGetAdminHealth();

  if (isLoading) {
    return (
      <div className="flex h-20 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-gray-500">{localize('com_admin_no_health_data')}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center gap-3">
          <div
            className={`h-4 w-4 rounded-full ${
              data.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {data.status === 'healthy'
              ? localize('com_admin_all_systems_healthy')
              : localize('com_admin_system_degraded')}
          </span>
        </div>

        <div className="space-y-3">
          {Object.entries(data.checks).map(([service, check]) => (
            <div
              key={service}
              className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{service}</p>
                {check.state && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{check.state}</p>
                )}
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  check.status === 'healthy'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                }`}
              >
                {check.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400">
        {localize('com_admin_last_checked')}: {new Date(data.timestamp).toLocaleString()}
      </p>
    </div>
  );
}
