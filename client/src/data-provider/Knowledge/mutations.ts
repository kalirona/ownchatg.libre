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
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.knowledgeChat],
    (payload: t.TKnowledgeChatRequest) => dataService.knowledgeChat(payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.knowledgeCollections]);
      },
    },
  );
};

export const useRenameKnowledgeDocumentMutation = (): UseMutationResult<
  { document: t.TKnowledgeDocument },
  Error,
  { id: string; name: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.renameKnowledgeDocument],
    ({ id, name }: { id: string; name: string }) => dataService.renameKnowledgeDocument(id, name),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.knowledgeDocuments]);
      },
    },
  );
};

export const useReindexKnowledgeDocumentMutation = (): UseMutationResult<
  { document: t.TKnowledgeDocument },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.reindexKnowledgeDocument],
    (id: string) => dataService.reindexKnowledgeDocument(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.knowledgeDocuments]);
      },
    },
  );
};

export const useMoveKnowledgeDocumentMutation = (): UseMutationResult<
  { document: t.TKnowledgeDocument },
  Error,
  { id: string; collectionId: string | null }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.moveKnowledgeDocument],
    ({ id, collectionId }: { id: string; collectionId: string | null }) =>
      dataService.moveKnowledgeDocument(id, collectionId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.knowledgeDocuments]);
        queryClient.invalidateQueries([QueryKeys.knowledgeCollections]);
      },
    },
  );
};

export const useQuickKnowledgeActionMutation = (): UseMutationResult<
  { answer: string; sources: t.TKnowledgeSource[] },
  Error,
  { fileIds: string[]; action: t.TKnowledgeQuickAction }
> => {
  return useMutation(
    [MutationKeys.quickKnowledgeAction],
    (payload: { fileIds: string[]; action: t.TKnowledgeQuickAction }) =>
      dataService.quickKnowledgeAction(payload),
  );
};

export const useUpdateKnowledgeAdminSettingsMutation = (): UseMutationResult<
  { settings: t.TKnowledgeAdminSettings },
  Error,
  Partial<t.TKnowledgeAdminSettings>
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.updateKnowledgeAdminSettings],
    (payload: Partial<t.TKnowledgeAdminSettings>) =>
      dataService.updateKnowledgeAdminSettings(payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.knowledgeAdminSettings]);
      },
    },
  );
};

export const useUploadKnowledgeDocumentAsyncMutation = (): UseMutationResult<
  t.TImportJobResponse,
  Error,
  FormData
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.uploadKnowledgeDocumentAsync],
    (formData: FormData) => dataService.uploadKnowledgeDocumentAsync(formData),
    {
      onSuccess: (data) => {
        if (data?.job?._id) {
          queryClient.invalidateQueries([QueryKeys.knowledgeImportJobs]);
          queryClient.setQueryData([QueryKeys.knowledgeImportJob, data.job._id], data);
        }
      },
    },
  );
};

export const useCancelKnowledgeImportJobMutation = (): UseMutationResult<
  t.TImportJobResponse,
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.cancelKnowledgeImportJob],
    (id: string) => dataService.cancelKnowledgeImportJob(id),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries([QueryKeys.knowledgeImportJobs]);
        if (data?.job?._id) {
          queryClient.setQueryData([QueryKeys.knowledgeImportJob, data.job._id], data);
        }
      },
    },
  );
};

export const useRetryKnowledgeImportJobMutation = (): UseMutationResult<
  t.TImportJobResponse,
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.retryKnowledgeImportJob],
    (id: string) => dataService.retryKnowledgeImportJob(id),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries([QueryKeys.knowledgeImportJobs]);
        if (data?.job?._id) {
          queryClient.setQueryData([QueryKeys.knowledgeImportJob, data.job._id], data);
        }
      },
    },
  );
};

export const useReindexKnowledgeCollectionAsyncMutation = (): UseMutationResult<
  t.TImportJobResponse,
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.reindexKnowledgeCollectionAsync],
    (id: string) => dataService.reindexKnowledgeCollectionAsync(id),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries([QueryKeys.knowledgeImportJobs]);
        if (data?.job?._id) {
          queryClient.setQueryData([QueryKeys.knowledgeImportJob, data.job._id], data);
        }
      },
    },
  );
};
