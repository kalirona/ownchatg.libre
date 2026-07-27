import { useState, useEffect, useCallback } from 'react';
import { useLocalize } from '~/hooks';
import {
  useGetIntegrations,
  useGetIntegrationOAuthAuthorize,
  useIntegrationOAuthDisconnectMutation,
  useIntegrationOAuthRefreshMutation,
} from '~/data-provider/Integrations/queries';

const PROVIDERS = [
  { id: 'google_drive', name: 'Google Drive', icon: '🔗', color: '#4285F4' },
  { id: 'dropbox', name: 'Dropbox', icon: '🔗', color: '#0061FF' },
  { id: 'onedrive', name: 'OneDrive', icon: '🔗', color: '#0078D4' },
  { id: 'notion', name: 'Notion', icon: '📝', color: '#000000' },
  { id: 'slack', name: 'Slack', icon: '💬', color: '#4A154B' },
  { id: 'discord', name: 'Discord', icon: '🎮', color: '#5865F2' },
  { id: 'zapier', name: 'Zapier', icon: '⚡', color: '#FF4A00' },
  { id: 'n8n', name: 'n8n', icon: '🔄', color: '#EA4B71' },
  { id: 'wordpress', name: 'WordPress', icon: '🌐', color: '#21759B' },
  { id: 'github', name: 'GitHub', icon: '🐙', color: '#181717' },
];

const OAUTH_PROVIDERS = new Set([
  'google_drive', 'dropbox', 'onedrive', 'notion',
  'slack', 'discord', 'github',
]);

function IntegrationCard({ provider, integration, onConnect, onDisconnect, onRefresh, connecting, refreshing }: {
  provider: typeof PROVIDERS[0];
  integration?: { enabled: boolean; displayName?: string; config?: Record<string, unknown>; providerEmail?: string; tokenExpired?: boolean };
  onConnect: () => void;
  onDisconnect: () => void;
  onRefresh: () => void;
  connecting: boolean;
  refreshing: boolean;
}) {
  const localize = useLocalize();
  const isConnected = !!integration;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
            style={{ backgroundColor: `${provider.color}15` }}
          >
            {provider.icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{provider.name}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {isConnected
                ? (integration?.displayName || integration?.providerEmail || provider.name)
                : localize('com_integrations_not_connected')}
            </p>
            {isConnected && integration?.tokenExpired && (
              <p className="text-[10px] text-red-500 dark:text-red-400">
                {localize('com_integrations_token_expired')}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                integration?.enabled
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {integration?.enabled ? localize('com_integrations_enabled') : localize('com_integrations_disabled')}
              </span>
              {OAUTH_PROVIDERS.has(provider.id) && (
                <button
                  onClick={onRefresh}
                  disabled={refreshing}
                  className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 disabled:opacity-50"
                  title={localize('com_integrations_refresh_token')}
                >
                  {refreshing ? '...' : localize('com_integrations_refresh')}
                </button>
              )}
              <button
                onClick={onDisconnect}
                className="rounded px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                {localize('com_integrations_disconnect')}
              </button>
            </>
          )}
          {!isConnected && (
            <button
              onClick={onConnect}
              disabled={connecting}
              className="rounded px-2.5 py-1 text-xs font-medium text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 disabled:opacity-50"
            >
              {connecting ? '...' : localize('com_integrations_connect')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function IntegrationSettings() {
  const localize = useLocalize();
  const { data, isLoading } = useGetIntegrations();
  const oauthAuthorize = useGetIntegrationOAuthAuthorize();
  const disconnectMutation = useIntegrationOAuthDisconnectMutation();
  const refreshMutation = useIntegrationOAuthRefreshMutation();

  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOAuthMessage = useCallback((event: MessageEvent) => {
    if (event.data?.type !== 'oauth_callback') { return; }
    if (event.data.success) {
      setError(null);
      setConnectingProvider(null);
    } else {
      setError(`${localize('com_integrations_oauth_error')}${event.data.error || ''}`);
      setConnectingProvider(null);
    }
  }, [localize]);

  useEffect(() => {
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [handleOAuthMessage]);

  const handleConnect = async (providerId: string) => {
    if (OAUTH_PROVIDERS.has(providerId)) {
      setConnectingProvider(providerId);
      setError(null);
      try {
        const { url } = await oauthAuthorize.mutateAsync(providerId);
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.innerWidth - width) / 2;
        const top = window.screenY + (window.innerHeight - height) / 2;
        window.open(
          url,
          `oauth-${providerId}`,
          `width=${width},height=${height},left=${left},top=${top},popup=1`,
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        setConnectingProvider(null);
      }
    } else {
      setError(localize('com_integrations_webhook_only'));
    }
  };

  const handleDisconnect = (providerId: string) => {
    if (confirm(localize('com_integrations_confirm_disconnect'))) {
      disconnectMutation.mutate(providerId);
    }
  };

  const handleRefresh = (providerId: string) => {
    refreshMutation.mutate(providerId);
  };

  const integrationsMap = new Map(
    data?.integrations?.map((i) => [i.provider, i]) ?? [],
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {localize('com_integrations_title')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {localize('com_integrations_description')}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {PROVIDERS.map((provider) => {
          const integration = integrationsMap.get(provider.id);
          const connecting = connectingProvider === provider.id;
          const refreshing = refreshMutation.isLoading;

          return (
            <IntegrationCard
              key={provider.id}
              provider={provider}
              integration={integration}
              onConnect={() => handleConnect(provider.id)}
              onDisconnect={() => handleDisconnect(provider.id)}
              onRefresh={() => handleRefresh(provider.id)}
              connecting={connecting}
              refreshing={refreshing}
            />
          );
        })}
      </div>
    </div>
  );
}
