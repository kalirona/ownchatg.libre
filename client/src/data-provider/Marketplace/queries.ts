import { useRecoilValue } from 'recoil';
import { QueryKeys, dataService } from 'librechat-data-provider';
import { useQuery } from '@tanstack/react-query';
import type { QueryObserverResult, UseQueryOptions } from '@tanstack/react-query';
import type t from 'librechat-data-provider';
import store from '~/store';

export const useGetMarketplacePrompts = (
  params?: { search?: string; category?: string; sort?: string; page?: number },
  config?: UseQueryOptions<t.TMarketplaceListResponse>,
): QueryObserverResult<t.TMarketplaceListResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TMarketplaceListResponse>(
    [QueryKeys.marketplacePrompts, params],
    () => dataService.getMarketplacePrompts(params),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: true,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

export const useGetMarketplaceFeatured = (
  config?: UseQueryOptions<t.TMarketplaceFeaturedResponse>,
): QueryObserverResult<t.TMarketplaceFeaturedResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TMarketplaceFeaturedResponse>(
    [QueryKeys.marketplaceFeatured],
    () => dataService.getMarketplaceFeatured(),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: true,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

export const useGetMarketplaceCategories = (
  config?: UseQueryOptions<t.TMarketplaceCategoriesResponse>,
): QueryObserverResult<t.TMarketplaceCategoriesResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TMarketplaceCategoriesResponse>(
    [QueryKeys.marketplaceCategories],
    () => dataService.getMarketplaceCategories(),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 1000 * 60 * 5,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

export const useGetMarketplaceFavorites = (
  params?: { page?: number },
  config?: UseQueryOptions<t.TMarketplaceListResponse>,
): QueryObserverResult<t.TMarketplaceListResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TMarketplaceListResponse>(
    [QueryKeys.marketplaceFavorites, params],
    () => dataService.getMarketplaceFavorites(params),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: true,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};
