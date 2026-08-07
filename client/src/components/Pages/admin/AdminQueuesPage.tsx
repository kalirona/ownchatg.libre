import { ListOrdered } from 'lucide-react';
import PageLayout from '~/components/PageLayout';
import { useGetAdminHealth } from '~/data-provider/Admin';

const QUEUES = [
  { name: 'Embedding Reindex', status: 'active', pendingCount: 12 },
  { name: 'Document Processing', status: 'active', pendingCount: 5 },
  { name: 'Email Notifications', status: 'idle', pendingCount: 0 },
  { name: 'OCR Pipeline', status: 'paused', pendingCount: 3 },
  { name: 'Vector Sync', status: 'active', pendingCount: 8 },
  { name: 'Credit Reconciliation', status: 'idle', pendingCount: 0 },
];

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    idle: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[status] ?? colorMap.idle}`}>
      {status}
    </span>
  );
}

export default function AdminQueuesPage() {
  const { data: health } = useGetAdminHealth();
  const systemHealthy = health?.status === 'healthy';

  return (
    <PageLayout title="Queues">
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg border border-border-light bg-surface-hover p-4">
          <ListOrdered className="h-5 w-5 text-text-secondary" />
          <span className="text-sm font-medium text-text-primary">
            Job Queues
          </span>
          <span className="ml-auto text-xs text-text-secondary">
            System: {systemHealthy ? 'Healthy' : 'Checking...'}
          </span>
        </div>

        <div className="rounded-lg border border-border-light bg-surface-hover">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border-light text-text-secondary">
                  <th className="px-4 py-2 font-medium">Queue Name</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium text-right">Pending</th>
                </tr>
              </thead>
              <tbody>
                {QUEUES.map((queue) => (
                  <tr key={queue.name} className="border-b border-border-light text-text-primary">
                    <td className="px-4 py-3">{queue.name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={queue.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-text-secondary">
                      {queue.pendingCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
