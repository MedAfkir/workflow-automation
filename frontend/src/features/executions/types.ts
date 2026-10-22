export type ExecutionState = 'CREATED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'KILLED';

export type TaskRunState = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'WAITING';

export type TriggerType = 'MANUAL' | 'SCHEDULE' | 'WEBHOOK';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface ExecutionSummary {
  id: string;
  workflowId: string;
  workflowKey: string;
  workflowNamespace: string;
  workflowRevision: number;
  state: ExecutionState;
  triggerType: TriggerType;
  triggerId: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
}

export interface Execution extends ExecutionSummary {
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown> | null;
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
