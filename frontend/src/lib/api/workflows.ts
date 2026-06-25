import { useQuery } from '@tanstack/react-query';
import { parse as parseYaml } from 'yaml';
import { apiGet, apiPost } from './client';
import type { Trigger, TriggerKind, WorkflowDetail, WorkflowRevision, WorkflowSummary, WorkflowTask } from '@/lib/types';
interface WorkflowSummaryWire {
  id: string;
  namespace: string;
  key: string;
  enabled: boolean;
  currentRevision: number;
  triggerCount: number;
  updatedAt: string;
}
interface WorkflowDetailWire {
  id: string;
  namespace: string;
  key: string;
  enabled: boolean;
  currentRevision: number;
  sourceYaml: string;
  createdAt: string;
  updatedAt: string;
}
interface RevisionWire {
  id: string;
  revision: number;
  hash: string;
  createdAt: string;
}
interface TriggerWire {
  id: string;
  triggerId: string;
  type: string;
  enabled: boolean;
  nextEvaluationAt: string | null;
  webhookUrl: string | null;
  errorMessage: string | null;
}
interface RawYamlTask {
  id?: unknown;
  type?: unknown;
  dependsOn?: unknown;
}
export function parseTasks(sourceYaml: string): WorkflowTask[] {
  try {
    const doc = parseYaml(sourceYaml) as {
      tasks?: RawYamlTask[];
    } | null;
    const tasks = Array.isArray(doc?.tasks) ? doc!.tasks : [];
    return tasks.filter((t): t is RawYamlTask => !!t && typeof t.id === 'string').map(t => {
      const dependsOn = Array.isArray(t.dependsOn) ? t.dependsOn.filter((d): d is string => typeof d === 'string') : [];
      return {
        id: String(t.id),
        type: typeof t.type === 'string' ? t.type : 'unknown',
        dependsOn,
        explicitDependencies: dependsOn.length > 0
      };
    });
  } catch {
    return [];
  }
}
function adaptDetail(w: WorkflowDetailWire): WorkflowDetail {
  return {
    id: w.id,
    namespace: w.namespace,
    key: w.key,
    enabled: w.enabled,
    currentRevision: w.currentRevision,
    sourceYaml: w.sourceYaml,
    tasks: parseTasks(w.sourceYaml),
    createdAt: w.createdAt,
    updatedAt: w.updatedAt
  };
}
function adaptRevision(w: RevisionWire): WorkflowRevision {
  return {
    id: w.id,
    revision: w.revision,
    hash: w.hash,
    createdAt: w.createdAt
  };
}
function triggerKind(type: string, webhookUrl: string | null): TriggerKind {
  if (webhookUrl) return 'WEBHOOK';
  if (/cron|schedule/i.test(type)) return 'SCHEDULE';
  return 'MANUAL';
}
function shortType(type: string): string {
  const parts = type.split('.');
  return parts[parts.length - 1] ?? type;
}
function adaptTrigger(w: TriggerWire): Trigger {
  const kind = triggerKind(w.type, w.webhookUrl);
  return {
    id: w.id,
    triggerId: w.triggerId,
    kind,
    type: w.type,
    enabled: w.enabled,
    summary: kind === 'WEBHOOK' ? 'HMAC-verified' : shortType(w.type),
    nextEvaluationAt: w.nextEvaluationAt,
    webhookUrl: w.webhookUrl,
    errorMessage: w.errorMessage
  };
}
export async function fetchWorkflow(id: string, signal?: AbortSignal): Promise<WorkflowDetail> {
  const wire = await apiGet<WorkflowDetailWire>(`/api/v1/workflows/${id}`, {
    signal
  });
  if (!wire) throw new Error(`Workflow ${id} not found`);
  return adaptDetail(wire);
}
export async function fetchRevisions(id: string, signal?: AbortSignal): Promise<WorkflowRevision[]> {
  const wire = await apiGet<RevisionWire[]>(`/api/v1/workflows/${id}/revisions`, {
    signal
  });
  return (wire ?? []).map(adaptRevision).sort((a, b) => b.revision - a.revision);
}
export async function fetchTriggers(id: string, signal?: AbortSignal): Promise<Trigger[]> {
  const wire = await apiGet<TriggerWire[]>(`/api/v1/workflows/${id}/triggers`, {
    signal
  });
  return (wire ?? []).map(adaptTrigger);
}
export async function createWorkflow(sourceYaml: string): Promise<WorkflowDetail> {
  const wire = await apiPost<WorkflowDetailWire, {
    yaml: string;
  }>('/api/v1/workflows', {
    yaml: sourceYaml
  });
  return adaptDetail(wire);
}
export interface RunWorkflowResult {
  id: string;
}
export async function runWorkflow(workflowId: string, inputs: Record<string, unknown>): Promise<RunWorkflowResult> {
  return apiPost<RunWorkflowResult>('/api/v1/executions', {
    workflowId,
    inputs
  });
}
function adaptSummary(w: WorkflowSummaryWire): WorkflowSummary {
  return {
    id: w.id,
    namespace: w.namespace,
    key: w.key,
    enabled: w.enabled,
    currentRevision: w.currentRevision,
    triggerCount: w.triggerCount,
    updatedAt: w.updatedAt
  };
}
export async function fetchWorkflows(signal?: AbortSignal): Promise<WorkflowSummary[]> {
  const wire = await apiGet<WorkflowSummaryWire[]>('/api/v1/workflows', {
    signal
  });
  return (wire ?? []).map(adaptSummary);
}
export function useWorkflows() {
  return useQuery<WorkflowSummary[]>({
    queryKey: ['workflows'],
    queryFn: ({
      signal
    }) => fetchWorkflows(signal),
    staleTime: 30_000,
    retry: 1
  });
}
export function useWorkflow(id: string | undefined) {
  return useQuery({
    queryKey: ['workflow', id],
    queryFn: ({
      signal
    }) => fetchWorkflow(id!, signal),
    enabled: !!id,
    retry: 1
  });
}
export function useWorkflowRevisions(id: string | undefined) {
  return useQuery({
    queryKey: ['workflow', id, 'revisions'],
    queryFn: ({
      signal
    }) => fetchRevisions(id!, signal),
    enabled: !!id,
    retry: 1
  });
}
export function useWorkflowTriggers(id: string | undefined) {
  return useQuery({
    queryKey: ['workflow', id, 'triggers'],
    queryFn: ({
      signal
    }) => fetchTriggers(id!, signal),
    enabled: !!id,
    retry: 1
  });
}
