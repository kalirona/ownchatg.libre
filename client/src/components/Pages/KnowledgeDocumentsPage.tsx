import PageLayout from '~/components/PageLayout';
import KnowledgeWorkspace from '~/components/Knowledge/KnowledgeWorkspace';

export default function KnowledgeDocumentsPage() {
  return (
    <PageLayout title="Knowledge Documents" description="Browse and search your knowledge documents">
      <KnowledgeWorkspace />
    </PageLayout>
  );
}
