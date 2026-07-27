import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MutationKeys, QueryKeys, dataService } from 'librechat-data-provider';
import type { UseMutationResult } from '@tanstack/react-query';
import type t from 'librechat-data-provider';

export const useGenerateVideoMutation = (): UseMutationResult<
  t.TVideoGenResponse,
  Error,
  t.TVideoGenRequest
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.generateVideo],
    (payload: t.TVideoGenRequest) => dataService.generateVideo(payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.videoGenHistory]);
      },
    },
  );
};

export const useDeleteVideoGenHistoryMutation = (): UseMutationResult<
  { message: string },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.deleteVideoGenHistory],
    (id: string) => dataService.deleteVideoGenHistoryEntry(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.videoGenHistory]);
      },
    },
  );
};

export const useToggleVideoGenFavoriteMutation = (): UseMutationResult<
  { favorite: boolean },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.toggleVideoGenFavorite],
    (id: string) => dataService.toggleVideoGenFavorite(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.videoGenHistory]);
      },
    },
  );
};
