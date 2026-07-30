import { useState, useEffect, useCallback } from 'react';
import {
  Cpu, Activity, Database, Clock, AlertTriangle, CheckCircle2,
  Loader2, Ban, RefreshCw,
} from 'lucide-react';
import { useGetKnowledgeAdminQueueStatus } from '~/data-provider';

export default function QueueHealthPanel() {
  const { data, isLoading, refetch } = useGetKnowledgeAdminQueueStatus();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 500);
  }, [refetch]);

  const buildQueueCards = () => {
    if (!data?.queues) { return []; }
    return Object.entries(data.queues).map(([key, q]) => ({
      key,
      name: q.name,
      waiting: q.waiting || 0,
      active: q.active || 0,
      completed: q.completed || 0,
      failed: q.failed || 0,
      delayed: q.delayed || 0,
      paused: q.paused || false,
    }));
  };

  const queueCards = buildQueueCards();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Queue Health</h2>
          <p className="text-sm text-text-secondary">Monitor and manage background processing</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-lg border border-border-light px-3 py-2 text-xs text-text-secondary hover:bg-surface-hover disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Redis Status */}
      <div className={`rounded-xl border p-4 ${data?.available ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'}`}>
        <div className="flex items-center gap-3">
          {data?.available ? (
            <>
              <Wifi className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-400">Redis Connected</p>
                <p className="text-xs text-green-600 dark:text-green-500">All queue operations available</p>
              </div>
            </>
          ) : (
            <>
              <WifiOff className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">Redis Disconnected</p>
                <p className="text-xs text-red-600 dark:text-red-500">Background processing unavailable</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Queue Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {queueCards.map((q) => (
          <div key={q.key} className="rounded-xl border border-border-light bg-surface-primary p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">{q.name}</h3>
              {q.paused ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                  <Pause className="h-3 w-3" /> Paused
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <Activity className="h-3 w-3" /> Active
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Waiting', value: q.waiting, icon: Clock, color: 'text-yellow-500' },
                { label: 'Active', value: q.active, icon: Loader2, color: 'text-blue-500' },
                { label: 'Completed', value: q.completed, icon: CheckCircle2, color: 'text-green-500' },
                { label: 'Failed', value: q.failed, icon: AlertTriangle, color: 'text-red-500' },
                { label: 'Delayed', value: q.delayed, icon: Clock, color: 'text-orange-500' },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-border-light bg-surface-secondary p-2 text-center">
                  <s.icon className={`mx-auto mb-1 h-4 w-4 ${s.color}`} />
                  <p className="text-sm font-semibold text-text-primary">{s.value}</p>
                  <p className="text-[9px] text-text-secondary">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      </div>
    </div>
  );
}
