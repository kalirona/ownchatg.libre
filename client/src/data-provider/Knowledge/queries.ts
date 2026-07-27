import { useRecoilValue } from 'recoil';
import { QueryKeys, dataService } from 'librechat-data-provider';
import { useQuery } from '@tanstack/react-query';
import type { QueryObserverResult, UseQueryOptions } from '@tanstack/react-query';
import type t from 'librechat-data-provider';
import store from '~/store';

export const useGetKnowledgeDocuments = (
  params?: { embedded?: string; search?: string; limit?: number; offset?: number },
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
