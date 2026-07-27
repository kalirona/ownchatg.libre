import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MutationKeys, QueryKeys, dataService } from 'librechat-data-provider';
import type { UseMutationResult } from '@tanstack/react-query';
import type t from 'librechat-data-provider';

export const useUploadKnowledgeDocumentMutation = (): UseMutationResult<
  { file: t.TKnowledgeDocument },
  Error,
  FormData
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.uploadKnowledgeDocument],
    (formData: FormData) => dataService.uploadKnowledgeDocument(formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.knowledgeDocuments]);
      },
    },
  );
};

export const useDeleteKnowledgeDocumentMutation = (): UseMutationResult<
  { message: string },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.deleteKnowledgeDocument],
    (id: string) => dataService.deleteKnowledgeDocument(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.knowledgeDocuments]);
      },
    },
  );
};

export const useCreateKnowledgeCollectionMutation = (): UseMutationResult<
  { collection: t.TKnowledgeCollection },
  Error,
  t.TKnowledgeCreateCollectionRequest
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.createKnowledgeCollection],
    (payload: t.TKnowledgeCreateCollectionRequest) => dataService.createKnowledgeCollection(payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.knowledgeCollections]);
      },
    },
  );
};

export const useUpdateKnowledgeCollectionMutation = (): UseMutationResult<
  { collection: t.TKnowledgeCollection },
  Error,
  { id: string; payload: t.TKnowledgeUpdateCollectionRequest }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.updateKnowledgeCollection],
    ({ id, payload }: { id: string; payload: t.TKnowledgeUpdateCollectionRequest }) =>
      dataService.updateKnowledgeCollection(id, payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.knowledgeCollections]);
      },
    },
  );
};

export const useDeleteKnowledgeCollectionMutation = (): UseMutationResult<
  { message: string },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.deleteKnowledgeCollection],
    (id: string) => dataService.deleteKnowledgeCollection(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.knowledgeCollections]);
      },
    },
  );
};

export const useAddFileToKnowledgeCollectionMutation = (): UseMutationResult<
  { collection: t.TKnowledgeCollection },
  Error,
  { id: string; fileId: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.addFileToKnowledgeCollection],
    ({ id, fileId }: { id: string; fileId: string }) =>
      dataService.addFileToKnowledgeCollection(id, fileId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.knowledgeCollections]);
      },
    },
  );
};

export const useRemoveFileFromKnowledgeCollectionMutation = (): UseMutationResult<
  { collection: t.TKnowledgeCollection },
  Error,
  { id: string; fileId: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.removeFileFromKnowledgeCollection],
    ({ id, fileId }: { id: string; fileId: string }) =>
      dataService.removeFileFromKnowledgeCollection(id, fileId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.knowledgeCollections]);
      },
    },
  );
};

export const useKnowledgeSearchMutation = (): UseMutationResult<
  t.TKnowledgeSearchResponse,
  Error,
  t.TKnowledgeSearchRequest
> => {
  return useMutation(
    [MutationKeys.knowledgeSearch],
    (payload: t.TKnowledgeSearchRequest) => dataService.knowledgeSearch(payload),
  );
};

export const useKnowledgeChatMutation = (): UseMutationResult<
  t.TKnowledgeChatResponse,
  Error,
  t.TKnowledgeChatRequest
> => {
  return useMutation(
    [MutationKeys.knowledgeChat],
    (payload: t.TKnowledgeChatRequest) => dataService.knowledgeChat(payload),
  );
};
