import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocalize } from '~/hooks';
import {
  useGetOrganization,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
  useGetOrgMembers,
  useUpdateOrgMemberRoleMutation,
  useRemoveOrgMemberMutation,
  useGetOrgInvites,
  useCreateOrgInviteMutation,
  useRevokeOrgInviteMutation,
  useGetOrgTeams,
  useCreateOrgTeamMutation,
  useDeleteOrgTeamMutation,
} from '~/data-provider/Organizations/queries';

export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const localize = useLocalize();
  const { data: orgData } = useGetOrganization(id!);
  const { data: membersData } = useGetOrgMembers(id!);
  const { data: invitesData } = useGetOrgInvites(id!);
  const { data: teamsData } = useGetOrgTeams(id!);
  const deleteMutation = useDeleteOrganizationMutation();
  const updateRoleMutation = useUpdateOrgMemberRoleMutation();
  const removeMemberMutation = useRemoveOrgMemberMutation();
  const createInviteMutation = useCreateOrgInviteMutation();
  const revokeInviteMutation = useRevokeOrgInviteMutation();
  const createTeamMutation = useCreateOrgTeamMutation();
  const deleteTeamMutation = useDeleteOrgTeamMutation();
  const [inviteEmail, setInviteEmail] = useState('');
  const [teamName, setTeamName] = useState('');

  if (!orgData?.organization) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-gray-500">
        {localize('com_org_not_found')}
      </div>
    );
  }

  const org = orgData.organization;
  const isAdmin = org.role === 'owner' || org.role === 'admin';

  const handleDelete = () => {
    if (confirm(localize('com_org_delete_confirm'))) {
      deleteMutation.mutate(id!, { onSuccess: () => navigate('/organizations') });
    }
  };

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    createInviteMutation.mutate(
      { id: id!, email: inviteEmail.trim() },
      { onSuccess: () => setInviteEmail('') },
    );
  };

  const handleCreateTeam = () => {
    if (!teamName.trim()) return;
    createTeamMutation.mutate(
      { id: id!, name: teamName.trim() },
      { onSuccess: () => setTeamName('') },
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{org.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{org.description || org.slug}</p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium capitalize text-green-700 dark:bg-green-900/20 dark:text-green-400">
            {org.planTier}
          </span>
          {isAdmin && (
            <button
              onClick={handleDelete}
              className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400"
            >
              {localize('com_org_delete')}
            </button>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {localize('com_org_invite_title')}
          </h3>
          <div className="flex gap-2">
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder={localize('com_org_invite_placeholder')}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
            <button
              onClick={handleInvite}
              disabled={!inviteEmail.trim()}
              className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
            >
              {localize('com_org_invite_send')}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          {localize('com_org_members')} ({membersData?.members?.length || 0})
        </h3>
        <div className="space-y-2">
          {membersData?.members?.map((m) => (
            <div key={m._id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                  {(m.user?.name?.[0] || '?').toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{m.user?.name || 'Unknown'}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">{m.user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {m.role}
                </span>
                {isAdmin && m.role !== 'owner' && (
                  <button
                    onClick={() => removeMemberMutation.mutate({ id: id!, userId: m.user._id })}
                    className="text-xs text-red-500 hover:underline"
                  >
                    {localize('com_org_remove')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {invitesData?.invites?.length > 0 && isAdmin && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {localize('com_org_pending_invites')}
          </h3>
          <div className="space-y-2">
            {invitesData.invites.map((inv) => (
              <div key={inv._id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">{inv.email}</span>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                    {inv.status}
                  </span>
                  {inv.status === 'pending' && (
                    <button
                      onClick={() => revokeInviteMutation.mutate({ id: id!, inviteId: inv._id })}
                      className="text-xs text-red-500 hover:underline"
                    >
                      {localize('com_org_revoke')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {localize('com_org_teams')} ({teamsData?.teams?.length || 0})
          </h3>
          {isAdmin && (
            <div className="flex gap-2">
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder={localize('com_org_team_name_placeholder')}
                className="w-40 rounded-lg border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
              <button
                onClick={handleCreateTeam}
                disabled={!teamName.trim()}
                className="rounded-lg bg-green-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
              >
                {localize('com_org_create')}
              </button>
            </div>
          )}
        </div>
        <div className="space-y-2">
          {teamsData?.teams?.map((team) => (
            <div key={team._id} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900 dark:text-gray-100">{team.name}</p>
                {team.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{team.description}</p>
                )}
              </div>
              {isAdmin && (
                <button
                  onClick={() => deleteTeamMutation.mutate({ id: id!, teamId: team._id })}
                  className="text-xs text-red-500 hover:underline"
                >
                  {localize('com_org_delete')}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
