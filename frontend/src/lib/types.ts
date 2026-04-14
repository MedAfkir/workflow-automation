export type ExecutionState = 'CREATED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'KILLED';
export type TaskRunState = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'WAITING';
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
export const CANCELLED_ERROR_CODE = 'CANCELLED';
export interface Workflow {
  id: string;
  namespace: string;
  key: string;
  enabled: boolean;
  currentRevision: number;
  createdAt: string;
  updatedAt: string;
}
export interface WorkflowTask {
  id: string;
  type: string;
  dependsOn: string[];
  explicitDependencies: boolean;
}
export interface WorkflowDetail {
  id: string;
  namespace: string;
  key: string;
  enabled: boolean;
  currentRevision: number;
  sourceYaml: string;
  tasks: WorkflowTask[];
  createdAt: string;
  updatedAt: string;
}
export interface WorkflowSummary {
  id: string;
  namespace: string;
  key: string;
  enabled: boolean;
  currentRevision: number;
  triggerCount: number;
  updatedAt: string;
}
export interface NamespaceSummary {
  name: string;
  workflowCount: number;
  disabledCount: number;
  triggerCount: number;
  workflowKeys: string[];
  updatedAt: string | null;
}
export interface WorkflowRevision {
  id: string;
  revision: number;
  hash: string;
  createdAt: string;
}
export type TriggerKind = 'SCHEDULE' | 'WEBHOOK' | 'MANUAL';
export interface Trigger {
  id: string;
  triggerId: string;
  kind: TriggerKind;
  type: string;
  enabled: boolean;
  summary: string | null;
  nextEvaluationAt: string | null;
  webhookUrl: string | null;
  errorMessage: string | null;
}
export type PluginKind = 'TASK' | 'TRIGGER';
export interface PluginProperty {
  name: string;
  type: string;
  enumValues: string[] | null;
  required: boolean;
  defaultValue: string | null;
  description: string;
  format: string | null;
  sensitive: boolean;
}
export interface PluginSummary {
  id: string;
  name: string;
  kind: PluginKind;
  version: string;
  description: string;
  categories: string[];
  deprecated: boolean;
  replacedBy: string | null;
}
export interface PluginDetail extends PluginSummary {
  properties: PluginProperty[];
}
export interface ExecutionSummary {
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
export interface Execution {
  id: string;
  workflowId: string;
  workflowKey: string;
  workflowNamespace: string;
  workflowRevision: number;
  state: ExecutionState;
  triggerType: 'MANUAL' | 'SCHEDULE' | 'WEBHOOK';
  triggerId: string | null;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown> | null;
  errorMessage: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  waitUntil: string | null;
  taskRuns: TaskRun[];
}
export interface TaskRun {
  id: string;
  executionId: string;
  taskId: string;
  taskType: string;
  parentTaskRunId: string | null;
  iteration: number | null;
  sequence: number;
  state: TaskRunState;
  attempt: number;
  maxAttempts: number;
  inputs: Record<string, unknown> | null;
  outputs: Record<string, unknown> | null;
  errorMessage: string | null;
  errorCode: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  dependsOn: string[];
  explicitDependencies: boolean;
}
export interface LogLine {
  id: string;
  taskRunId: string | null;
  taskId: string | null;
  level: LogLevel;
  message: string;
  timestamp: string;
}
export interface SecretSummary {
  id: string;
  namespace: string;
  key: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}
