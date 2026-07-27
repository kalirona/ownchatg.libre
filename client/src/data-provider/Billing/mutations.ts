import { useMutation } from '@tanstack/react-query';
import { MutationKeys, dataService } from 'librechat-data-provider';
import type { UseMutationResult } from '@tanstack/react-query';
import type t from 'librechat-data-provider';

export const useCreateCheckout = (): UseMutationResult<
  t.TCreateCheckoutResponse,
  Error,
  t.TCreateCheckoutRequest
> => {
  return useMutation([MutationKeys.createBillingCheckout], (payload) =>
    dataService.createBillingCheckout(payload),
  );
};

export const useCreatePortal = (): UseMutationResult<
  t.TCreatePortalResponse,
  Error,
  void
> => {
  return useMutation([MutationKeys.createBillingPortal], () =>
    dataService.createBillingPortal(),
  );
};

export const useCancelSubscription = (): UseMutationResult<
  { message: string },
  Error,
  void
> => {
  return useMutation([MutationKeys.cancelBillingSubscription], () =>
    dataService.cancelBillingSubscription(),
  );
};
