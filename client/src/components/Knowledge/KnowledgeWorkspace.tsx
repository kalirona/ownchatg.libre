import { useState, useCallback, useMemo } from 'react';
import {
  Plus, FileText, Search, ChevronRight, BarChart3,
  HardDrive, MessagesSquare, HelpCircle, Loader2, X,
  CheckCircle2, AlertCircle, Ban, Upload, Database, Gauge, Clock,
} from 'lucide-react';
import type { TKnowledgeCollection } from 'librechat-data-provider';
import { useGetKnowledgeDocuments, useGetKnowledgeCollections, useGetKnowledgeImportJobs } from '~/data-provider';
import {
  useUploadKnowledgeDocumentAsyncMutation,
  useDeleteKnowledgeDocumentMutation,
  useDeleteKnowledgeCollectionMutation,
  useCreateKnowledgeCollectionMutation,
} from '~/data-provider';
import { useKnowledgeJobSSEBatch } from '~/hooks/Knowledge/useKnowledgeJobSSE';
import { formatBytes, timeAgo, getStatusConfig } from '~/utils/knowledge';
import DocumentUploader from './DocumentUploader';
import KnowledgeChat from './KnowledgeChat';
import DocumentDetailDrawer from './DocumentDetailDrawer';
import ImportJobsPanel from './ImportJobsPanel';
import ImportDetailsDrawer from './ImportDetailsDrawer';

const ICONS: Record<string, string> = {
  marketing: '📢', clients: '👥', business: '💼', personal: '👤', seo: '🔍',
  folder: '📁',
};

/* ---------- Collection Card ---------- */

