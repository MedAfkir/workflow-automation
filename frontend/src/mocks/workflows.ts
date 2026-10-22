import type {
  Trigger,
  WorkflowDetail,
  WorkflowRevision,
  WorkflowSummary,
  WorkflowTask,
} from '@/features/workflows';

const GREET_YAML = `namespace: demo
key: greet

triggers:
  - id: on_schedule
    type: io.workflowplatform.builtin.Cron
    config:
      expression: "0 */15 * * * *"

tasks:
  - id: hello
    type: io.workflowplatform.builtin.Log
    config:
      message: "Hello \${{ inputs.name }}!"

  - id: fetch_users
    type: io.workflowplatform.builtin.Http
    config:
      url: https://example.com/users
      method: GET
      timeout: PT30S

  - id: each
    type: io.workflowplatform.builtin.ForEach
    dependsOn: [hello, fetch_users]
    config:
      values: "\${{ tasks.fetch_users.outputs.body }}"
      concurrency: 4
`;

const greetTasks: WorkflowTask[] = [
  {
    id: 'hello',
    type: 'io.workflowplatform.builtin.Log',
    dependsOn: [],
    explicitDependencies: false,
  },
  {
    id: 'fetch_users',
    type: 'io.workflowplatform.builtin.Http',
    dependsOn: [],
    explicitDependencies: false,
  },
  {
    id: 'each',
    type: 'io.workflowplatform.builtin.ForEach',
    dependsOn: ['hello', 'fetch_users'],
    explicitDependencies: true,
  },
];

export const mockWorkflowDetail: WorkflowDetail = {
  id: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0',
  namespace: 'demo',
  key: 'greet',
  enabled: true,
  currentRevision: 3,
  sourceYaml: GREET_YAML,
  tasks: greetTasks,
  createdAt: new Date(Date.now() - 41 * 86_400_000).toISOString(),
  updatedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
};

function mkHash(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const base = (Math.abs(h) >>> 0).toString(16).padStart(8, '0');
  return base.repeat(8).slice(0, 64);
}

export const mockRevisions: WorkflowRevision[] = [
  {
    id: 'rev-3',
    revision: 3,
    hash: mkHash('greet-3'),
    createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  },
  {
    id: 'rev-2',
    revision: 2,
    hash: mkHash('greet-2'),
    createdAt: new Date(Date.now() - 16 * 86_400_000).toISOString(),
  },
  {
    id: 'rev-1',
    revision: 1,
    hash: mkHash('greet-1'),
    createdAt: new Date(Date.now() - 41 * 86_400_000).toISOString(),
  },
];

export const mockTriggers: Trigger[] = [
  {
    id: 'trg-1',
    triggerId: 'on_schedule',
    kind: 'SCHEDULE',
    type: 'io.workflowplatform.builtin.Cron',
    enabled: true,
    summary: 'every 15 minutes',
    nextEvaluationAt: new Date(Date.now() + 9 * 60_000).toISOString(),
    webhookUrl: null,
    errorMessage: null,
  },
  {
    id: 'trg-2',
    triggerId: 'on_push',
    kind: 'WEBHOOK',
    type: 'io.workflowplatform.builtin.Webhook',
    enabled: true,
    summary: 'HMAC-verified',
    nextEvaluationAt: null,
    webhookUrl: '/api/v1/triggers/webhook/3f9a1c7e-greet',
    errorMessage: null,
  },
];

interface WorkflowSeed {
  id: string;
  namespace: string;
  key: string;
  enabled: boolean;
  currentRevision: number;
  triggerCount: number;
  updatedAgoMs: number;
}

