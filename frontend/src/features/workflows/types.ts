export interface WorkflowTask {
  id: string;
  type: string;
  dependsOn: string[];
  explicitDependencies: boolean;
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
