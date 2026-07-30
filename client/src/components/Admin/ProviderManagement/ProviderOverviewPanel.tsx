import { useGetProviderOverview } from '~/data-provider';
import { useLocalize } from '~/hooks';

export default function ProviderOverviewPanel() {
  const localize = useLocalize();
  const { data, isLoading } = useGetProviderOverview();

  if (isLoading) {
    return <div className="p-4 text-gray-500">{localize('com_loading')}</div>;
  }

  const stats = [
    { label: 'Total Providers', value: data?.totalProviders ?? 0, color: 'text-blue-600' },
    { label: 'Enabled', value: data?.enabledProviders ?? 0, color: 'text-green-600' },
    { label: 'Total API Keys', value: data?.totalKeys ?? 0, color: 'text-purple-600' },
    { label: 'Total Models', value: data?.totalModels ?? 0, color: 'text-orange-600' },
    { label: 'Healthy', value: data?.healthyProviders ?? 0, color: 'text-emerald-600' },
  ];

  return (
    <div className="p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
        AI Provider Infrastructure Overview
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {stat.label}
            </p>
            <p className={`mt-1 text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
