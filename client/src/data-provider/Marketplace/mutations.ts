import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MutationKeys, QueryKeys, dataService } from 'librechat-data-provider';
import type { UseMutationResult } from '@tanstack/react-query';
import type t from 'librechat-data-provider';

export const useToggleMarketplaceFavoriteMutation = (): UseMutationResult<
  t.TMarketplaceToggleFavoriteResponse,
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.toggleMarketplaceFavorite],
    (groupId: string) => dataService.toggleMarketplaceFavorite(groupId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.marketplacePrompts]);
        queryClient.invalidateQueries([QueryKeys.marketplaceFeatured]);
        queryClient.invalidateQueries([QueryKeys.marketplaceFavorites]);
      },
    },
  );
};
