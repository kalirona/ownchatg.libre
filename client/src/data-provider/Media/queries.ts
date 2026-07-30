import { useRecoilValue } from 'recoil';
import { QueryKeys, dataService } from 'librechat-data-provider';
import { useQuery } from '@tanstack/react-query';
import type { QueryObserverResult, UseQueryOptions } from '@tanstack/react-query';
import type media from 'librechat-data-provider';
import store from '~/store';

export const useGetMediaPresets = (
  config?: UseQueryOptions<media.MediaPreset[]>,
): QueryObserverResult<media.MediaPreset[]> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<media.MediaPreset[]>(
    [QueryKeys.mediaPresets],
    () => dataService.getMediaPresets(),
    { staleTime: 1000 * 60 * 60, ...config, enabled: queriesEnabled },
  );
};

export const useGetMediaCreditCosts = (
  config?: UseQueryOptions<Record<string, media.CreditCost>>,
): QueryObserverResult<Record<string, media.CreditCost>> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<Record<string, media.CreditCost>>(
    [QueryKeys.mediaCreditCosts],
    () => dataService.getMediaCreditCosts(),
    { staleTime: 1000 * 60 * 60, ...config, enabled: queriesEnabled },
  );
};

export const useGetMediaHistory = (
  params?: { page?: number; limit?: number; type?: string; favorite?: string; search?: string },
  config?: UseQueryOptions<media.MediaHistoryResponse>,
): QueryObserverResult<media.MediaHistoryResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<media.MediaHistoryResponse>(
    [QueryKeys.mediaHistory, params],
    () => dataService.getMediaHistory(params),
    { refetchOnMount: true, ...config, enabled: queriesEnabled },
  );
};

export const useGetAdminMediaModels = (
  type?: string,
  config?: UseQueryOptions<media.AdminMediaModel[]>,
): QueryObserverResult<media.AdminMediaModel[]> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<media.AdminMediaModel[]>(
    [QueryKeys.adminMediaModels, type],
    () => dataService.getAdminMediaModels(type),
    { ...config, enabled: queriesEnabled },
  );
};

export const useGetAdminMediaRoutingRules = (
  type?: string,
  config?: UseQueryOptions<media.MediaRoutingRule[]>,
): QueryObserverResult<media.MediaRoutingRule[]> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<media.MediaRoutingRule[]>(
    [QueryKeys.adminMediaRoutingRules, type],
    () => dataService.getAdminMediaRoutingRules(type),
    { ...config, enabled: queriesEnabled },
  );
};

export const useGetAdminMediaAnalytics = (
  config?: UseQueryOptions<media.MediaAnalytics>,
): QueryObserverResult<media.MediaAnalytics> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<media.MediaAnalytics>(
    [QueryKeys.adminMediaAnalytics],
    () => dataService.getAdminMediaAnalytics(),
    { ...config, enabled: queriesEnabled },
  );
};