/* ---------- Collection Card ---------- */
function CollectionCard({
  collection,
  isActive,
  onClick,
  onDelete,
  processingCount,
  failedCount,
}: {
  collection: TKnowledgeCollection;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  processingCount: number;
  failedCount: number;
}) {
  const embedPct = collection.documentCount > 0
    ? Math.round((collection.embeddedCount / collection.documentCount) * 100)
    : 0;
  const aiReady = collection.embeddedCount > 0;

  return (
    <div className="group mb-2">
      <button
        onClick={onClick}
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
          isActive
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            : 'text-text-secondary hover:bg-surface-hover'
        }`}
      >
        <span className="text-base">{ICONS[collection.icon] || ICONS.folder}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-medium text-text-primary">{collection.name}</p>
            {aiReady && (
              <span className="shrink-0 rounded-full bg-green-100 px-1.5 py-0.5 text-[8px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                AI Ready
              </span>
            )}
          </div>
          <p className="text-[10px] text-text-secondary">
            {collection.documentCount || 0} Docs
            {collection.lastActivityAt && ` · ${timeAgo(collection.lastActivityAt)}`}
            {processingCount > 0 && ` · ${processingCount} processing`}
            {failedCount > 0 && (
              <span className="text-red-500"> · {failedCount} failed</span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="rounded bg-surface-tertiary px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
            {collection.documentCount || 0}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="hidden rounded p-1 text-text-secondary opacity-60 hover:bg-red-100 hover:text-red-500 group-hover:block"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </button>

      {collection.documentCount > 0 && (
        <div className="mx-3 mb-1 mt-1">
          <div className="flex items-center justify-between text-[10px] text-text-secondary">
            <span>{collection.embeddedCount}/{collection.documentCount} embedded</span>
            <span>{formatBytes(collection.totalBytes || 0)}</span>
          </div>
          <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-surface-tertiary">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${embedPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Analytics Bar ---------- */
function AnalyticsBar({ jobs, totalDocs, totalBytes }: {
  jobs: any[];
  totalDocs: number;
  totalBytes: number;
}) {
  const today = new Date().toDateString();
  const todayUploads = jobs.filter((j) => {
    const d = j.queueTimestamps?.queuedAt;
    return d && new Date(d).toDateString() === today;
  }).length;
  const completedToday = jobs.filter((j) => {
    const d = j.queueTimestamps?.completedAt;
    return d && j.status === 'completed' && new Date(d).toDateString() === today;
  }).length;
  const activeJobs = jobs.filter((j) =>
    ['queued', 'processing', 'extracting', 'ocr', 'chunking', 'embedding', 'saving', 'retrying'].includes(j.status)
  ).length;
  const failedJobs = jobs.filter((j) => j.status === 'failed').length;
  const avgTime = (() => {
    const completed = jobs.filter((j) => j.status === 'completed' && j.duration);
    if (completed.length === 0) { return null; }
    const total = completed.reduce((sum, j) => sum + (j.duration || 0), 0);
    return Math.round(total / completed.length / 1000);
  })();

  const stats = [
    { label: "Today's Uploads", value: todayUploads, icon: Upload },
    { label: 'Completed Today', value: completedToday, icon: CheckCircle2 },
    { label: 'Active Jobs', value: activeJobs, icon: Gauge },
    { label: 'Total Docs', value: totalDocs, icon: Database },
    { label: 'Storage', value: formatBytes(totalBytes), icon: HardDrive },
    { label: 'Failed Jobs', value: failedJobs, icon: AlertCircle },
    { label: 'Avg Processing', value: avgTime ? `${avgTime}s` : '--', icon: Clock },
    { label: 'Queue Size', value: jobs.length, icon: BarChart3 },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
      {stats.map((s) => (
        <div key={s.label} className="rounded-lg border border-border-light bg-surface-primary p-2">
          <div className="flex items-center gap-1 text-[9px] text-text-secondary">
            <s.icon className="h-2.5 w-2.5" /> {s.label}
          </div>
          <p className="mt-0.5 text-sm font-semibold text-text-primary">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------- Main Workspace ---------- */
export default function KnowledgeWorkspace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [detailDocId, setDetailDocId] = useState<string | null>(null);
  const [importDetailJobId, setImportDetailJobId] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(true);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [showImportJobs, setShowImportJobs] = useState(true);

  const { data: docsData, refetch: refetchDocs } = useGetKnowledgeDocuments({
    search: searchQuery || undefined,
    collectionId: selectedCollectionId || undefined,
  });
  const { data: collectionsData, refetch: refetchCollections } = useGetKnowledgeCollections();

  const { data: jobsData } = useGetKnowledgeImportJobs({ limit: 100 });

  const asyncUploadMutation = useUploadKnowledgeDocumentAsyncMutation();
  const deleteDocMutation = useDeleteKnowledgeDocumentMutation();
  const deleteCollectionMutation = useDeleteKnowledgeCollectionMutation();
  const createCollectionMutation = useCreateKnowledgeCollectionMutation();

  const collections = collectionsData?.collections || [];
  const documents = docsData?.files || [];
  const importJobs = jobsData?.jobs || [];

  useKnowledgeJobSSEBatch(
    importJobs.filter((j) =>
      ['queued', 'processing', 'extracting', 'ocr', 'chunking', 'embedding', 'saving', 'retrying'].includes(j.status)
    ).map((j) => j._id)
  );

  const activeJobCount = importJobs.filter((j) =>
    ['queued', 'processing', 'extracting', 'ocr', 'chunking', 'embedding', 'saving', 'retrying'].includes(j.status)
  ).length;

  const allDocs = useMemo(() => {
    if (!selectedCollectionId) { return documents; }
    return documents;
  }, [documents, selectedCollectionId]);

  const totalBytes = useMemo(() =>
    collections.reduce((sum, c) => sum + (c.totalBytes || 0), 0),
    [collections],
  );
  const totalDocs = useMemo(() =>
    collections.reduce((sum, c) => sum + (c.documentCount || 0), 0),
    [collections],
  );

  const handleUpload = useCallback((file: File) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setUploadQueue((prev) => [...prev, { id, file, status: 'uploading', progress: 0 }]);

    const formData = new FormData();
    formData.append('file', file);
    const colId = selectedCollectionId;
    if (colId) { formData.append('collectionId', colId); }

    asyncUploadMutation.mutate(formData, {
      onSuccess: () => {
        setUploadQueue((prev) =>
          prev.map((q) => q.id === id ? { ...q, status: 'done' as const, progress: 100 } : q)
        );
        refetchDocs();
        refetchCollections();
      },
      onError: (err) => {
        setUploadQueue((prev) =>
          prev.map((q) => q.id === id ? { ...q, status: 'error' as const, error: err.message } : q)
        );
      },
    });
  }, [asyncUploadMutation, selectedCollectionId, refetchDocs, refetchCollections]);

  const handleRemoveFromQueue = useCallback((id: string) => {
    setUploadQueue((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const handleDeleteDoc = useCallback((fileId: string) => {
    deleteDocMutation.mutate(fileId, { onSuccess: () => refetchDocs() });
  }, [deleteDocMutation, refetchDocs]);

  const toggleFileSelection = useCallback((fileId: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId],
    );
  }, []);

  const selectAllInView = useCallback(() => {
    const docs = searchQuery ? searchableDocs : allDocs;
    if (docs.length === 0) { return; }
    const allIds = docs.map((d) => d.file_id);
    const allSelected = allIds.every((id) => selectedFileIds.includes(id));
    if (allSelected) {
      setSelectedFileIds((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      setSelectedFileIds((prev) => [...new Set([...prev, ...allIds])]);
    }
  }, [allDocs, searchableDocs, searchQuery, selectedFileIds]);

  const activeCollection = collections.find((c) => c._id === selectedCollectionId);

  const collectionProcessingCounts = useMemo(() => {
    const counts: Record<string, { processing: number; failed: number }> = {};
    for (const job of importJobs) {
      const colId = job.collection || '';
      if (!counts[colId]) { counts[colId] = { processing: 0, failed: 0 }; }
      if (['queued', 'processing', 'extracting', 'ocr', 'chunking', 'embedding', 'saving'].includes(job.status)) {
        counts[colId].processing++;
      } else if (job.status === 'failed') {
        counts[colId].failed++;
      }
    }
    return counts;
  }, [importJobs]);

  const searchableDocs = useMemo(() => {
    return allDocs.filter((d) => {
      if (d.embedded) { return true; }
      if (!d.embeddingStatus) { return true; }
      return !['queued', 'failed', 'cancelled'].includes(d.embeddingStatus);
    });
  }, [allDocs]);

  const displayDocs = searchQuery ? searchableDocs : allDocs;

  return (
    <div className="flex h-full">
      {/* Left Panel - Collections */}
      <div className="flex w-72 shrink-0 flex-col border-r border-border-light bg-surface-secondary">
        <div className="border-b border-border-light p-3">
          <h2 className="text-sm font-semibold text-text-primary">
            Knowledge Base
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <button
            onClick={() => setSelectedCollectionId(null)}
            className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              selectedCollectionId === null
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-text-secondary hover:bg-surface-hover'
            }`}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">All Documents</span>
            <span className="ml-auto text-xs text-text-secondary">{totalDocs}</span>
          </button>

          {collections.map((col) => {
            const cp = collectionProcessingCounts[col._id] || { processing: 0, failed: 0 };
            return (
              <CollectionCard
                key={col._id}
                collection={col}
                isActive={selectedCollectionId === col._id}
                onClick={() => setSelectedCollectionId(col._id)}
                onDelete={() => deleteCollectionMutation.mutate(col._id)}
                processingCount={cp.processing}
                failedCount={cp.failed}
              />
            );
          })}
        </div>

        {/* Storage Bar */}
        <div className="border-t border-border-light p-3">
          <div className="mb-2 flex items-center justify-between text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <HardDrive className="h-3 w-3" /> Storage
            </span>
            <span>{formatBytes(totalBytes)}</span>
          </div>
          {activeJobCount > 0 && (
            <div className="mb-2 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              {activeJobCount} job{activeJobCount > 1 ? 's' : ''} processing
            </div>
          )}
          <button
            onClick={() => {
              const name = prompt('Enter collection name:');
              if (name?.trim()) {
                createCollectionMutation.mutate({ name: name.trim() });
              }
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border-light px-3 py-2 text-xs text-text-secondary transition-colors hover:border-border-medium hover:text-text-primary"
          >
            <Plus className="h-3.5 w-3.5" /> New Collection
          </button>
        </div>
      </div>

      {/* Center Panel - Documents */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
          {/* Analytics Bar */}
          <AnalyticsBar jobs={importJobs} totalDocs={totalDocs} totalBytes={totalBytes} />

          {/* Collection Analytics */}
          {selectedCollectionId && activeCollection && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {[
                { label: 'Documents', value: activeCollection.documentCount || 0, icon: FileText },
                { label: 'Storage', value: formatBytes(activeCollection.totalBytes || 0), icon: HardDrive },
                { label: 'Chunks', value: activeCollection.chunkCount || 0, icon: BarChart3 },
                { label: 'Embedded', value: `${activeCollection.documentCount > 0 ? Math.round((activeCollection.embeddedCount / activeCollection.documentCount) * 100) : 0}%`, icon: BarChart3 },
                { label: 'AI Chats', value: activeCollection.aiChats || 0, icon: MessagesSquare },
                { label: 'Questions', value: activeCollection.questionsAsked || 0, icon: HelpCircle },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-border-light bg-surface-primary p-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-text-secondary">
                    <stat.icon className="h-3 w-3" /> {stat.label}
                  </div>
                  <p className="mt-0.5 text-lg font-semibold text-text-primary">{stat.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Upload Area */}
          <div className="rounded-xl border border-border-light bg-surface-primary">
            <div className="p-3">
              <DocumentUploader
                onUpload={handleUpload}
                isUploading={asyncUploadMutation.isLoading}
                queue={uploadQueue}
                onRemoveFromQueue={handleRemoveFromQueue}
                onProcessQueue={() => {}}
              />
            </div>
          </div>

          {/* Import Jobs Panel */}
          <ImportJobsPanel
            onViewDetails={(jobId) => setImportDetailJobId(jobId)}
            initiallyExpanded={activeJobCount > 0}
          />

          {/* Search + Document Table */}
          <div className="flex-1 rounded-xl border border-border-light bg-surface-primary">
            <div className="flex items-center gap-3 border-b border-border-light px-3 py-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full rounded-lg border border-border-light bg-surface-tertiary py-1.5 pl-8 pr-3 text-sm text-text-primary placeholder:text-text-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-ring-primary"
                />
              </div>
              {displayDocs.length > 0 && (
                <button
                  onClick={selectAllInView}
                  className="rounded px-2 py-1 text-xs text-text-secondary hover:bg-surface-hover"
                >
                  {displayDocs.every((d) => selectedFileIds.includes(d.file_id)) ? 'Deselect' : 'Select All'}
                </button>
              )}
            </div>

            <div className="max-h-[500px] overflow-y-auto">
              {displayDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <FileText className="h-8 w-8 text-text-secondary" />
                  <p className="text-sm text-text-secondary">No documents yet. Upload a file to get started.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border-light text-[10px] uppercase text-text-secondary">
                      <th className="w-8 px-3 py-2"></th>
                      <th className="px-3 py-2">File</th>
                      <th className="px-3 py-2">Pages</th>
                      <th className="px-3 py-2">Chunks</th>
                      <th className="px-3 py-2">Embedding</th>
                      <th className="px-3 py-2">Last Used</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="w-16 px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayDocs.map((doc) => {
                       const sc = getStatusConfig(doc.embedded ? 'ready' : (doc.embeddingStatus || 'queued'));
                      const StatusIcon = sc.icon;
                      const isSearchable = doc.embedded || (doc.embeddingStatus && !['queued', 'failed', 'cancelled'].includes(doc.embeddingStatus));
                      return (
                        <tr
                          key={doc.file_id}
                          className={`border-b border-border-light transition-colors hover:bg-surface-hover ${
                            selectedFileIds.includes(doc.file_id) ? 'bg-primary/5' : ''
                          } ${!isSearchable ? 'opacity-50' : ''}`}
                          title={!isSearchable ? 'Processing — not yet searchable' : undefined}
                        >
                          <td className="px-3 py-2">
                              <input
                              type="checkbox"
                              checked={selectedFileIds.includes(doc.file_id)}
                              onChange={() => toggleFileSelection(doc.file_id)}
                              className="h-4 w-4 rounded border-border-light accent-primary"
                            />
                          </td>
                          <td className="max-w-48 px-3 py-2">
                              <button
                                onClick={() => setDetailDocId(doc.file_id)}
                                className="flex items-center gap-2 text-sm font-medium text-text-primary transition-colors hover:text-accent-foreground"
                              >
                              <FileText className="h-4 w-4 shrink-0 text-text-secondary" />
                              <span className="truncate">{doc.filename}</span>
                            </button>
                          </td>
                          <td className="px-3 py-2 text-xs text-text-secondary">{doc.pages || '-'}</td>
                          <td className="px-3 py-2 text-xs text-text-secondary">{doc.chunks || '-'}</td>
                          <td className="px-3 py-2 text-xs text-text-secondary">{doc.embeddingModel || '-'}</td>
                          <td className="px-3 py-2 text-xs text-text-secondary">
                            {doc.lastUsedAt ? timeAgo(doc.lastUsedAt) : 'Never'}
                          </td>
                          <td className="px-3 py-2" title={`Status: ${sc.label}`}>
                            <span className={`inline-flex items-center gap-1 rounded-full ${sc.bg} px-2 py-0.5 text-[10px] font-medium ${sc.color}`}>
                              {sc.label === 'Ready' || sc.label === 'Failed' || sc.label === 'Cancelled' ? (
                                <StatusIcon className="h-2.5 w-2.5" />
                              ) : (
                                <StatusIcon className="h-2.5 w-2.5 animate-spin" />
                              )}
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => setDetailDocId(doc.file_id)}
                                className="rounded p-1 text-text-secondary hover:bg-surface-tertiary"
                              >
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteDoc(doc.file_id)}
                                className="rounded p-1 text-text-secondary hover:bg-surface-destructive hover:text-destructive-foreground"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Chat */}
      {showChat && (
        <div className="flex w-96 shrink-0 flex-col border-l border-border-light bg-surface-secondary">
          <KnowledgeChat
            selectedFileIds={selectedFileIds}
            collectionId={selectedCollectionId}
          />
        </div>
      )}

      {/* Document Detail Drawer */}
      {detailDocId && (
        <DocumentDetailDrawer
          fileId={detailDocId}
          collections={collections}
          onClose={() => setDetailDocId(null)}
          onDeleted={() => {
            setDetailDocId(null);
            setSelectedFileIds((prev) => prev.filter((id) => id !== detailDocId));
          }}
        />
      )}

      {/* Import Job Details Drawer */}
      {importDetailJobId && (
        <ImportDetailsDrawer
          jobId={importDetailJobId}
          onClose={() => setImportDetailJobId(null)}
        />
      )}
    </div>
  );
}
