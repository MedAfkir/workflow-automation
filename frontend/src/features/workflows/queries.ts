import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { executionKeys } from '@/features/executions';

import {
  createWorkflow,
  fetchRevisions,
  fetchTriggers,
  fetchWorkflow,
  fetchWorkflows,
  runWorkflow,
} from './api';

export const workflowKeys = {
  all: ['workflows'] as const,
  list: () => [...workflowKeys.all, 'list'] as const,
  detail: (id: string) => [...workflowKeys.all, 'detail', id] as const,
  revisions: (id: string) => [...workflowKeys.detail(id), 'revisions'] as const,
  triggers: (id: string) => [...workflowKeys.detail(id), 'triggers'] as const,
};

export function useWorkflows() {
  return useQuery({
    queryKey: workflowKeys.list(),
    queryFn: ({ signal }) => fetchWorkflows(signal),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useWorkflow(id: string | undefined) {
  return useQuery({
    queryKey: workflowKeys.detail(id ?? ''),
    queryFn: ({ signal }) => fetchWorkflow(id!, signal),
    enabled: !!id,
    retry: 1,
  });
}

export function useWorkflowRevisions(id: string | undefined) {
  return useQuery({
    queryKey: workflowKeys.revisions(id ?? ''),
    queryFn: ({ signal }) => fetchRevisions(id!, signal),
    enabled: !!id,
    retry: 1,
  });
}

export function useWorkflowTriggers(id: string | undefined) {
  return useQuery({
    queryKey: workflowKeys.triggers(id ?? ''),
    queryFn: ({ signal }) => fetchTriggers(id!, signal),
    enabled: !!id,
    retry: 1,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWorkflow,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workflowKeys.all }),
  });
}

export function useRunWorkflow(workflowId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inputs: Record<string, unknown>) => runWorkflow(workflowId, inputs),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: executionKeys.all }),
  });
}
