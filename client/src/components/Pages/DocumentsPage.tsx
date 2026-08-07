import PageLayout from '~/components/PageLayout';
import FileSidePanel from '~/components/Files/FileList/FileSidePanel';

export default function DocumentsPage() {
  return (
    <PageLayout title="Documents" description="Upload, manage, and use files in your conversations.">
      <FileSidePanel />
    </PageLayout>
  );
}
