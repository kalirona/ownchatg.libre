import { useGetAdminProviders } from '~/data-provider/Admin';
import { useLocalize } from '~/hooks';

export default function ProvidersPanel() {
  const localize = useLocalize();
  const { data, isLoading } = useGetAdminProviders();

  if (isLoading) {
    return (
      <div className="flex h-20 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (!data?.providers?.length) {
    return <p className="text-center text-sm text-gray-500">{localize('com_admin_no_providers')}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {data.providers.map((provider) => (
        <div
          key={provider.name}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {provider.name}
            </h3>
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                provider.enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          </div>
          <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
            <p>
              {localize('com_admin_status')}:{' '}
              {provider.enabled ? localize('com_admin_enabled') : localize('com_admin_disabled')}
            </p>
            <p>
              {localize('com_admin_available')}:{' '}
              {provider.available
                ? localize('com_admin_yes')
                : localize('com_admin_no')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
