import PageLayout from '~/components/PageLayout';
import CreditsPanel from '../../Admin/panels/CreditsPanel';

export default function AdminCreditsPage() {
  return (
    <PageLayout title="Credits">
      <CreditsPanel />
    </PageLayout>
  );
}
