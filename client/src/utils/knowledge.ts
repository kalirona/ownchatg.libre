import type { TImportJob, TImportJobStatus } from 'librechat-data-provider';

export function formatBytes(bytes: number): string {
  if (bytes < 1024) { return `${bytes} B`; }
  if (bytes < 1024 * 1024) { return `${(bytes / 1024).toFixed(1)} KB`; }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function timeAgo(dateStr?: string): string {
  if (!dateStr) { return ''; }
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) { return 'Just now'; }
  if (mins < 60) { return `${mins}m ago`; }
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) { return `${hrs}h ago`; }
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function elapsed(startedAt?: string | null): string | null {
  if (!startedAt) { return null; }
  const diff = Date.now() - new Date(startedAt).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) { return `${s}s`; }
  const m = Math.floor(s / 60);
  if (m < 60) { return `${m}m ${s % 60}s`; }
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function duration(ms: number | null | undefined): string {
  if (!ms) { return '--'; }
  const s = Math.floor(ms / 1000);
  if (s < 60) { return `${s}s`; }
  const m = Math.floor(s / 60);
  if (m < 60) { return `${m}m ${s % 60}s`; }
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function eta(startedAt?: string | null, pct?: number): string | null {
  if (!startedAt || !pct || pct <= 0) { return null; }
  const diff = Date.now() - new Date(startedAt).getTime();
  const remaining = pct > 0 ? (diff / pct) * (100 - pct) : 0;
  if (remaining < 1000) { return null; }
  const s = Math.floor(remaining / 1000);
  if (s < 60) { return `~${s}s left`; }
  const m = Math.floor(s / 60);
  if (m < 60) { return `~${m}m left`; }
  return `~${Math.floor(m / 60)}h left`;
}

const STATUS_CONFIG: Record<TImportJobStatus, { icon: string; color: string; bg: string; label: string }> = {
  queued: { icon: 'clock', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Queued' },
  processing: { icon: 'loader', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Processing' },
  extracting: { icon: 'loader', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Extracting' },
  ocr: { icon: 'loader', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', label: 'OCR' },
  chunking: { icon: 'loader', color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30', label: 'Chunking' },
  embedding: { icon: 'loader', color: 'text-teal-600', bg: 'bg-teal-100 dark:bg-teal-900/30', label: 'Embedding' },
  saving: { icon: 'loader', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Saving' },
  retrying: { icon: 'rotate', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30', label: 'Retrying' },
  completed: { icon: 'check', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Completed' },
  failed: { icon: 'alert', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Failed' },
  cancelled: { icon: 'ban', color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800', label: 'Cancelled' },
};

export function getStatusConfig(status: TImportJobStatus | undefined) {
  const key = status || 'queued';
  return STATUS_CONFIG[key] || STATUS_CONFIG.queued;
}

export { STATUS_CONFIG };