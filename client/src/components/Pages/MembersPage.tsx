import { useNavigate } from 'react-router-dom';
import { Building2, Users } from 'lucide-react';
import PageLayout from '~/components/PageLayout';
import { useLocalize } from '~/hooks';
import { useGetOrganizations } from '~/data-provider';

export default function MembersPage() {
  const localize = useLocalize();
  const navigate = useNavigate();
  const { data: orgsData } = useGetOrganizations();

  const orgs = orgsData?.organizations ?? [];

  return (
    <PageLayout title="Members" description="Manage team members across your organizations.">
      {orgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Building2 className="h-12 w-12 text-text-secondary" />
          <p className="text-base text-text-secondary">No organizations yet.</p>
          <p className="max-w-sm text-sm text-text-secondary">
            Create an organization to invite and manage team members.
          </p>
          <button
            onClick={() => navigate('/organizations')}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90"
          >
            Go to Organizations
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orgs.map((org) => {
            const orgId = '_id' in org ? (org as { _id: string })._id : (org as { name: string }).name;
            return (
              <button
                key={orgId}
                onClick={() => navigate(`/organizations/${orgId}`)}
                className="flex items-center gap-3 rounded-lg border border-border-light p-4 text-left transition-colors hover:bg-surface-hover"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-active-alt">
                  <Users className="h-5 w-5 text-text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{org.name}</p>
                  <p className="text-xs text-text-secondary">Click to view members</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
}
