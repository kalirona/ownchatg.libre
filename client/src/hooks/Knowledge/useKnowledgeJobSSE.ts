import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from 'librechat-data-provider';
import { apiBaseUrl } from 'librechat-data-provider';
import { useToastContext } from '@librechat/client';
import type { TImportJob } from 'librechat-data-provider';

type SSEUpdate = {
  type?: string;
  status?: string;
  pct?: number;
  message?: string;
  step?: string;
  error?: string;
  retryCount?: number;
  result?: {
    documentIds?: string[];
    chunkCount?: number;
    vectorCount?: number;
  };
  jobId?: string;
};

const activeConnections = new Map<string, EventSource>();

function handleSSEMessage(
  event: MessageEvent,
  queryClient: unknown,
  showToast: (opts: { message: string; status: string }) => void,
  decoded: string,
) {
  try {
    const data: SSEUpdate = JSON.parse(event.data);
    if (data.type === 'connected') { return; }

    const qc = queryClient as {
      setQueryData: (key: unknown, updater: (old: TImportJob | undefined) => TImportJob | undefined) => void;
      invalidateQueries: (key: unknown) => void;
    };

    qc.setQueryData(
      [QueryKeys.knowledgeImportJob, decoded],
      (old: TImportJob | undefined) => {
        if (!old) { return old; }
        return {
          ...old,
          status: (data.status as TImportJob['status']) || old.status,
          progress: {
            ...old.progress,
            pct: data.pct ?? old.progress.pct,
            currentStep: data.step || data.status || old.progress.currentStep,
            message: data.message || old.progress.message,
          },
          ...(data.error ? { error: { message: data.error } } : {}),
          ...(data.result
            ? { result: { ...old.result, ...data.result } }
            : {}),
        } as TImportJob;
      },
    );

    if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
      qc.invalidateQueries([QueryKeys.knowledgeDocuments]);
      qc.invalidateQueries([QueryKeys.knowledgeCollections]);
      qc.invalidateQueries([QueryKeys.knowledgeImportJobs]);
    }

    if (data.status === 'completed') {
      showToast({ message: `Import complete`, status: 'success' });
    } else if (data.status === 'failed') {
      showToast({ message: `Import failed: ${data.error || 'unknown'}`, status: 'error' });
    }
  } catch (_e) {
    // ignore parse errors
  }
}

function createSSEConnection(jobId: string): EventSource | null {
  const decoded = decodeURIComponent(jobId);
  if (activeConnections.has(decoded)) {
    return activeConnections.get(decoded) || null;
  }

  const url = `${apiBaseUrl()}api/knowledge/jobs/${jobId}/sse`;
  const es = new EventSource(url);

  es.onerror = () => {
    es.close();
    activeConnections.delete(decoded);
  };

  activeConnections.set(decoded, es);
  return es;
}

export function useKnowledgeJobSSE(jobId: string | null) {
  const queryClient = useQueryClient();
  const { showToast } = useToastContext();
  const decodedRef = useRef<string | null>(null);

  const connect = useCallback(() => {
    if (!jobId) { return null; }
    decodedRef.current = decodeURIComponent(jobId);
    return createSSEConnection(jobId);
  }, [jobId]);

  useEffect(() => {
    if (!jobId) { return; }
    const es = connect();
    if (!es) { return; }

    es.onmessage = (event: MessageEvent) => {
      handleSSEMessage(event, queryClient, showToast, decodedRef.current || jobId);
    };

    return () => {
      es.close();
      if (decodedRef.current) {
        activeConnections.delete(decodedRef.current);
      }
    };
  }, [jobId, connect, queryClient, showToast]);

  const close = useCallback(() => {
    if (decodedRef.current) {
      const existing = activeConnections.get(decodedRef.current);
      if (existing) {
        existing.close();
        activeConnections.delete(decodedRef.current);
      }
    }
  }, []);

  return { close };
}

export function useKnowledgeJobSSEBatch(jobIds: string[]) {
  const queryClient = useQueryClient();
  const { showToast } = useToastContext();
  const prevIdsRef = useRef<string[]>([]);

  useEffect(() => {
    const currentIds = jobIds;
    const prevIds = prevIdsRef.current;
    prevIdsRef.current = currentIds;

    const connections: EventSource[] = [];

    for (const rawId of currentIds) {
      const decoded = decodeURIComponent(rawId);
      if (activeConnections.has(decoded)) { continue; }

      const es = createSSEConnection(rawId);
      if (!es) { continue; }

      es.onmessage = (event: MessageEvent) => {
        handleSSEMessage(event, queryClient, showToast, decoded);
      };

      connections.push(es);
    }

    return () => {
      const nextIds = new Set(currentIds.map((id) => decodeURIComponent(id)));
      for (const es of connections) {
        es.close();
        for (const [key, val] of activeConnections) {
          if (val === es) {
            activeConnections.delete(key);
            break;
          }
        }
      }
    };
  }, [jobIds.join(','), queryClient, showToast]);
}
