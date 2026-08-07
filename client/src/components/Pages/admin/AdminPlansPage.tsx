import PageLayout from '~/components/PageLayout';
import SubscriptionsPanel from '../../Admin/panels/SubscriptionsPanel';

export default function AdminPlansPage() {
  return (
    <PageLayout title="Plans">
      <SubscriptionsPanel />
    </PageLayout>
  );
}
