import { useRecoilValue } from 'recoil';
import { QueryKeys, dataService } from 'librechat-data-provider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryObserverResult, UseMutationResult } from '@tanstack/react-query';
import type t from 'librechat-data-provider';
import store from '~/store';

export const useGetBrandingConfig = (): QueryObserverResult<t.TWhiteLabelConfig> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TWhiteLabelConfig>(
    [QueryKeys.branding],
    () => dataService.getBrandingConfig(),
    { enabled: queriesEnabled },
  );
};

export const useUpdateBrandingConfigMutation = (): UseMutationResult<
  { branding: t.TWhiteLabelConfig },
  Error,
  Partial<t.TWhiteLabelConfig>
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['updateBrandingConfig'],
    (data) => dataService.updateBrandingConfig(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.branding]);
      },
    },
  );
};

export const useResetBrandingConfigMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['resetBrandingConfig'],
    (organizationId: string) => dataService.resetBrandingConfig(organizationId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.branding]);
      },
    },
  );
};

export const useUploadBrandingImageMutation = (): UseMutationResult<
  t.TBrandingUploadResponse,
  Error,
  { type: string; file: File }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['uploadBrandingImage'],
    ({ type, file }) => dataService.uploadBrandingImage(type, file),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.branding]);
      },
    },
  );
};

export const useVerifyBrandingDomainMutation = (): UseMutationResult<
  t.TDomainVerificationResult,
  Error,
  string
> => {
  return useMutation(
    ['verifyBrandingDomain'],
    (domain: string) => dataService.verifyBrandingDomain(domain),
  );
};

export const useGetBrandingSSLStatus = (
  domain: string,
  enabled = false,
): QueryObserverResult<t.TSSLStatusResult> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TSSLStatusResult>(
    [QueryKeys.brandingSSLStatus, domain],
    () => dataService.getBrandingSSLStatus(domain),
    { enabled: enabled && queriesEnabled && !!domain },
  );
};

export const useGetBrandingStatus = (): QueryObserverResult<t.TAppStatus> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TAppStatus>(
    [QueryKeys.brandingStatus],
    () => dataService.getBrandingStatus(),
    { enabled: queriesEnabled },
  );
};

export const useGetBrandingApiDocs = (): QueryObserverResult<t.TApiDocs> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TApiDocs>(
    [QueryKeys.brandingDocs],
    () => dataService.getBrandingApiDocs(),
    { enabled: queriesEnabled },
  );
};
