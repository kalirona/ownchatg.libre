import { useRecoilValue } from 'recoil';
import { QueryKeys, dataService } from 'librechat-data-provider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryObserverResult, UseQueryOptions, UseMutationResult } from '@tanstack/react-query';
import type t from 'librechat-data-provider';
import store from '~/store';

export const useGetWorkflows = (): QueryObserverResult<{ workflows: t.TWorkflow[] }> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<{ workflows: t.TWorkflow[] }>(
    [QueryKeys.workflows],
    () => dataService.getWorkflows(),
    { enabled: queriesEnabled },
  );
};

export const useGetWorkflow = (
  id: string,
  config?: UseQueryOptions<{ workflow: t.TWorkflow }>,
): QueryObserverResult<{ workflow: t.TWorkflow }> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<{ workflow: t.TWorkflow }>(
    [QueryKeys.workflow, id],
    () => dataService.getWorkflow(id),
    {
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled && !!id,
    },
  );
};

export const useCreateWorkflowMutation = (): UseMutationResult<
  { workflow: t.TWorkflow },
  Error,
  t.TWorkflowCreateRequest
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['createWorkflow'],
    (data) => dataService.createWorkflow(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.workflows]);
      },
    },
  );
};

export const useUpdateWorkflowMutation = (): UseMutationResult<
  { workflow: t.TWorkflow },
  Error,
  { id: string; data: Partial<t.TWorkflowCreateRequest> }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['updateWorkflow'],
    ({ id, data }) => dataService.updateWorkflow(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.workflows]);
        queryClient.invalidateQueries([QueryKeys.workflow]);
      },
    },
  );
};

export const useDeleteWorkflowMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['deleteWorkflow'],
    (id: string) => dataService.deleteWorkflow(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.workflows]);
      },
    },
  );
};

export const useExecuteWorkflowMutation = (): UseMutationResult<
  { execution: t.TWorkflowExecution },
  Error,
  { id: string; input?: Record<string, unknown> }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['executeWorkflow'],
    ({ id, input }) => dataService.executeWorkflow(id, input),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.workflowExecutions]);
      },
    },
  );
};

export const useGetWorkflowExecutions = (
  id: string,
): QueryObserverResult<{ executions: t.TWorkflowExecution[] }> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<{ executions: t.TWorkflowExecution[] }>(
    [QueryKeys.workflowExecutions, id],
    () => dataService.getWorkflowExecutions(id),
    { enabled: queriesEnabled && !!id },
  );
};

export const useGetWorkflowExecution = (
  id: string,
  executionId: string,
): QueryObserverResult<{ execution: t.TWorkflowExecution }> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<{ execution: t.TWorkflowExecution }>(
    [QueryKeys.workflowExecution, id, executionId],
    () => dataService.getWorkflowExecution(id, executionId),
    { enabled: queriesEnabled && !!id && !!executionId },
  );
};

export const useApproveWorkflowExecutionMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  { id: string; executionId: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['approveWorkflowExecution'],
    ({ id, executionId }) => dataService.approveWorkflowExecution(id, executionId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.workflowExecution]);
      },
    },
  );
};

export const useRejectWorkflowExecutionMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  { id: string; executionId: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    ['rejectWorkflowExecution'],
    ({ id, executionId }) => dataService.rejectWorkflowExecution(id, executionId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.workflowExecution]);
      },
    },
  );
};

export const useCancelWorkflowExecutionMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  { id: string; executionId: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.workflowCancelExecution],
    ({ id, executionId }) => dataService.cancelWorkflowExecution(id, executionId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.workflowExecution]);
        queryClient.invalidateQueries([QueryKeys.workflowExecutions]);
      },
    },
  );
};

export const useRetryWorkflowExecutionMutation = (): UseMutationResult<
  { success: boolean },
  Error,
  { id: string; executionId: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.workflowRetryExecution],
    ({ id, executionId }) => dataService.retryWorkflowExecution(id, executionId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.workflowExecution]);
        queryClient.invalidateQueries([QueryKeys.workflowExecutions]);
      },
    },
  );
};
