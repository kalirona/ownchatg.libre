import { useState, useRef, useCallback, memo } from 'react';
import {
  Upload, FileText, Loader2, AlertCircle, CheckCircle2, Ban,
  Clock, X, ChevronDown, ChevronRight,
} from 'lucide-react';
import { useLocalize } from '~/hooks';

type UploadQueueItem = {
  id: string;
  file: File;
  status: 'validating' | 'queued' | 'uploading' | 'done' | 'error';
  progress: number;
  error?: string;
};

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_EXTS = ['pdf', 'docx', 'txt', 'md', 'csv', 'json'];

const SUPPORTED_TYPES = [
  { ext: 'PDF', color: 'text-red-500' },
  { ext: 'DOCX', color: 'text-blue-500' },
  { ext: 'TXT', color: 'text-gray-500' },
  { ext: 'MD', color: 'text-blue-400' },
  { ext: 'CSV', color: 'text-green-500' },
  { ext: 'JSON', color: 'text-yellow-500' },
];

const extIconColor = (ext: string) => {
  const map: Record<string, string> = {
    pdf: 'text-red-500', docx: 'text-blue-500', txt: 'text-gray-500',
    md: 'text-blue-400', csv: 'text-green-500', json: 'text-yellow-500',
  };
  return map[ext] || 'text-text-secondary';
};

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `Exceeds 100MB (${(file.size / (1024 * 1024)).toFixed(1)}MB)`;
  }
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTS.includes(ext)) {
    return `Unsupported type .${ext}`;
  }
  return null;
}

const QueueItem = memo(function QueueItem({
  item,
  onRemove,
}: {
  item: UploadQueueItem;
  onRemove: (id: string) => void;
}) {
  const ext = item.file.name.split('.').pop()?.toLowerCase() || '';

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border-light bg-surface-secondary px-3 py-2 text-xs">
      <FileText className={`h-4 w-4 shrink-0 ${extIconColor(ext)}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">{item.file.name}</p>
        <p className="text-[10px] text-text-secondary">
          {(item.file.size / 1024).toFixed(0)} KB · {item.status}
        </p>
      </div>
      <div className="shrink-0">
        {item.status === 'uploading' && (
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        )}
        {item.status === 'done' && (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        )}
        {item.status === 'error' && (
          <AlertCircle className="h-4 w-4 text-red-500" title={item.error} />
        )}
        {item.status === 'queued' && (
          <Clock className="h-4 w-4 text-yellow-500" />
        )}
        {(item.status === 'validating' || item.status === 'queued') && (
          <button
            onClick={() => onRemove(item.id)}
            className="ml-1 rounded p-0.5 text-text-secondary hover:bg-red-100 hover:text-red-500"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
});

export default function DocumentUploader({
  onUpload,
  isUploading,
  queue,
  onRemoveFromQueue,
  onProcessQueue,
}: {
  onUpload: (file: File) => void;
  isUploading: boolean;
  queue: UploadQueueItem[];
  onRemoveFromQueue: (id: string) => void;
  onProcessQueue: () => void;
}) {
  const localize = useLocalize();
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showQueue, setShowQueue] = useState(true);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    setError(null);
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(`${file.name}: ${validationError}`);
        continue;
      }
      onUpload(file);
    }
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    e.target.value = '';
  }, [addFiles]);

  const activeCount = queue.filter((q) => q.status === 'uploading' || q.status === 'queued').length;
  const doneCount = queue.filter((q) => q.status === 'done').length;
  const errorCount = queue.filter((q) => q.status === 'error').length;

  return (
    <div>
      <div
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : error
              ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
              : 'border-border-light bg-surface-tertiary hover:border-blue-400'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { inputRef.current?.click(); } }}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt,.md,.csv,.json"
          multiple
          onChange={handleChange}
        />

        {error ? (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        ) : (
          <>
            <Upload className="mb-2 h-7 w-7 text-text-secondary" />
            <p className="text-sm font-medium text-text-primary">Upload Documents</p>
            <p className="mt-0.5 text-xs text-text-secondary">
              Drop files or click to browse
            </p>
            <p className="mt-2 inline-flex items-center gap-1 rounded-lg bg-surface-primary px-3 py-1.5 text-xs text-text-secondary shadow-sm">
              Browse Files (Multi)
            </p>
          </>
        )}
      </div>

      {!error && (
        <div className="mt-2 flex items-center justify-center gap-3">
          {SUPPORTED_TYPES.map((t) => (
            <div key={t.ext} className="flex flex-col items-center gap-0.5">
              <FileText className={`h-3.5 w-3.5 ${t.color}`} />
              <span className={`text-[8px] font-medium ${t.color}`}>{t.ext}</span>
            </div>
          ))}
        </div>
      )}

      {queue.length > 0 && (
        <div className="mt-3 rounded-xl border border-border-light">
          <button
            onClick={() => setShowQueue(!showQueue)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-text-secondary hover:bg-surface-hover"
          >
            {showQueue ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            Queue ({queue.length})
            {activeCount > 0 && (
              <span className="ml-auto rounded bg-blue-100 px-1.5 py-0.5 text-[9px] text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {activeCount} active
              </span>
            )}
            {doneCount > 0 && (
              <span className="rounded bg-green-100 px-1.5 py-0.5 text-[9px] text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {doneCount} done
              </span>
            )}
            {errorCount > 0 && (
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {errorCount} errors
              </span>
            )}
          </button>
          {showQueue && (
            <div className="max-h-60 space-y-1 overflow-y-auto p-2">
              {queue.map((item) => (
                <QueueItem key={item.id} item={item} onRemove={onRemoveFromQueue} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export type { UploadQueueItem };
