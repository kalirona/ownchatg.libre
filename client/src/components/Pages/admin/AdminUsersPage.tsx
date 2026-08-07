import PageLayout from '~/components/PageLayout';
import UsersPanel from '../../Admin/panels/UsersPanel';

export default function AdminUsersPage() {
  return (
    <PageLayout title="User Management">
      <UsersPanel />
    </PageLayout>
  );
}
