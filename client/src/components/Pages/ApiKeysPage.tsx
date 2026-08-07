import { useState } from 'react';
import PageLayout from '~/components/PageLayout';
import List from '~/components/Nav/SettingsTabs/ApiKeys/List';
import CreateKeyDialog from '~/components/Nav/SettingsTabs/ApiKeys/CreateKeyDialog';
import { Button } from '@librechat/client';
import { Plus } from 'lucide-react';
import { useLocalize } from '~/hooks';

export default function ApiKeysPage() {
  const localize = useLocalize();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <PageLayout title="API Keys" description="Manage your API keys for external services.">
      <div className="mb-4 flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {localize('com_ui_create_api_key')}
        </Button>
      </div>
      <List onCreate={() => setCreateOpen(true)} />
      {createOpen && <CreateKeyDialog open={createOpen} onOpenChange={setCreateOpen} />}
    </PageLayout>
  );
}
