import { useState, useCallback } from 'react';
import type { TKnowledgeCollection } from 'librechat-data-provider';
import { useLocalize } from '~/hooks';
import { useGetKnowledgeDocuments, useGetKnowledgeCollections } from '~/data-provider';
import {
  useUploadKnowledgeDocumentMutation,
  useDeleteKnowledgeDocumentMutation,
  useDeleteKnowledgeCollectionMutation,
  useCreateKnowledgeCollectionMutation,
} from '~/data-provider';
import DocumentUploader from './DocumentUploader';
import KnowledgeChat from './KnowledgeChat';

export default function KnowledgeWorkspace() {
  const localize = useLocalize();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  const { data: docsData, refetch: refetchDocs } = useGetKnowledgeDocuments(
    { search: searchQuery || undefined },
  );
  const { data: collectionsData, refetch: refetchCollections } = useGetKnowledgeCollections();

  const uploadMutation = useUploadKnowledgeDocumentMutation();
  const deleteDocMutation = useDeleteKnowledgeDocumentMutation();
  const deleteCollectionMutation = useDeleteKnowledgeCollectionMutation();
  const createCollectionMutation = useCreateKnowledgeCollectionMutation();

  const handleUpload = useCallback(
    (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      uploadMutation.mutate(formData);
    },
    [uploadMutation],
  );

  const handleDeleteDoc = useCallback(
    (fileId: string) => {
      deleteDocMutation.mutate(fileId);
    },
    [deleteDocMutation],
  );

  const toggleFileSelection = useCallback((fileId: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId],
    );
  }, []);

  const collections = collectionsData?.collections || [];
  const documents = docsData?.files || [];

  const filteredDocuments = selectedCollectionId
    ? documents.filter((doc) => {
        const col = collections.find((c) => c._id === selectedCollectionId);
        return col?.fileIds?.some((f) => f.file_id === doc.file_id);
      })
    : documents;

  return (
    <div className="flex h-full gap-4 p-4">
      <div className="flex w-72 shrink-0 flex-col rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 p-3 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {localize('com_knowledge_collections')}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <button
            onClick={() => setSelectedCollectionId(null)}
            className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              selectedCollectionId === null
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span>{localize('com_knowledge_all_documents')}</span>
            </div>
          </button>
          {collections.map((col: TKnowledgeCollection) => (
            <div key={col._id} className="group flex items-center">
              <button
                onClick={() => setSelectedCollectionId(col._id)}
                className={`flex-1 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  selectedCollectionId === col._id
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span className="truncate">{col.name}</span>
                  <span className="ml-auto text-xs text-gray-400">{col.fileIds?.length || 0}</span>
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteCollectionMutation.mutate(col._id);
                }}
                className="mr-1 hidden rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-500 group-hover:block"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 p-3 dark:border-gray-700">
          <button
            onClick={() => {
              const name = prompt(localize('com_knowledge_new_collection_prompt'));
              if (name?.trim()) {
                createCollectionMutation.mutate({ name: name.trim() });
              }
            }}
            className="w-full rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 hover:border-green-500 hover:text-green-600 dark:border-gray-600 dark:text-gray-400"
          >
            + {localize('com_knowledge_new_collection')}
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 p-3 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {localize('com_knowledge_documents')}
              </h2>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={localize('com_knowledge_search_docs')}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
          <div className="p-3">
            <DocumentUploader onUpload={handleUpload} isUploading={uploadMutation.isLoading} />
          </div>
          <div className="max-h-80 overflow-y-auto">
            {filteredDocuments.length === 0 ? (
              <div className="flex items-center justify-center p-6">
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {localize('com_knowledge_no_documents')}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase text-gray-400 dark:border-gray-700">
                    <th className="w-8 px-3 py-2"></th>
                    <th className="px-3 py-2">{localize('com_knowledge_name')}</th>
                    <th className="px-3 py-2">{localize('com_knowledge_type')}</th>
                    <th className="px-3 py-2">{localize('com_knowledge_size')}</th>
                    <th className="px-3 py-2">{localize('com_knowledge_status')}</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => (
                    <tr
                      key={doc.file_id}
                      className={`border-b border-gray-50 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-750 ${
                        selectedFileIds.includes(doc.file_id) ? 'bg-green-50 dark:bg-green-900/20' : ''
                      }`}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedFileIds.includes(doc.file_id)}
                          onChange={() => toggleFileSelection(doc.file_id)}
                          className="h-4 w-4 rounded border-gray-300 text-green-600"
                        />
                      </td>
                      <td className="max-w-40 truncate px-3 py-2 font-medium text-gray-700 dark:text-gray-300">
                        {doc.filename}
                      </td>
                      <td className="px-3 py-2 text-gray-500">{doc.type?.split('/').pop() || '-'}</td>
                      <td className="px-3 py-2 text-gray-500">
                        {doc.bytes ? `${(doc.bytes / 1024).toFixed(1)} KB` : '-'}
                      </td>
                      <td className="px-3 py-2">
                        {doc.embedded ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            {localize('com_knowledge_embedded')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                            {localize('com_knowledge_pending')}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleDeleteDoc(doc.file_id)}
                          className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-500"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex-1 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
          <KnowledgeChat selectedFileIds={selectedFileIds} />
        </div>
      </div>
    </div>
  );
}
