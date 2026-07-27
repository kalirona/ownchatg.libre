import { useRecoilValue } from 'recoil';
import { QueryKeys, dataService } from 'librechat-data-provider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryObserverResult, UseQueryOptions, UseMutationResult } from '@tanstack/react-query';
import type t from 'librechat-data-provider';
import store from '~/store';

export const useGetOrganizations = (): QueryObserverResult<{ organizations: t.TOrganization[] }> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<{ organizations: t.TOrganization[] }>(
    [QueryKeys.orgsList],
    () => dataService.getOrganizations(),
    { enabled: queriesEnabled },
  );
};

export const useGetOrganization = (
  id: string,
  config?: UseQueryOptions<{ organization: t.TOrganization }>,
): QueryObserverResult<{ organization: t.TOrganization }> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<{ organization: t.TOrganization }>(
    [QueryKeys.orgDetail, id],
    () => dataService.getOrganization(id),
    {
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled && !!id,
    },
  );
};

export const useCreateOrganizationMutation = (): UseMutationResult<
  { organization: t.TOrganization },
  Error,
  { name: string; description?: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['createOrganization'],
    (data) => dataService.createOrganization(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.orgsList]);
      },
    },
  );
};

export const useUpdateOrganizationMutation = (): UseMutationResult<
  { organization: t.TOrganization },
  Error,
  { id: string; data: Partial<t.TOrganization> }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['updateOrganization'],
    ({ id, data }) => dataService.updateOrganization(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.orgsList]);
        queryClient.invalidateQueries([QueryKeys.orgDetail]);
      },
    },
  );
};

export const useDeleteOrganizationMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['deleteOrganization'],
    (id: string) => dataService.deleteOrganization(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.orgsList]);
      },
    },
  );
};

export const useGetOrgMembers = (
  id: string,
): QueryObserverResult<{ members: t.TOrgMember[] }> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<{ members: t.TOrgMember[] }>(
    [QueryKeys.orgMembers, id],
    () => dataService.getOrgMembers(id),
    { enabled: queriesEnabled && !!id },
  );
};

export const useUpdateOrgMemberRoleMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  { id: string; userId: string; role: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['updateOrgMemberRole'],
    ({ id, userId, role }) => dataService.updateOrgMemberRole(id, userId, role),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.orgMembers]);
      },
    },
  );
};

export const useRemoveOrgMemberMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  { id: string; userId: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['removeOrgMember'],
    ({ id, userId }) => dataService.removeOrgMember(id, userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.orgMembers]);
      },
    },
  );
};

export const useGetOrgInvites = (
  id: string,
): QueryObserverResult<{ invites: t.TOrgInvite[] }> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<{ invites: t.TOrgInvite[] }>(
    [QueryKeys.orgInvites, id],
    () => dataService.getOrgInvites(id),
    { enabled: queriesEnabled && !!id },
  );
};

export const useCreateOrgInviteMutation = (): UseMutationResult<
  { invite: t.TOrgInvite },
  Error,
  { id: string; email: string; role?: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['createOrgInvite'],
    ({ id, email, role }) => dataService.createOrgInvite(id, email, role),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.orgInvites]);
      },
    },
  );
};

export const useRevokeOrgInviteMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  { id: string; inviteId: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['revokeOrgInvite'],
    ({ id, inviteId }) => dataService.revokeOrgInvite(id, inviteId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.orgInvites]);
      },
    },
  );
};

export const useGetOrgTeams = (
  id: string,
): QueryObserverResult<{ teams: t.TTeam[] }> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<{ teams: t.TTeam[] }>(
    [QueryKeys.orgTeams, id],
    () => dataService.getOrgTeams(id),
    { enabled: queriesEnabled && !!id },
  );
};

export const useCreateOrgTeamMutation = (): UseMutationResult<
  { team: t.TTeam },
  Error,
  { id: string; name: string; description?: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['createOrgTeam'],
    ({ id, name, description }) => dataService.createOrgTeam(id, { name, description }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.orgTeams]);
      },
    },
  );
};

export const useDeleteOrgTeamMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  { id: string; teamId: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['deleteOrgTeam'],
    ({ id, teamId }) => dataService.deleteOrgTeam(id, teamId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.orgTeams]);
      },
    },
  );
};

export const useGetOrgTeamMembers = (
  id: string,
  teamId: string,
): QueryObserverResult<{ members: t.TTeamMember[] }> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<{ members: t.TTeamMember[] }>(
    [QueryKeys.orgTeamMembers, id, teamId],
    () => dataService.getOrgTeamMembers(id, teamId),
    { enabled: queriesEnabled && !!id && !!teamId },
  );
};

export const useAddOrgTeamMemberMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  { id: string; teamId: string; userId: string; role?: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['addOrgTeamMember'],
    ({ id, teamId, userId, role }) => dataService.addOrgTeamMember(id, teamId, userId, role),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.orgTeamMembers]);
      },
    },
  );
};

export const useRemoveOrgTeamMemberMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  { id: string; teamId: string; userId: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['removeOrgTeamMember'],
    ({ id, teamId, userId }) => dataService.removeOrgTeamMember(id, teamId, userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.orgTeamMembers]);
      },
    },
  );
};

/* Shared Folders */
export const useGetOrgFolders = (
  orgId: string,
  teamId?: string,
): QueryObserverResult<{ folders: t.TSharedFolder[] }> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<{ folders: t.TSharedFolder[] }>(
    [QueryKeys.sharedFolders, orgId, teamId],
    () => dataService.getOrgFolders(orgId, teamId),
    { enabled: queriesEnabled && !!orgId },
  );
};

export const useCreateOrgFolderMutation = (): UseMutationResult<
  { folder: t.TSharedFolder },
  Error,
  { orgId: string; name: string; teamId?: string; parentId?: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['createOrgFolder'],
    ({ orgId, name, teamId, parentId }) => dataService.createOrgFolder(orgId, { name, teamId, parentId }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.sharedFolders]);
      },
    },
  );
};

export const useDeleteOrgFolderMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  { orgId: string; folderId: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['deleteOrgFolder'],
    ({ orgId, folderId }) => dataService.deleteOrgFolder(orgId, folderId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.sharedFolders]);
      },
    },
  );
};

/* Team Prompts */
export const useGetTeamPrompts = (
  orgId: string,
  teamId?: string,
): QueryObserverResult<{ prompts: t.TTeamPrompt[] }> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<{ prompts: t.TTeamPrompt[] }>(
    [QueryKeys.teamPrompts, orgId, teamId],
    () => dataService.getTeamPrompts(orgId, teamId),
    { enabled: queriesEnabled && !!orgId },
  );
};

export const useShareTeamPromptMutation = (): UseMutationResult<
  { teamPrompt: t.TTeamPrompt },
  Error,
  { orgId: string; promptGroupId: string; teamId?: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['shareTeamPrompt'],
    ({ orgId, promptGroupId, teamId }) => dataService.shareTeamPrompt(orgId, promptGroupId, teamId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.teamPrompts]);
      },
    },
  );
};

export const useUnshareTeamPromptMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  { orgId: string; promptGroupId: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['unshareTeamPrompt'],
    ({ orgId, promptGroupId }) => dataService.unshareTeamPrompt(orgId, promptGroupId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.teamPrompts]);
      },
    },
  );
};

/* Team Agents */
export const useGetTeamAgents = (
  orgId: string,
  teamId?: string,
): QueryObserverResult<{ agents: t.TTeamAgent[] }> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<{ agents: t.TTeamAgent[] }>(
    [QueryKeys.teamAgents, orgId, teamId],
    () => dataService.getTeamAgents(orgId, teamId),
    { enabled: queriesEnabled && !!orgId },
  );
};

export const useShareTeamAgentMutation = (): UseMutationResult<
  { teamAgent: t.TTeamAgent },
  Error,
  { orgId: string; agentId: string; teamId?: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['shareTeamAgent'],
    ({ orgId, agentId, teamId }) => dataService.shareTeamAgent(orgId, agentId, teamId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.teamAgents]);
      },
    },
  );
};

export const useUnshareTeamAgentMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  { orgId: string; agentId: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['unshareTeamAgent'],
    ({ orgId, agentId }) => dataService.unshareTeamAgent(orgId, agentId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.teamAgents]);
      },
    },
  );
};

/* Org Billing */
export const useGetOrgSubscription = (
  orgId: string,
): QueryObserverResult<{ subscription: t.TOrgSubscription | null }> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<{ subscription: t.TOrgSubscription | null }>(
    [QueryKeys.orgBillingSubscription, orgId],
    () => dataService.getOrgSubscription(orgId),
    { enabled: queriesEnabled && !!orgId },
  );
};

export const useGetOrgBalance = (
  orgId: string,
): QueryObserverResult<{ balance: t.TOrgBalance }> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<{ balance: t.TOrgBalance }>(
    [QueryKeys.orgBillingBalance, orgId],
    () => dataService.getOrgBalance(orgId),
    { enabled: queriesEnabled && !!orgId },
  );
};

export const useGetOrgCreditSummary = (
  orgId: string,
): QueryObserverResult<t.TOrgCreditSummary> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TOrgCreditSummary>(
    [QueryKeys.orgCreditSummary, orgId],
    () => dataService.getOrgCreditSummary(orgId),
    { enabled: queriesEnabled && !!orgId },
  );
};

export const useAllocateOrgCreditsMutation = (): UseMutationResult<
  { balance: t.TOrgBalance },
  Error,
  { orgId: string; credits: number; description?: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['allocateOrgCredits'],
    ({ orgId, credits, description }) => dataService.allocateOrgCredits(orgId, credits, description),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.orgBillingBalance]);
        queryClient.invalidateQueries([QueryKeys.orgCreditSummary]);
      },
    },
  );
};
