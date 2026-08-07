import PageLayout from '~/components/PageLayout';
import KnowledgeWorkspace from '~/components/Knowledge/KnowledgeWorkspace';

export default function CollectionsPage() {
  return (
    <PageLayout title="Collections" description="Manage your knowledge collections">
      <KnowledgeWorkspace />
    </PageLayout>
  );
}
