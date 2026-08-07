import PageLayout from '~/components/PageLayout';
import KnowledgeSettingsPanel from '../../Admin/panels/KnowledgeSettingsPanel';

export default function AdminKnowledgePage() {
  return (
    <PageLayout title="Knowledge Settings">
      <KnowledgeSettingsPanel />
    </PageLayout>
  );
}
