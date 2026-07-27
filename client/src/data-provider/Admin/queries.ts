import { useRecoilValue } from 'recoil';
import { QueryKeys, dataService } from 'librechat-data-provider';
import { useQuery } from '@tanstack/react-query';
import type { QueryObserverResult, UseQueryOptions } from '@tanstack/react-query';
import type t from 'librechat-data-provider';
import store from '~/store';

export const useGetAdminDashboardStats = (
  config?: UseQueryOptions<t.TAdminDashboardStats>,
): QueryObserverResult<t.TAdminDashboardStats> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TAdminDashboardStats>(
    [QueryKeys.adminDashboardStats],
    () => dataService.getAdminDashboardStats(),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

export const useGetAdminUserDetail = (
  id: string,
  config?: UseQueryOptions<t.TAdminUserDetail>,
): QueryObserverResult<t.TAdminUserDetail> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TAdminUserDetail>(
    [QueryKeys.adminUserDetail, id],
    () => dataService.getAdminUserDetail(id),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled && !!id,
    },
  );
};

export const useGetAdminRevenue = (
  params?: { page?: number; limit?: number },
  config?: UseQueryOptions<t.TAdminRevenueResponse>,
): QueryObserverResult<t.TAdminRevenueResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TAdminRevenueResponse>(
    [QueryKeys.adminRevenue, params],
    () => dataService.getAdminRevenue(params),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

export const useGetAdminSubscriptions = (
  params?: { page?: number; limit?: number },
  config?: UseQueryOptions<t.TAdminSubscriptionsResponse>,
): QueryObserverResult<t.TAdminSubscriptionsResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TAdminSubscriptionsResponse>(
    [QueryKeys.adminSubscriptions, params],
    () => dataService.getAdminSubscriptions(params),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

export const useGetAdminProviders = (
  config?: UseQueryOptions<t.TAdminProvidersResponse>,
): QueryObserverResult<t.TAdminProvidersResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TAdminProvidersResponse>(
    [QueryKeys.adminProviders],
    () => dataService.getAdminProviders(),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

export const useGetAdminModels = (
  config?: UseQueryOptions<{ models: Record<string, unknown> }>,
): QueryObserverResult<{ models: Record<string, unknown> }> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<{ models: Record<string, unknown> }>(
    [QueryKeys.adminModels],
    () => dataService.getAdminModels(),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

export const useGetAdminAnnouncements = (
  config?: UseQueryOptions<t.TAdminAnnouncementsResponse>,
): QueryObserverResult<t.TAdminAnnouncementsResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TAdminAnnouncementsResponse>(
    [QueryKeys.adminAnnouncements],
    () => dataService.getAdminAnnouncements(),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

export const useGetAdminHealth = (
  config?: UseQueryOptions<t.TAdminSystemHealth>,
): QueryObserverResult<t.TAdminSystemHealth> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TAdminSystemHealth>(
    [QueryKeys.adminHealth],
    () => dataService.getAdminHealth(),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

export const useGetAdminFeatureFlags = (
  config?: UseQueryOptions<t.TAdminFeatureFlags>,
): QueryObserverResult<t.TAdminFeatureFlags> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TAdminFeatureFlags>(
    [QueryKeys.adminFeatures],
    () => dataService.getAdminFeatureFlags(),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

export const useGetAdminLockedUsers = (
  config?: UseQueryOptions<{ users: Array<{ _id: string; name: string; email: string; loginLockedUntil: string; loginAttempts: number; lastFailedLoginAt: string }> }>,
): QueryObserverResult<{ users: Array<{ _id: string; name: string; email: string; loginLockedUntil: string; loginAttempts: number; lastFailedLoginAt: string }> }> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<{ users: Array<{ _id: string; name: string; email: string; loginLockedUntil: string; loginAttempts: number; lastFailedLoginAt: string }> }>(
    [QueryKeys.adminLockedUsers],
    () => dataService.getAdminLockedUsers(),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

export const useGetAdminAuditLog = (
  params?: { page?: number; limit?: number; category?: string },
  config?: UseQueryOptions<unknown>,
): QueryObserverResult<unknown> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<unknown>(
    [QueryKeys.adminAuditLog, params],
    () => dataService.getAdminAuditLog(params),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

export const useGetAdminAnalytics = (
  params?: t.TAnalyticsParams,
  config?: UseQueryOptions<t.TAnalyticsResponse>,
): QueryObserverResult<t.TAnalyticsResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TAnalyticsResponse>(
    [QueryKeys.adminAnalytics, params],
    () => dataService.getAdminAnalytics(params),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};
