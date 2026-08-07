import PageLayout from '~/components/PageLayout';
import AuditLogPanel from '../../Admin/panels/AuditLogPanel';

export default function AdminLogsPage() {
  return (
    <PageLayout title="Logs">
      <AuditLogPanel />
    </PageLayout>
  );
}
