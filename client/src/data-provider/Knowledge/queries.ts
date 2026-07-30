import { useRecoilValue } from 'recoil';
import { QueryKeys, dataService } from 'librechat-data-provider';
import { useQuery } from '@tanstack/react-query';
import type { QueryObserverResult, UseQueryOptions } from '@tanstack/react-query';
import type t from 'librechat-data-provider';
import store from '~/store';

export const useGetKnowledgeDocuments = (
  params?: { embedded?: string; search?: string; limit?: number; offset?: number; collectionId?: string },
  config?: UseQueryOptions<t.TKnowledgeDocumentListResponse>,
): QueryObserverResult<t.TKnowledgeDocumentListResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TKnowledgeDocumentListResponse>(
    [QueryKeys.knowledgeDocuments, params],
    () => dataService.getKnowledgeDocuments(params),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: true,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

export const useGetKnowledgeCollections = (
  config?: UseQueryOptions<t.TKnowledgeCollectionListResponse>,
): QueryObserverResult<t.TKnowledgeCollectionListResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TKnowledgeCollectionListResponse>(
    [QueryKeys.knowledgeCollections],
    () => dataService.getKnowledgeCollections(),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: true,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

export const useGetKnowledgeDocumentDetail = (
  id: string,
  config?: UseQueryOptions<{ document: t.TKnowledgeDocumentDetail }>,
): QueryObserverResult<{ document: t.TKnowledgeDocumentDetail }> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<{ document: t.TKnowledgeDocumentDetail }>(
    [QueryKeys.knowledgeDocumentDetail, id],
    () => dataService.getKnowledgeDocumentDetail(id),
    {
      enabled: !!id && queriesEnabled,
      ...config,
    },
  );
};

export const useGetKnowledgeCollectionAnalytics = (
  id: string,
  config?: UseQueryOptions<{ analytics: t.TKnowledgeCollectionAnalytics }>,
): QueryObserverResult<{ analytics: t.TKnowledgeCollectionAnalytics }> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<{ analytics: t.TKnowledgeCollectionAnalytics }>(
    [QueryKeys.knowledgeCollectionAnalytics, id],
    () => dataService.getKnowledgeCollectionAnalytics(id),
    {
      enabled: !!id && queriesEnabled,
      ...config,
    },
  );
};

export const useGetKnowledgeAdminSettings = (
  config?: UseQueryOptions<{ settings: t.TKnowledgeAdminSettings }>,
): QueryObserverResult<{ settings: t.TKnowledgeAdminSettings }> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<{ settings: t.TKnowledgeAdminSettings }>(
    [QueryKeys.knowledgeAdminSettings],
    () => dataService.getKnowledgeAdminSettings(),
    {
      refetchOnWindowFocus: false,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

export const useGetKnowledgeImportJobs = (
  params?: { status?: string; sourceType?: string; collectionId?: string; limit?: number; offset?: number },
  config?: UseQueryOptions<t.TImportJobListResponse>,
): QueryObserverResult<t.TImportJobListResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TImportJobListResponse>(
    [QueryKeys.knowledgeImportJobs, params],
    () => dataService.getKnowledgeImportJobs(params),
    {
      refetchOnWindowFocus: false,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

export const useGetKnowledgeImportJob = (
  id: string,
  config?: UseQueryOptions<t.TImportJobResponse>,
): QueryObserverResult<t.TImportJobResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TImportJobResponse>(
    [QueryKeys.knowledgeImportJob, id],
    () => dataService.getKnowledgeImportJob(id),
    {
      enabled: !!id && queriesEnabled,
      staleTime: 30000,
      ...config,
    },
  );
};

export const useGetKnowledgeAdminQueueStatus = (
  config?: UseQueryOptions<{
    available: boolean;
    queues?: Record<string, { name: string; waiting: number; active: number; completed: number; failed: number; delayed: number; paused: boolean }>;
    message?: string;
  }>,
): QueryObserverResult<{
  available: boolean;
  queues?: Record<string, { name: string; waiting: number; active: number; completed: number; failed: number; delayed: number; paused: boolean }>;
  message?: string;
}> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery(
    [QueryKeys.knowledgeImportJobs, 'queue-status'],
    () => dataService.getKnowledgeAdminQueueStatus(),
    {
      refetchOnWindowFocus: false,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};
