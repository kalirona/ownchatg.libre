import { useState } from 'react';
import { useGetProviderKeys, useCreateProviderKeyMutation, useTestProviderKeyMutation, useDeleteProviderKeyMutation } from '~/data-provider';

export default function ProviderKeysManager({ providerId }: { providerId: string }) {
  const { data: keys, refetch } = useGetProviderKeys(providerId);
  const createMutation = useCreateProviderKeyMutation();
  const testMutation = useTestProviderKeyMutation();
  const deleteMutation = useDeleteProviderKeyMutation();
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newKeyName || !newKeyValue) return;
    await createMutation.mutateAsync({ providerId, data: { name: newKeyName, value: newKeyValue } });
    setNewKeyName(''); setNewKeyValue(''); setShowAdd(false);
    refetch();
  };

  const handleTest = async (keyId: string) => {
    setTestingId(keyId);
    try {
      const result = await testMutation.mutateAsync(keyId);
      setTestResult(result.healthy ? 'Healthy' : `Failed: ${result.errorMessage || 'Unknown'}`);
    } catch { setTestResult('Test error'); }
    setTestingId(null);
  };

  const handleDelete = async (keyId: string) => {
    if (window.confirm('Delete this API key?')) {
      await deleteMutation.mutateAsync(keyId);
      refetch();
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">API Keys</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700">
          {showAdd ? 'Cancel' : 'Add Key'}
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
          <input placeholder="Key name (e.g. Production)" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} className="mb-2 w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-900" />
          <input placeholder="API Key value" type="password" value={newKeyValue} onChange={e => setNewKeyValue(e.target.value)} className="mb-2 w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-900" />
          <button onClick={handleCreate} className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700">Save Key</button>
        </div>
      )}

      {testResult && (
        <div className={`mb-3 rounded px-3 py-2 text-xs ${testResult.startsWith('Healthy') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {testResult}
          <button onClick={() => setTestResult(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Key</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Last Tested</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys?.map(k => (
              <tr key={k._id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="px-3 py-2">{k.name}</td>
                <td className="px-3 py-2 font-mono text-gray-500">{k.maskedKey}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${k.healthStatus === 'healthy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {k.healthStatus}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-500">{k.lastTested ? new Date(k.lastTested).toLocaleDateString() : 'Never'}</td>
                <td className="px-3 py-2">
                  <button onClick={() => handleTest(k._id)} disabled={testingId === k._id} className="mr-2 text-blue-600 hover:underline disabled:opacity-50">
                    {testingId === k._id ? 'Testing...' : 'Test'}
                  </button>
                  <button onClick={() => handleDelete(k._id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {(!keys || keys.length === 0) && (
              <tr><td colSpan={5} className="px-3 py-4 text-center text-gray-500">No API keys configured for this provider.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
