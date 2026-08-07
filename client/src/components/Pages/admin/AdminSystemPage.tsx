import PageLayout from '~/components/PageLayout';
import HealthPanel from '../../Admin/panels/HealthPanel';

export default function AdminSystemPage() {
  return (
    <PageLayout title="System">
      <HealthPanel />
    </PageLayout>
  );
}
