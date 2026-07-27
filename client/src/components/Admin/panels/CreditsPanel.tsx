import { useState } from 'react';
import { useAdjustAdminCreditsMutation } from '~/data-provider/Admin';
import { useLocalize } from '~/hooks';

export default function CreditsPanel() {
  const localize = useLocalize();
  const mutation = useAdjustAdminCreditsMutation();
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    const numAmount = parseInt(amount, 10);
    if (!userId || isNaN(numAmount) || numAmount === 0) {
      setResult({ success: false, message: localize('com_admin_invalid_input') });
      return;
    }
    mutation.mutate(
      { userId: userId.trim(), amount: numAmount, reason: reason || undefined },
      {
        onSuccess: () => {
          setResult({ success: true, message: localize('com_admin_credits_adjusted') });
          setAmount('');
          setReason('');
        },
        onError: () => {
          setResult({ success: false, message: localize('com_admin_error_loading') });
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          {localize('com_admin_adjust_credits')}
        </h3>
        <div className="space-y-3">
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder={localize('com_admin_user_id_placeholder')}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={localize('com_admin_credits_amount')}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={localize('com_admin_reason_optional')}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            disabled={mutation.isLoading}
          >
            {mutation.isLoading ? localize('com_admin_processing') : localize('com_admin_apply')}
          </button>
        </div>
      </form>

      {result && (
        <div className={`rounded-lg border p-3 text-sm ${
          result.success
            ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400'
            : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {result.message}
        </div>
      )}
    </div>
  );
}
