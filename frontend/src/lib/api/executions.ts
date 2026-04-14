import { useQuery } from '@tanstack/react-query';
import { apiGet, apiPost } from './client';
import type { Execution, ExecutionState, ExecutionSummary, TaskRun } from '@/lib/types';
interface ExecutionSummaryWire {
  id: string;
  workflowId: string;
  workflowKey: string;
  workflowNamespace: string;
  workflowRevision: number;
  state: ExecutionState;
  triggerType: 'MANUAL' | 'SCHEDULE' | 'WEBHOOK';
  triggerId: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
}
interface ExecutionResponseWire extends ExecutionSummaryWire {
  workflowRevisionId: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown> | null;
}
interface TaskRunWire {
  id: string;
  taskId: string;
  taskType: string;
  sequence: number;
  state: TaskRun['state'];
  attempt: number;
  maxAttempts: number;
  parentTaskRunId: string | null;
  iteration: number | null;
  dependsOn: string[];
  explicitDependencies: boolean;
  inputs: Record<string, unknown> | null;
  outputs: Record<string, unknown> | null;
  errorMessage: string | null;
  errorCode: string | null;
  startedAt: string | null;
  endedAt: string | null;
}
interface ExecutionDetailWire {
  execution: ExecutionResponseWire;
  taskRuns: TaskRunWire[];
}
function adaptSummary(w: ExecutionSummaryWire): ExecutionSummary {
  return {
    id: w.id,
    workflowId: w.workflowId,
    workflowKey: w.workflowKey,
    workflowNamespace: w.workflowNamespace,
    workflowRevision: w.workflowRevision,
    state: w.state,
    triggerType: w.triggerType,
    triggerId: w.triggerId,
    errorMessage: w.errorMessage,
    startedAt: w.startedAt,
    endedAt: w.endedAt,
    createdAt: w.createdAt
  };
}
function adaptTaskRun(w: TaskRunWire, executionId: string): TaskRun {
  return {
    id: w.id,
    executionId,
    taskId: w.taskId,
    taskType: w.taskType,
    parentTaskRunId: w.parentTaskRunId,
    iteration: w.iteration,
    sequence: w.sequence,
    state: w.state,
    attempt: w.attempt,
    maxAttempts: w.maxAttempts,
    inputs: w.inputs,
    outputs: w.outputs,
    errorMessage: w.errorMessage,
    errorCode: w.errorCode,
    startedAt: w.startedAt,
    endedAt: w.endedAt,
    createdAt: w.startedAt ?? new Date().toISOString(),
    dependsOn: w.dependsOn,
    explicitDependencies: w.explicitDependencies
  };
}
function adaptDetail(d: ExecutionDetailWire): Execution {
  const e = d.execution;
  return {
    id: e.id,
    workflowId: e.workflowId,
    workflowKey: e.workflowKey,
    workflowNamespace: e.workflowNamespace,
    workflowRevision: e.workflowRevision,
    state: e.state,
    triggerType: e.triggerType,
    triggerId: e.triggerId,
    inputs: e.inputs,
    outputs: e.outputs,
    errorMessage: e.errorMessage,
    startedAt: e.startedAt,
    endedAt: e.endedAt,
    createdAt: e.createdAt,
    waitUntil: null,
    taskRuns: d.taskRuns.map(t => adaptTaskRun(t, e.id))
  };
}
export interface ExecutionsQuery {
  limit?: number;
  state?: ExecutionState | null;
}
export async function fetchExecutions(q: ExecutionsQuery, signal?: AbortSignal): Promise<ExecutionSummary[]> {
  const params = new URLSearchParams();
  if (q.limit) params.set('limit', String(q.limit));
  if (q.state) params.set('state', q.state);
  const path = `/api/v1/executions${params.size > 0 ? `?${params}` : ''}`;
  const wire = await apiGet<ExecutionSummaryWire[]>(path, {
    signal
  });
  return (wire ?? []).map(adaptSummary);
}
export async function fetchExecution(id: string, signal?: AbortSignal): Promise<Execution> {
  const wire = await apiGet<ExecutionDetailWire>(`/api/v1/executions/${id}`, {
    signal
  });
  if (!wire) throw new Error(`Execution ${id} not found`);
  return adaptDetail(wire);
}
export async function killExecution(id: string): Promise<void> {
  await apiPost<unknown>(`/api/v1/executions/${id}/kill`, {});
}
export function useExecutions(query: ExecutionsQuery = {}) {
  return useQuery({
    queryKey: ['executions', query],
    queryFn: ({
      signal
    }) => fetchExecutions(query, signal),
    refetchInterval: 5_000,
    refetchIntervalInBackground: false
  });
}
export function useExecution(id: string | undefined) {
  return useQuery({
    queryKey: ['execution', id],
    queryFn: ({
      signal
    }) => fetchExecution(id!, signal),
    enabled: !!id
  });
}
