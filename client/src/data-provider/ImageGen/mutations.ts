import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MutationKeys, QueryKeys, dataService } from 'librechat-data-provider';
import type { UseMutationResult } from '@tanstack/react-query';
import type t from 'librechat-data-provider';

export const useGenerateImagesMutation = (): UseMutationResult<
  t.TImageGenResponse,
  Error,
  t.TImageGenRequest
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.generateImages],
    (payload: t.TImageGenRequest) => dataService.generateImages(payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.imageGenHistory]);
      },
    },
  );
};

export const useDeleteImageGenHistoryMutation = (): UseMutationResult<
  { message: string },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.deleteImageGenHistory],
    (id: string) => dataService.deleteImageGenHistoryEntry(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.imageGenHistory]);
      },
    },
  );
};

export const useToggleImageGenFavoriteMutation = (): UseMutationResult<
  { favorite: boolean },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.toggleImageGenFavorite],
    (id: string) => dataService.toggleImageGenFavorite(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.imageGenHistory]);
      },
    },
  );
};