const WORKFLOW_SEEDS: WorkflowSeed[] = [
  {
    id: mockWorkflowDetail.id,
    namespace: 'demo',
    key: 'greet',
    enabled: true,
    currentRevision: 3,
    triggerCount: 2,
    updatedAgoMs: 2 * 86_400_000,
  },
  {
    id: 'wf-sync-customers',
    namespace: 'demo',
    key: 'sync-customers',
    enabled: true,
    currentRevision: 12,
    triggerCount: 1,
    updatedAgoMs: 3 * 3_600_000,
  },
  {
    id: 'wf-nightly-report',
    namespace: 'demo',
    key: 'nightly-report',
    enabled: true,
    currentRevision: 4,
    triggerCount: 1,
    updatedAgoMs: 26 * 60_000,
  },
  {
    id: 'wf-webhook-handler',
    namespace: 'integration',
    key: 'webhook-handler',
    enabled: true,
    currentRevision: 2,
    triggerCount: 1,
    updatedAgoMs: 8 * 86_400_000,
  },
  {
    id: 'wf-data-cleanup',
    namespace: 'demo',
    key: 'data-cleanup',
    enabled: false,
    currentRevision: 8,
    triggerCount: 0,
    updatedAgoMs: 3 * 86_400_000,
  },
  {
    id: 'wf-enrich-leads',
    namespace: 'sales',
    key: 'enrich-leads',
    enabled: true,
    currentRevision: 17,
    triggerCount: 3,
    updatedAgoMs: 95_000,
  },
];

export const mockWorkflows: WorkflowSummary[] = WORKFLOW_SEEDS.map((s) => ({
  id: s.id,
  namespace: s.namespace,
  key: s.key,
  enabled: s.enabled,
  currentRevision: s.currentRevision,
  triggerCount: s.triggerCount,
  updatedAt: new Date(Date.now() - s.updatedAgoMs).toISOString(),
}));

export function mockWorkflowDetailById(id: string): WorkflowDetail {
  if (id === mockWorkflowDetail.id) return mockWorkflowDetail;
  const seed = WORKFLOW_SEEDS.find((s) => s.id === id) ?? WORKFLOW_SEEDS[0];
  return {
    ...mockWorkflowDetail,
    id: seed.id,
    namespace: seed.namespace,
    key: seed.key,
    enabled: seed.enabled,
    currentRevision: seed.currentRevision,
    sourceYaml: mockWorkflowDetail.sourceYaml
      .replace(/^namespace: .*$/m, `namespace: ${seed.namespace}`)
      .replace(/^key: .*$/m, `key: ${seed.key}`),
    updatedAt: new Date(Date.now() - seed.updatedAgoMs).toISOString(),
  };
}

const TRIGGER_TEMPLATES: Omit<Trigger, 'id'>[] = [
  {
    triggerId: 'on_schedule',
    kind: 'SCHEDULE',
    type: 'io.workflowplatform.builtin.Cron',
    enabled: true,
    summary: 'every 15 minutes',
    nextEvaluationAt: new Date(Date.now() + 9 * 60_000).toISOString(),
    webhookUrl: null,
    errorMessage: null,
  },
  {
    triggerId: 'on_push',
    kind: 'WEBHOOK',
    type: 'io.workflowplatform.builtin.Webhook',
    enabled: true,
    summary: 'HMAC-verified',
    nextEvaluationAt: null,
    webhookUrl: '/api/v1/triggers/webhook/3f9a1c7e',
    errorMessage: null,
  },
  {
    triggerId: 'on_demand',
    kind: 'MANUAL',
    type: 'io.workflowplatform.builtin.Manual',
    enabled: false,
    summary: 'manual dispatch only',
    nextEvaluationAt: null,
    webhookUrl: null,
    errorMessage: null,
  },
];

export function mockTriggersFor(id: string): Trigger[] {
  if (id === mockWorkflowDetail.id) return mockTriggers;
  const seed = WORKFLOW_SEEDS.find((s) => s.id === id) ?? WORKFLOW_SEEDS[0];
  return TRIGGER_TEMPLATES.slice(0, seed.triggerCount).map((t, i) => ({
    ...t,
    id: `${seed.id}-trg-${i}`,
  }));
}

export function mockRevisionsFor(id: string): WorkflowRevision[] {
  if (id === mockWorkflowDetail.id) return mockRevisions;
  const seed = WORKFLOW_SEEDS.find((s) => s.id === id) ?? WORKFLOW_SEEDS[0];
  const n = seed.currentRevision;
  return Array.from(
    {
      length: n,
    },
    (_, i) => {
      const revision = n - i;
      return {
        id: `${seed.id}-rev-${revision}`,
        revision,
        hash: mkHash(`${seed.key}-${revision}`),
        createdAt: new Date(Date.now() - seed.updatedAgoMs - i * 6 * 86_400_000).toISOString(),
      };
    },
  );
}
