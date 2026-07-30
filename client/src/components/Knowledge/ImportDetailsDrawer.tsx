import { memo } from 'react';
import {
  X, FileText, Clock, CheckCircle2, AlertCircle, Loader2, Ban,
  RotateCcw, Database, Cpu, Download, Bug, Terminal, Hash,
  Calendar, User,
} from 'lucide-react';
import type { TImportJob } from 'librechat-data-provider';
import { useGetKnowledgeImportJob } from '~/data-provider';
import { useCancelKnowledgeImportJobMutation, useRetryKnowledgeImportJobMutation } from '~/data-provider';
import { useKnowledgeJobSSE } from '~/hooks/Knowledge/useKnowledgeJobSSE';
import { formatBytes, duration } from '~/utils/knowledge';

const STAGE_LABELS: Record<string, string> = {
  queued: 'Queued',
  processing: 'Processing',
  extracting: 'Extracting Content',
  ocr: 'Running OCR',
  chunking: 'Chunking Text',
  embedding: 'Generating Embeddings',
  saving: 'Saving to Database',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

const isActive = (s: string) => ['queued', 'processing', 'extracting', 'ocr', 'chunking', 'embedding', 'saving', 'retrying'].includes(s);

export default function ImportDetailsDrawer({
  jobId,
  onClose,
}: {
  jobId: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useGetKnowledgeImportJob(jobId);
  useKnowledgeJobSSE(jobId);
  const cancelMutation = useCancelKnowledgeImportJobMutation();
  const retryMutation = useRetryKnowledgeImportJobMutation();

  const job = data?.job;
  const active = job ? isActive(job.status) : false;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-96 flex-col border-l border-border-light bg-surface-primary shadow-xl">
      <div className="flex items-center justify-between border-b border-border-light px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-text-secondary" />
          <h3 className="text-sm font-semibold text-text-primary">Import Details</h3>
        </div>
        <button onClick={onClose} className="rounded p-1 text-text-secondary hover:bg-surface-hover">
          <X className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-text-secondary" />
        </div>
      ) : !job ? (
        <div className="flex flex-1 items-center justify-center text-sm text-text-secondary">Job not found</div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="border-b border-border-light p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-text-secondary" />
              <span className="text-sm font-medium text-text-primary">{job.originalFilename || 'Unknown file'}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                job.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
                job.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' :
                job.status === 'cancelled' ? 'bg-gray-100 text-gray-500 dark:bg-gray-800' :
                active ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' :
                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30'
              }`}>
                {active ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> :
                 job.status === 'completed' ? <CheckCircle2 className="h-2.5 w-2.5" /> :
                 job.status === 'failed' ? <AlertCircle className="h-2.5 w-2.5" /> :
                 job.status === 'cancelled' ? <Ban className="h-2.5 w-2.5" /> :
                 <Clock className="h-2.5 w-2.5" />}
                {STAGE_LABELS[job.status] || job.status}
              </span>
            </div>
          </div>

          {/* Progress */}
          {job.progress && job.progress.pct > 0 && (
            <div className="border-b border-border-light p-4">
              <div className="mb-1 flex items-center justify-between text-xs text-text-secondary">
                <span>{job.progress.message || 'Processing...'}</span>
                <span>{job.progress.pct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-tertiary">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    job.status === 'failed' ? 'bg-red-500' :
                    job.status === 'cancelled' ? 'bg-gray-400' :
                    'bg-blue-500'
                  }`}
                  style={{ width: `${job.progress.pct}%` }}
                />
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 p-4">
            {[
              { label: 'Source Type', value: job.sourceType, icon: FileText },
              { label: 'Collection', value: job.collection ? 'Linked' : 'None', icon: Hash },
              { label: 'File Size', value: job.fileSize ? formatBytes(job.fileSize) : '--', icon: Database },
              { label: 'Worker', value: job.workerId ? `${job.workerId.split('-')[0]}...` : '--', icon: Cpu },
              { label: 'Duration', value: duration(job.duration), icon: Clock },
              { label: 'Retries', value: String(job.retries || 0), icon: RotateCcw },
              { label: 'MIME Type', value: job.mimeType || '--', icon: FileText },
            ].map((m) => (
              <div key={m.label} className="rounded-lg border border-border-light bg-surface-secondary p-2.5">
                <div className="flex items-center gap-1 text-[10px] text-text-secondary">
                  <m.icon className="h-3 w-3" /> {m.label}
                </div>
                <p className="mt-0.5 text-xs font-medium text-text-primary">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Timestamps */}
          <div className="border-t border-border-light p-4">
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-text-secondary">Timeline</h4>
            <div className="space-y-2">
              {job.queueTimestamps?.queuedAt && (
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="h-3 w-3 text-yellow-500" />
                  <span className="text-text-secondary">Queued</span>
                  <span className="ml-auto text-text-secondary">{new Date(job.queueTimestamps.queuedAt).toLocaleTimeString()}</span>
                </div>
              )}
              {job.queueTimestamps?.processingStartedAt && (
                <div className="flex items-center gap-2 text-xs">
                  <Loader2 className="h-3 w-3 text-blue-500" />
                  <span className="text-text-secondary">Processing</span>
                  <span className="ml-auto text-text-secondary">{new Date(job.queueTimestamps.processingStartedAt).toLocaleTimeString()}</span>
                </div>
              )}
              {job.queueTimestamps?.completedAt && (
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span className="text-text-secondary">Completed</span>
                  <span className="ml-auto text-text-secondary">{new Date(job.queueTimestamps.completedAt).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Steps Timeline */}
          {job.steps && job.steps.length > 0 && (
            <div className="border-t border-border-light p-4">
              <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-text-secondary">Steps</h4>
              <div className="space-y-2">
                {job.steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="h-3 w-3 shrink-0 text-green-500" />
                    ) : step.status === 'failed' ? (
                      <AlertCircle className="h-3 w-3 shrink-0 text-red-500" />
                    ) : (
                      <Loader2 className="h-3 w-3 shrink-0 animate-spin text-blue-500" />
                    )}
                    <span className="text-text-primary">{STAGE_LABELS[step.name] || step.name}</span>
                    <span className="ml-auto text-text-secondary">{duration(step.duration)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result */}
          {job.result && (job.result.chunkCount || job.result.vectorCount || job.result.documentIds?.length) && (
            <div className="border-t border-border-light p-4">
              <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-text-secondary">Result</h4>
              <div className="grid grid-cols-3 gap-2">
                {job.result.chunkCount !== undefined && (
                  <div className="rounded-lg border border-border-light bg-surface-secondary p-2 text-center">
                    <p className="text-xs font-semibold text-text-primary">{job.result.chunkCount}</p>
                    <p className="text-[9px] text-text-secondary">Chunks</p>
                  </div>
                )}
                {job.result.vectorCount !== undefined && (
                  <div className="rounded-lg border border-border-light bg-surface-secondary p-2 text-center">
                    <p className="text-xs font-semibold text-text-primary">{job.result.vectorCount}</p>
                    <p className="text-[9px] text-text-secondary">Vectors</p>
                  </div>
                )}
                {job.result.documentIds && (
                  <div className="rounded-lg border border-border-light bg-surface-secondary p-2 text-center">
                    <p className="text-xs font-semibold text-text-primary">{job.result.documentIds.length}</p>
                    <p className="text-[9px] text-text-secondary">Docs</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Logs */}
          {job.logs && job.logs.length > 0 && (
            <div className="border-t border-border-light p-4">
              <h4 className="mb-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
                <Terminal className="h-3 w-3" /> Logs
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-1 rounded-lg bg-surface-tertiary p-2 font-mono text-[10px]">
                {job.logs.map((log, i) => (
                  <div key={i} className={`${
                    log.level === 'error' ? 'text-red-400' :
                    log.level === 'warn' ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    <span className="opacity-50">[{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}]</span>
                    {' '}{log.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {job.error && (
            <div className="border-t border-border-light p-4">
              <h4 className="mb-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-red-500">
                <Bug className="h-3 w-3" /> Error
              </h4>
              <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-400">
                <p className="font-medium">{job.error.message}</p>
                {job.error.stage && (
                  <p className="mt-1 text-[10px] opacity-70">Stage: {job.error.stage}</p>
                )}
                {job.error.stack && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-[10px] opacity-70 hover:opacity-100">Stack Trace</summary>
                    <pre className="mt-1 whitespace-pre-wrap font-mono text-[9px] opacity-60">{job.error.stack}</pre>
                  </details>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-border-light p-4">
            <div className="flex gap-2">
              {active && (
                <button
                  onClick={() => cancelMutation.mutate(job._id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
              )}
              {job.status === 'failed' && (
                <button
                  onClick={() => retryMutation.mutate(job._id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-green-200 px-3 py-2 text-xs font-medium text-green-600 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/20"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Retry
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
