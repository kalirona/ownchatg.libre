import { useState, useRef, useCallback } from 'react';
import { useLocalize } from '~/hooks';

export default function DocumentUploader({
  onUpload,
  isUploading,
}: {
  onUpload: (file: File) => void;
  isUploading: boolean;
}) {
  const localize = useLocalize();
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      const allowed = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown',
        'text/csv',
        'application/json',
      ];
      const ext = file.name.split('.').pop()?.toLowerCase();
      const supportedExts = ['pdf', 'docx', 'txt', 'md', 'csv', 'json'];
      const isAllowed =
        allowed.includes(file.type) || (ext ? supportedExts.includes(ext) : false);
      if (!isAllowed) {
        alert(localize('com_knowledge_unsupported_file'));
        return;
      }
      onUpload(file);
    },
    [onUpload, localize],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
      e.target.value = '';
    },
    [handleFile],
  );

  return (
    <div
      className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
        dragOver
          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
          : 'border-gray-300 dark:border-gray-600'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          inputRef.current?.click();
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.txt,.md,.csv,.json"
        onChange={handleChange}
      />
      {isUploading ? (
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 animate-spin text-green-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {localize('com_knowledge_uploading')}
          </span>
        </div>
      ) : (
        <>
          <svg
            className="mb-2 h-8 w-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {localize('com_knowledge_dropzone')}
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            PDF, DOCX, TXT, MD, CSV, JSON
          </p>
        </>
      )}
    </div>
  );
}
