import { useState } from 'react';
import { useGetProvidersList } from '~/data-provider';
import { useLocalize } from '~/hooks';
import ProviderKeysManager from './ProviderKeysManager';

export default function ProviderKeysPanel() {
  const localize = useLocalize();
  const { data: providers } = useGetProvidersList();
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  return (
    <div className="p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
        API Key Management
      </h2>
      <div className="mb-4">
        <select
          value={selectedProvider}
          onChange={e => setSelectedProvider(e.target.value)}
          className="w-full max-w-xs rounded border border-gray-300 bg-white px-3 py-2 text-xs dark:border-gray-600 dark:bg-gray-900"
        >
          <option value="">Select a provider...</option>
          {providers?.map(p => (
            <option key={p._id} value={p._id}>{p.displayName || p.name}</option>
          ))}
        </select>
      </div>
      {selectedProvider ? (
        <ProviderKeysManager providerId={selectedProvider} />
      ) : (
        <p className="text-xs text-gray-500">Select a provider above to manage its API keys.</p>
      )}
    </div>
  );
}
