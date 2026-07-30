import { memo, useState } from 'react';
import {
  X, FileText, BookOpen, Database, Calendar, Hash,
  HelpCircle, ExternalLink, Trash2, RotateCcw, Edit3, Move,
  Check, Loader2,
} from 'lucide-react';
import { useGetKnowledgeDocumentDetail } from '~/data-provider';
import {
  useRenameKnowledgeDocumentMutation,
  useReindexKnowledgeDocumentMutation,
  useMoveKnowledgeDocumentMutation,
  useDeleteKnowledgeDocumentMutation,
} from '~/data-provider';
import type { TKnowledgeCollection } from 'librechat-data-provider';
import { formatBytes } from '~/utils/knowledge';

export default function DocumentDetailDrawer({
  fileId,
  collections,
  onClose,
  onDeleted,
}: {
  fileId: string;
  collections: TKnowledgeCollection[];
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { data, isLoading } = useGetKnowledgeDocumentDetail(fileId);
  const renameMutation = useRenameKnowledgeDocumentMutation();
  const reindexMutation = useReindexKnowledgeDocumentMutation();
  const moveMutation = useMoveKnowledgeDocumentMutation();
  const deleteMutation = useDeleteKnowledgeDocumentMutation();

  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [moving, setMoving] = useState(false);
  const [targetCollection, setTargetCollection] = useState('');

  const doc = data?.document;

  const handleRename = () => {
    if (!newName.trim()) { return; }
    renameMutation.mutate({ id: fileId, name: newName.trim() }, {
      onSuccess: () => setRenaming(false),
    });
  };

  const handleReindex = () => {
    if (confirm('Reindex this document? This will re-process embeddings.')) {
      reindexMutation.mutate(fileId);
    }
  };

  const handleMove = () => {
    moveMutation.mutate({ id: fileId, collectionId: targetCollection || null }, {
      onSuccess: () => setMoving(false),
    });
  };

  const handleDelete = () => {
    if (confirm('Delete this document permanently?')) {
      deleteMutation.mutate(fileId, { onSuccess: onDeleted });
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-80 flex-col border-l border-border-light bg-surface-primary shadow-xl">
      <div className="flex items-center justify-between border-b border-border-light px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">Document Details</h3>
        <button onClick={onClose} className="rounded p-1 text-text-secondary hover:bg-surface-hover">
          <X className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-text-secondary" />
        </div>
      ) : !doc ? (
        <div className="flex flex-1 items-center justify-center text-sm text-text-secondary">Document not found</div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          {/* Preview placeholder */}
          <div className="mb-4 flex h-32 items-center justify-center rounded-xl border border-border-light bg-surface-tertiary">
            <FileText className="h-10 w-10 text-text-secondary" />
          </div>

          {/* Metadata */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between">
                {renaming ? (
                  <div className="flex flex-1 items-center gap-1">
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 rounded border border-border-light bg-surface-tertiary px-2 py-1 text-sm text-text-primary"
                      autoFocus
                    />
                    <button onClick={handleRename} className="rounded p-1 text-green-600 hover:bg-green-100">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setRenaming(false)} className="rounded p-1 text-text-secondary hover:bg-surface-hover">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium text-text-primary">{doc.filename}</p>
                    <button onClick={() => { setRenaming(true); setNewName(doc.filename); }} className="rounded p-1 text-text-secondary hover:bg-surface-hover">
                      <Edit3 className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
              <p className="mt-0.5 text-[10px] text-text-secondary">{doc.type?.split('/').pop()?.toUpperCase() || 'Unknown'}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Pages', value: doc.pages || '-', icon: BookOpen },
                { label: 'Chunks', value: doc.chunks || '-', icon: Database },
                { label: 'Size', value: formatBytes(doc.bytes || 0), icon: Hash },
                { label: 'Embedding', value: doc.embeddingModel || '-', icon: Loader2 },
              ].map((m) => (
                <div key={m.label} className="rounded-lg border border-border-light bg-surface-secondary p-2.5">
                  <div className="flex items-center gap-1 text-[10px] text-text-secondary">
                    <m.icon className="h-3 w-3" /> {m.label}
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-text-primary">{m.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Uploaded', value: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : '-', icon: Calendar },
                { label: 'Questions', value: doc.questionsAsked || 0, icon: HelpCircle },
                { label: 'Referenced', value: `${doc.referencedCount || 0} times`, icon: ExternalLink },
              ].map((m) => (
                <div key={m.label} className="rounded-lg border border-border-light bg-surface-secondary p-2.5">
                  <div className="flex items-center gap-1 text-[10px] text-text-secondary">
                    <m.icon className="h-3 w-3" /> {m.label}
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-text-primary">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Move to collection */}
            {moving ? (
              <div className="rounded-lg border border-border-light bg-surface-secondary p-2.5">
                <label className="mb-1 block text-[10px] font-medium text-text-secondary">Move to Collection</label>
                <div className="flex gap-1">
                  <select
                    value={targetCollection}
                    onChange={(e) => setTargetCollection(e.target.value)}
                    className="flex-1 rounded border border-border-light bg-surface-tertiary px-2 py-1 text-xs text-text-primary"
                  >
                    <option value="">No collection</option>
                    {collections.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                  <button onClick={handleMove} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Go</button>
                  <button onClick={() => setMoving(false)} className="rounded p-1 text-text-secondary"><X className="h-3 w-3" /></button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Actions */}
          <div className="mt-5 space-y-1">
            <button onClick={() => setMoving(true)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-text-secondary hover:bg-surface-hover">
              <Move className="h-3.5 w-3.5" /> Move to Collection
            </button>
            <button onClick={handleReindex} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-text-secondary hover:bg-surface-hover">
              <RotateCcw className="h-3.5 w-3.5" /> Reindex
            </button>
            <button onClick={handleDelete} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
