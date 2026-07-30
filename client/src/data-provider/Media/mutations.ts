import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MutationKeys, QueryKeys, dataService } from 'librechat-data-provider';
import type { UseMutationResult } from '@tanstack/react-query';
import type media from 'librechat-data-provider';

export const useGenerateMediaMutation = (type: string): UseMutationResult<
  { images?: media.MediaResultImage[]; videos?: media.MediaResultVideo[]; historyId: string; status: string },
  Error,
  media.ImageGenerationRequest | media.VideoGenerationRequest
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.generateViaMedia, type],
    (payload) => dataService.generateMedia(type, payload),
    { onSuccess: () => { queryClient.invalidateQueries([QueryKeys.mediaHistory]); } },
  );
};

export const useDeleteMediaHistoryMutation = (): UseMutationResult<
  { message: string },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.deleteImageGenHistory],
    (id: string) => dataService.deleteMediaHistoryEntry(id),
    { onSuccess: () => { queryClient.invalidateQueries([QueryKeys.mediaHistory]); } },
  );
};

export const useToggleMediaFavoriteMutation = (): UseMutationResult<
  { favorite: boolean },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.toggleImageGenFavorite],
    (id: string) => dataService.toggleMediaFavorite(id),
    { onSuccess: () => { queryClient.invalidateQueries([QueryKeys.mediaHistory]); } },
  );
};

export const useRetryMediaMutation = (): UseMutationResult<
  media.MediaHistoryEntry,
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.retryMedia],
    (id: string) => dataService.retryMediaGeneration(id),
    { onSuccess: () => { queryClient.invalidateQueries([QueryKeys.mediaHistory]); } },
  );
};

export const useCancelMediaMutation = (): UseMutationResult<
  { message: string },
  Error,
  string
> => {
  return useMutation(
    [MutationKeys.cancelMedia],
    (id: string) => dataService.cancelMediaGeneration(id),
  );
};

export const useUpscaleImageMutation = (): UseMutationResult<
  { filepath: string; fileId: string },
  Error,
  { historyId: string; imageId: string }
> => {
  return useMutation(
    [MutationKeys.upscaleImage],
    ({ historyId, imageId }) => dataService.upscaleImage(historyId, imageId),
  );
};

export const useRemoveBackgroundMutation = (): UseMutationResult<
  { filepath: string; fileId: string },
  Error,
  { historyId: string; imageId: string }
> => {
  return useMutation(
    [MutationKeys.removeBackground],
    ({ historyId, imageId }) => dataService.removeImageBackground(historyId, imageId),
  );
};

export const useCreateVariationsMutation = (): UseMutationResult<
  { images: media.MediaResultImage[] },
  Error,
  { historyId: string; imageId: string }
> => {
  return useMutation(
    [MutationKeys.createVariations],
    ({ historyId, imageId }) => dataService.createImageVariations(historyId, imageId),
  );
};

export const useCreateAdminMediaModelMutation = (): UseMutationResult<
  media.AdminMediaModel,
  Error,
  Partial<media.AdminMediaModel>
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.upsertMediaModel],
    (data) => dataService.createAdminMediaModel(data),
    { onSuccess: () => { queryClient.invalidateQueries([QueryKeys.adminMediaModels]); } },
  );
};

export const useUpdateAdminMediaModelMutation = (): UseMutationResult<
  media.AdminMediaModel,
  Error,
  { id: string; data: Partial<media.AdminMediaModel> }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.upsertMediaModel],
    ({ id, data }) => dataService.updateAdminMediaModel(id, data),
    { onSuccess: () => { queryClient.invalidateQueries([QueryKeys.adminMediaModels]); } },
  );
};

export const useDeleteAdminMediaModelMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.deleteMediaModel],
    (id) => dataService.deleteAdminMediaModel(id),
    { onSuccess: () => { queryClient.invalidateQueries([QueryKeys.adminMediaModels]); } },
  );
};

export const useCreateAdminMediaRoutingRuleMutation = (): UseMutationResult<
  media.MediaRoutingRule,
  Error,
  Partial<media.MediaRoutingRule>
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.upsertMediaRoutingRule],
    (data) => dataService.createAdminMediaRoutingRule(data),
    { onSuccess: () => { queryClient.invalidateQueries([QueryKeys.adminMediaRoutingRules]); } },
  );
};

export const useDeleteAdminMediaRoutingRuleMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.deleteMediaRoutingRule],
    (id) => dataService.deleteAdminMediaRoutingRule(id),
    { onSuccess: () => { queryClient.invalidateQueries([QueryKeys.adminMediaRoutingRules]); } },
  );
};
