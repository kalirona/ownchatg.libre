import { useRecoilValue } from 'recoil';
import { QueryKeys, dataService } from 'librechat-data-provider';
import { useQuery } from '@tanstack/react-query';
import type { QueryObserverResult, UseQueryOptions } from '@tanstack/react-query';
import type t from 'librechat-data-provider';
import store from '~/store';

export const useGetVideoGenProviders = (
  config?: UseQueryOptions<t.TVideoGenProvider[]>,
): QueryObserverResult<t.TVideoGenProvider[]> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TVideoGenProvider[]>(
    [QueryKeys.videoGenProviders],
    () => dataService.getVideoGenProviders(),
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

export const useGetVideoGenHistory = (
  params?: { page?: number; limit?: number; status?: string; favorite?: string },
  config?: UseQueryOptions<t.TVideoGenHistoryResponse>,
): QueryObserverResult<t.TVideoGenHistoryResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TVideoGenHistoryResponse>(
    [QueryKeys.videoGenHistory, params],
    () => dataService.getVideoGenHistory(params),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: true,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

export const useGetVideoGenStatus = (
  id: string | null,
  config?: UseQueryOptions<t.TVideoGenStatusResponse>,
): QueryObserverResult<t.TVideoGenStatusResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TVideoGenStatusResponse>(
    [QueryKeys.videoGenStatus, id],
    () => dataService.getVideoGenStatus(id!),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      enabled: !!id && queriesEnabled,
      refetchInterval: (data) => {
        if (data?.status === 'completed' || data?.status === 'failed') {
          return false;
        }
        return 3000;
      },
      ...config,
    },
  );
};
