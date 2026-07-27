import { useRecoilValue } from 'recoil';
import { QueryKeys, dataService } from 'librechat-data-provider';
import { useQuery } from '@tanstack/react-query';
import type { QueryObserverResult, UseQueryOptions } from '@tanstack/react-query';
import type t from 'librechat-data-provider';
import store from '~/store';

export const useGetImageGenProviders = (
  config?: UseQueryOptions<t.TImageGenProvider[]>,
): QueryObserverResult<t.TImageGenProvider[]> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TImageGenProvider[]>(
    [QueryKeys.imageGenProviders],
    () => dataService.getImageGenProviders(),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      staleTime: 1000 * 60 * 5,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

export const useGetImageGenHistory = (
  params?: { page?: number; limit?: number; favorite?: string },
  config?: UseQueryOptions<t.TImageGenHistoryResponse>,
): QueryObserverResult<t.TImageGenHistoryResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TImageGenHistoryResponse>(
    [QueryKeys.imageGenHistory, params],
    () => dataService.getImageGenHistory(params),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: true,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};
