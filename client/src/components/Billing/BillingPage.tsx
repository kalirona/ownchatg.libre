import { useState } from 'react';
import {
  useGetBillingPlans,
  useGetBillingCreditPacks,
  useGetUserSubscription,
  useGetPaymentTransactions,
  useCreateCheckout,
  useCreatePortal,
  useCancelSubscription,
  useGetUserBalance,
} from '~/data-provider';
import { useAuthContext } from '~/hooks';
import { useLocalize } from '~/hooks';

export default function BillingPage() {
  const { isAuthenticated } = useAuthContext();
  const localize = useLocalize();

  const { data: plans } = useGetBillingPlans({ enabled: isAuthenticated });
  const { data: creditPacks } = useGetBillingCreditPacks({ enabled: isAuthenticated });
  const { data: subscription } = useGetUserSubscription({ enabled: isAuthenticated });
  const { data: balanceData } = useGetUserBalance({ enabled: isAuthenticated });
  const { data: transactions } = useGetPaymentTransactions({ enabled: isAuthenticated });
  const createCheckout = useCreateCheckout();
  const createPortal = useCreatePortal();
  const cancelSubscription = useCancelSubscription();
  const checkoutLoading = createCheckout.isLoading;

  const [selectedTab, setSelectedTab] = useState('plans');

  const handleSubscribe = (planId: string, provider: 'lemon_squeezy' | 'paypal') => {
    createCheckout.mutate({ planId, provider, successPath: '/billing/success' });
  };

  const handleBuyCredits = (creditPackId: string) => {
    createCheckout.mutate({
      creditPackId,
      provider: 'lemon_squeezy' as const,
      successPath: '/billing/success',
    });
  };

  const handleManageSubscription = () => {
    createPortal.mutate();
  };

  const handleCancelSubscription = () => {
    if (window.confirm(localize('com_billing_confirm_cancel'))) {
      cancelSubscription.mutate();
    }
  };

  const tabs = [
    { id: 'plans', label: localize('com_billing_plans') },
    { id: 'credits', label: localize('com_billing_credits') },
    { id: 'subscription', label: localize('com_billing_subscription') },
    { id: 'history', label: localize('com_billing_history') },
  ];

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold">{localize('com_billing_title')}</h1>

      {balanceData && (
        <div className="mb-6 rounded-lg border border-border-medium bg-surface-secondary p-4">
          <p className="text-lg">
            {localize('com_billing_current_balance')}: <strong>{balanceData.tokenCredits.toLocaleString()}</strong>
          </p>
        </div>
      )}

      <div className="mb-6 border-b border-border-medium">
        <nav className="flex space-x-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium ${
                selectedTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {selectedTab === 'plans' && (
        <div>
          {checkoutLoading && (
            <div className="mb-4 rounded bg-blue-50 p-3 text-blue-700">
              {localize('com_billing_redirecting')}
            </div>
          )}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans?.map((plan) => (
              <div
                key={plan._id}
                className="rounded-lg border border-border-medium bg-surface-primary p-6 shadow-sm"
              >
                <h3 className="mb-2 text-xl font-semibold">{plan.name}</h3>
                {plan.description && (
                  <p className="mb-4 text-sm text-text-secondary">{plan.description}</p>
                )}
                <p className="mb-4 text-3xl font-bold">${plan.price.toFixed(2)}</p>
                <p className="mb-4 text-sm text-text-secondary">
                  {plan.creditsPerPeriod.toLocaleString()} {localize('com_billing_credits_per')} {plan.interval}
                </p>
                <button
                  onClick={() =>
                    handleSubscribe(
                      plan._id,
                      plan.lemonSqueezyVariantId ? 'lemon_squeezy' : 'paypal',
                    )
                  }
                  disabled={checkoutLoading}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {localize('com_billing_subscribe')}
                </button>
              </div>
            ))}
            {(!plans || plans.length === 0) && (
              <p className="col-span-full text-center text-text-secondary">
                {localize('com_billing_no_plans')}
              </p>
            )}
          </div>
        </div>
      )}

      {selectedTab === 'credits' && (
        <div>
          {checkoutLoading && (
            <div className="mb-4 rounded bg-blue-50 p-3 text-blue-700">
              {localize('com_billing_redirecting')}
            </div>
          )}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {creditPacks?.map((pack) => (
              <div
                key={pack._id}
                className="rounded-lg border border-border-medium bg-surface-primary p-6 shadow-sm"
              >
                <h3 className="mb-2 text-xl font-semibold">{pack.name}</h3>
                {pack.description && (
                  <p className="mb-4 text-sm text-text-secondary">{pack.description}</p>
                )}
                <p className="mb-4 text-3xl font-bold">${pack.price.toFixed(2)}</p>
                <p className="mb-4 text-sm text-text-secondary">
                  {pack.credits.toLocaleString()} {localize('com_billing_credits')}
                </p>
                <button
                  onClick={() => handleBuyCredits(pack._id)}
                  disabled={checkoutLoading}
                  className="w-full rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {localize('com_billing_buy')}
                </button>
              </div>
            ))}
            {(!creditPacks || creditPacks.length === 0) && (
              <p className="col-span-full text-center text-text-secondary">
                {localize('com_billing_no_credit_packs')}
              </p>
            )}
          </div>
        </div>
      )}

      {selectedTab === 'subscription' && (
        <div className="rounded-lg border border-border-medium bg-surface-primary p-6 shadow-sm">
          {subscription ? (
            <div>
              <h3 className="mb-4 text-xl font-semibold">{localize('com_billing_current_subscription')}</h3>
              <div className="space-y-3">
                <p>
                  <span className="font-medium">{localize('com_billing_plan')}:</span> {subscription.planName}
                </p>
                <p>
                  <span className="font-medium">{localize('com_billing_status')}:</span>{' '}
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-sm ${
                      subscription.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : subscription.status === 'canceled'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {subscription.status}
                  </span>
                </p>
                {subscription.currentPeriodEnd && (
                  <p>
                    <span className="font-medium">{localize('com_billing_renews')}:</span>{' '}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
                <p>
                  <span className="font-medium">{localize('com_billing_provider')}:</span>{' '}
                  {subscription.provider === 'lemon_squeezy' ? 'Lemon Squeezy' : 'PayPal'}
                </p>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleManageSubscription}
                  disabled={createPortal.isLoading}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {localize('com_billing_manage')}
                </button>
                {subscription.status === 'active' && (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={cancelSubscription.isLoading}
                    className="rounded-lg border border-red-300 px-4 py-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {localize('com_billing_cancel')}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-text-secondary">{localize('com_billing_no_subscription')}</p>
              <button
                onClick={() => setSelectedTab('plans')}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                {localize('com_billing_view_plans')}
              </button>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'history' && (
        <div>
          {transactions && transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border-medium text-left text-sm text-text-secondary">
                    <th className="px-4 py-3">{localize('com_billing_date')}</th>
                    <th className="px-4 py-3">{localize('com_billing_type')}</th>
                    <th className="px-4 py-3">{localize('com_billing_amount')}</th>
                    <th className="px-4 py-3">{localize('com_billing_credits_earned')}</th>
                    <th className="px-4 py-3">{localize('com_billing_status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="border-b border-border-medium">
                      <td className="px-4 py-3">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 capitalize">{tx.type}</td>
                      <td className="px-4 py-3">
                        ${tx.amount.toFixed(2)} {tx.currency}
                      </td>
                      <td className="px-4 py-3">{tx.creditsAwarded.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs ${
                            tx.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : tx.status === 'refunded'
                                ? 'bg-yellow-100 text-yellow-800'
                                : tx.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-text-secondary">{localize('com_billing_no_transactions')}</p>
          )}
        </div>
      )}

      {createCheckout.data?.url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-surface-primary p-6 shadow-xl">
            <p className="mb-4">{localize('com_billing_redirecting')}</p>
            <a
              href={createCheckout.data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              {localize('com_billing_proceed')}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
