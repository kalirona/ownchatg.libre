import { useRecoilValue } from 'recoil';
import { QueryKeys, dataService } from 'librechat-data-provider';
import { useQuery } from '@tanstack/react-query';
import type { QueryObserverResult, UseQueryOptions } from '@tanstack/react-query';
import type t from 'librechat-data-provider';
import store from '~/store';

export const useGetBillingPlans = (
  config?: UseQueryOptions<t.TSubscriptionPlan[]>,
): QueryObserverResult<t.TSubscriptionPlan[]> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TSubscriptionPlan[]>(
    [QueryKeys.billingPlans],
    () => dataService.getBillingPlans(),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

export const useGetBillingCreditPacks = (
  config?: UseQueryOptions<t.TCreditPack[]>,
): QueryObserverResult<t.TCreditPack[]> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TCreditPack[]>(
    [QueryKeys.billingCreditPacks],
    () => dataService.getBillingCreditPacks(),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

export const useGetUserSubscription = (
  config?: UseQueryOptions<t.TUserSubscription | null>,
): QueryObserverResult<t.TUserSubscription | null> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TUserSubscription | null>(
    [QueryKeys.billingSubscription],
    () => dataService.getUserSubscription(),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: true,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

export const useGetPaymentTransactions = (
  config?: UseQueryOptions<t.TPaymentTransaction[]>,
): QueryObserverResult<t.TPaymentTransaction[]> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TPaymentTransaction[]>(
    [QueryKeys.billingTransactions],
    () => dataService.getPaymentTransactions(),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};
