import { useState } from 'react';
import { useLocalize } from '~/hooks';
import {
  useGetAdminUserDetail,
  useUpdateAdminUserRoleMutation,
  useAdjustAdminCreditsMutation,
  useGetAdminLockedUsers,
  useAdminUnlockUserMutation,
} from '~/data-provider/Admin';

export default function UsersPanel() {
  const localize = useLocalize();
  const [searchId, setSearchId] = useState('');
  const [lookupId, setLookupId] = useState<string | null>(null);

  const { data, isLoading, isError } = useGetAdminUserDetail(lookupId ?? '', {
    enabled: !!lookupId,
  });
  const { data: lockedData, isLoading: lockedLoading } = useGetAdminLockedUsers();
  const roleMutation = useUpdateAdminUserRoleMutation();
  const creditsMutation = useAdjustAdminCreditsMutation();
  const unlockMutation = useAdminUnlockUserMutation();

  const [creditsAmount, setCreditsAmount] = useState('');
  const [creditsReason, setCreditsReason] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      setLookupId(searchId.trim());
    }
  };

  const handleRoleChange = (newRole: string) => {
    if (!lookupId) { return; }
    roleMutation.mutate({ id: lookupId, role: newRole });
  };

  const handleAdjustCredits = () => {
    if (!lookupId || !creditsAmount) { return; }
    const amount = parseInt(creditsAmount, 10);
    if (isNaN(amount) || amount === 0) { return; }
    creditsMutation.mutate({ userId: lookupId, amount, reason: creditsReason || undefined });
  };

  const handleUnlock = (userId: string) => {
    unlockMutation.mutate(userId);
  };

  return (
    <div className="space-y-6">
      {/* User Search */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          {localize('com_admin_search_user')}
        </h3>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder={localize('com_admin_user_id_placeholder')}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          <button
            type="submit"
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            {localize('com_admin_search')}
          </button>
        </form>

        {isLoading && (
          <div className="mt-4 flex h-20 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
          </div>
        )}

        {isError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {localize('com_admin_user_not_found')}
          </div>
        )}

        {data && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-gray-500">{localize('com_admin_user_id')}</span>
                <p className="font-mono text-gray-900 dark:text-gray-100">{data.user.id}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">{localize('com_admin_email')}</span>
                <p className="text-gray-900 dark:text-gray-100">{data.user.email}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">{localize('com_admin_name')}</span>
                <p className="text-gray-900 dark:text-gray-100">{data.user.name || '-'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">{localize('com_admin_role')}</span>
                <div className="flex items-center gap-2">
                  <select
                    value={data.user.role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="rounded border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500">{localize('com_admin_balance')}</span>
                <p className="text-gray-900 dark:text-gray-100">
                  {data.balance?.tokenCredits?.toLocaleString() ?? '0'}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500">{localize('com_admin_created')}</span>
                <p className="text-gray-900 dark:text-gray-100">
                  {data.user.createdAt ? new Date(data.user.createdAt).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                type="number"
                value={creditsAmount}
                onChange={(e) => setCreditsAmount(e.target.value)}
                placeholder={localize('com_admin_credits_amount')}
                className="w-32 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
              <input
                type="text"
                value={creditsReason}
                onChange={(e) => setCreditsReason(e.target.value)}
                placeholder={localize('com_admin_reason_optional')}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
              <button
                onClick={handleAdjustCredits}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                {localize('com_admin_apply')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Locked Accounts */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          {localize('com_admin_locked_accounts')}
        </h3>
        {lockedLoading && (
          <div className="flex h-12 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
          </div>
        )}
        {!lockedLoading && (!lockedData?.users || lockedData.users.length === 0) && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {localize('com_admin_no_locked_accounts')}
          </p>
        )}
        {lockedData?.users && lockedData.users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{localize('com_admin_name')}</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{localize('com_admin_email')}</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{localize('com_admin_attempts')}</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{localize('com_admin_locked_until')}</th>
                  <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">{localize('com_admin_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {lockedData.users.map((user) => (
                  <tr key={user._id} className="text-sm">
                    <td className="whitespace-nowrap px-3 py-2 text-gray-900 dark:text-gray-100">{user.name || '-'}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-gray-700 dark:text-gray-300">{user.email}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-gray-700 dark:text-gray-300">{user.loginAttempts}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-gray-500">
                      {new Date(user.loginLockedUntil).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      <button
                        onClick={() => handleUnlock(user._id)}
                        disabled={unlockMutation.isLoading}
                        className="rounded bg-yellow-500 px-2 py-1 text-xs font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
                      >
                        {localize('com_admin_unlock')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
