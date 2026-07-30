import { memo, useMemo, useState, useCallback } from 'react';
import {
  ChevronDown, ChevronRight, Clock, CheckCircle2, XCircle, AlertCircle,
  Loader2, FileText, Ban, RotateCcw, ExternalLink, ListTodo,
} from 'lucide-react';
import type { TImportJob, TImportJobStatus } from 'librechat-data-provider';
import { useGetKnowledgeImportJobs, useCancelKnowledgeImportJobMutation, useRetryKnowledgeImportJobMutation } from '~/data-provider';
import { useKnowledgeJobSSEBatch } from '~/hooks/Knowledge/useKnowledgeJobSSE';
import { formatBytes, elapsed, eta, getStatusConfig } from '~/utils/knowledge';

const FILE_ICONS: Record<string, any> = {
  pdf: FileText, docx: FileText, txt: FileText, md: FileText,
  csv: FileText, json: FileText,
};

const JobRow = memo(function JobRow({
  job,
  onViewDetails,
}: {
  job: TImportJob;
  onViewDetails: (id: string) => void;
}) {
  const status = job.status || 'queued';
  const config = getStatusConfig(status);
  const Icon = config.icon;
  const ext = job.originalFilename?.split('.').pop()?.toLowerCase() || '';
  const FileIcon = FILE_ICONS[ext] || FileText;
  const cancelMutation = useCancelKnowledgeImportJobMutation();
  const retryMutation = useRetryKnowledgeImportJobMutation();
  const [isLive, setIsLive] = useState(false);

  const cancelAllowed = ['queued', 'processing', 'extracting', 'ocr', 'chunking', 'embedding', 'saving', 'retrying'].includes(status);

  return (
    <div className="border-b border-border-light px-3 py-2.5 text-xs transition-colors hover:bg-surface-hover">
      <div className="flex items-center gap-2">
        <FileIcon className="h-4 w-4 shrink-0 text-text-secondary" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium text-text-primary">
              {job.originalFilename || 'Unknown file'}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${config.bg} ${config.color}`}>
              {status === 'processing' || status === 'extracting' || status === 'ocr' || status === 'chunking' || status === 'embedding' || status === 'saving' ? (
                <Icon className="h-2.5 w-2.5 animate-spin" />
              ) : (
                <Icon className="h-2.5 w-2.5" />
              )}
              {config.label}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-text-secondary">
            <span>{job.collection ? `Collection: ${job.collection}` : 'No collection'}</span>
            <span>· {elapsed(job.progress?.startedAt)}</span>
            {job.retries > 0 && <span>· Retry {job.retries}</span>}
            {job.workerId && <span>· Worker: {job.workerId.split('-')[0]}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {cancelAllowed && (
            <button
              onClick={() => cancelMutation.mutate(job._id)}
              title="Cancel"
             className="rounded p-1 text-text-secondary hover:bg-surface-destructive hover:text-destructive-foreground"
            >
              <XCircle className="h-3.5 w-3.5" />
            </button>
          )}
          {status === 'failed' && (
            <button
              onClick={() => retryMutation.mutate(job._id)}
              title="Retry"
              className="rounded p-1 text-text-secondary hover:bg-green-100 hover:text-green-600"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => onViewDetails(job._id)}
            title="View Details"
            className="rounded p-1 text-text-secondary hover:bg-surface-tertiary"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {job.progress?.pct !== undefined && job.progress.pct > 0 && job.progress.pct < 100 && (
        <div className="mt-1.5">
          <div className="flex items-center justify-between text-[9px] text-text-secondary">
            <span className="truncate">{job.progress.message || config.label}</span>
            <span>{job.progress.pct}% {eta(job.progress.startedAt, job.progress.pct)}</span>
          </div>
          <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-surface-tertiary">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                status === 'failed' ? 'bg-destructive' :
                status === 'cancelled' ? 'bg-surface-tertiary' :
                'bg-primary'
              }`}
              style={{ width: `${job.progress.pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
});

function getActiveJobIds(jobs: TImportJob[]): string[] {
  const active = ['queued', 'processing', 'extracting', 'ocr', 'chunking', 'embedding', 'saving', 'retrying'];
  return jobs.filter((j) => active.includes(j.status)).map((j) => j._id);
}

export default function ImportJobsPanel({
  onViewDetails,
  initiallyExpanded,
}: {
  onViewDetails: (jobId: string) => void;
  initiallyExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(initiallyExpanded ?? true);
  const [filter, setFilter] = useState<TImportJobStatus | 'all'>('all');

  const { data } = useGetKnowledgeImportJobs({ limit: 100 });
  const jobs = data?.jobs || [];

  useKnowledgeJobSSEBatch(getActiveJobIds(jobs));

  const grouped = useMemo(() => {
    const groups: Record<string, TImportJob[]> = {
      queued: [], running: [], completed: [], failed: [], cancelled: [],
    };
    const runningStatuses = ['processing', 'extracting', 'ocr', 'chunking', 'embedding', 'saving', 'retrying'];
    for (const job of jobs) {
      if (job.status === 'queued') groups.queued.push(job);
      else if (runningStatuses.includes(job.status)) groups.running.push(job);
      else if (job.status === 'completed') groups.completed.push(job);
      else if (job.status === 'failed') groups.failed.push(job);
      else if (job.status === 'cancelled') groups.cancelled.push(job);
    }
    return groups;
  }, [jobs]);

  const filtered = useMemo(() => {
    if (filter === 'all') return jobs;
    if (['queued', 'running'].includes(filter)) {
      const runningStatuses = ['processing', 'extracting', 'ocr', 'chunking', 'embedding', 'saving', 'retrying'];
      if (filter === 'queued') return jobs.filter((j) => j.status === 'queued');
      return jobs.filter((j) => runningStatuses.includes(j.status));
    }
    return jobs.filter((j) => j.status === filter);
  }, [jobs, filter]);

  const totalActive = grouped.queued.length + grouped.running.length;

  const FILTERS: { key: TImportJobStatus | 'all'; label: string; count: number; icon: any }[] = [
    { key: 'all', label: 'All', count: jobs.length, icon: ListTodo },
    { key: 'queued', label: 'Queued', count: grouped.queued.length, icon: Clock },
    { key: 'running', label: 'Running', count: grouped.running.length, icon: Loader2 },
    { key: 'completed', label: 'Done', count: grouped.completed.length, icon: CheckCircle2 },
    { key: 'failed', label: 'Failed', count: grouped.failed.length, icon: AlertCircle },
    { key: 'cancelled', label: 'Cancelled', count: grouped.cancelled.length, icon: Ban },
  ];

  return (
    <div className="rounded-xl border border-border-light bg-surface-primary">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-surface-hover"
      >
        {expanded ? <ChevronDown className="h-4 w-4 text-text-secondary" /> : <ChevronRight className="h-4 w-4 text-text-secondary" />}
        <span className="text-sm font-semibold text-text-primary">Import Jobs</span>
        {totalActive > 0 && (
          <span className="ml-auto rounded-full bg-surface-secondary px-2 py-0.5 text-[10px] font-medium text-text-primary">
            {totalActive} active
          </span>
        )}
      </button>

      {expanded && (
        <div>
          <div className="flex gap-1 border-b border-border-light px-2 py-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-surface-secondary text-text-primary'
                    : 'text-text-secondary hover:bg-surface-hover'
                }`}
              >
                <f.icon className="h-3 w-3" />
                {f.label}
                <span className="ml-0.5 opacity-60">{f.count}</span>
              </button>
            ))}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <ListTodo className="h-6 w-6 text-text-secondary" />
                <p className="text-xs text-text-secondary">No import jobs</p>
              </div>
            ) : (
              filtered.map((job) => (
                <JobRow key={job._id} job={job} onViewDetails={onViewDetails} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
