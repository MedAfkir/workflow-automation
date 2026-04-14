import type { Execution, ExecutionState, LogLine, PluginDetail, PluginProperty, PluginSummary, SecretSummary, Trigger, WorkflowDetail, WorkflowRevision, WorkflowSummary, WorkflowTask } from './types';
const startedAt = new Date(Date.now() - 24_000).toISOString();
export const mockExecution: Execution = {
  id: '7f3a1b8e-9c4d-4e2f-b6a1-c1d2e3f4b2c1',
  workflowId: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0',
  workflowKey: 'greet',
  workflowNamespace: 'demo',
  workflowRevision: 3,
  state: 'RUNNING',
  triggerType: 'MANUAL',
  triggerId: null,
  inputs: {
    name: 'Mehdi'
  },
  outputs: null,
  errorMessage: null,
  startedAt,
  endedAt: null,
  createdAt: startedAt,
  waitUntil: null,
  taskRuns: [{
    id: 'tr-1',
    executionId: '7f3a1b8e-9c4d-4e2f-b6a1-c1d2e3f4b2c1',
    taskId: 'hello',
    taskType: 'io.workflowplatform.builtin.Log',
    parentTaskRunId: null,
    iteration: null,
    sequence: 0,
    state: 'SUCCESS',
    attempt: 1,
    maxAttempts: 1,
    inputs: {
      message: 'Hello Mehdi!'
    },
    outputs: {},
    errorMessage: null,
    errorCode: null,
    startedAt: new Date(Date.now() - 23_000).toISOString(),
    endedAt: new Date(Date.now() - 21_800).toISOString(),
    createdAt: startedAt,
    dependsOn: [],
    explicitDependencies: false
  }, {
    id: 'tr-2',
    executionId: '7f3a1b8e-9c4d-4e2f-b6a1-c1d2e3f4b2c1',
    taskId: 'fetch_users',
    taskType: 'io.workflowplatform.builtin.Http',
    parentTaskRunId: null,
    iteration: null,
    sequence: 1,
    state: 'RUNNING',
    attempt: 1,
    maxAttempts: 5,
    inputs: {
      url: 'https://example.com/users',
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      timeout: 'PT30S'
    },
    outputs: null,
    errorMessage: null,
    errorCode: null,
    startedAt: new Date(Date.now() - 8_400).toISOString(),
    endedAt: null,
    createdAt: startedAt,
    dependsOn: [],
    explicitDependencies: true
  }, {
    id: 'tr-3',
    executionId: '7f3a1b8e-9c4d-4e2f-b6a1-c1d2e3f4b2c1',
    taskId: 'each',
    taskType: 'io.workflowplatform.builtin.ForEach',
    parentTaskRunId: null,
    iteration: null,
    sequence: 2,
    state: 'PENDING',
    attempt: 1,
    maxAttempts: 1,
    inputs: {
      values: ['alpha', 'beta', 'gamma'],
      concurrency: 1
    },
    outputs: null,
    errorMessage: null,
    errorCode: null,
    startedAt: null,
    endedAt: null,
    createdAt: startedAt,
    dependsOn: ['hello', 'fetch_users'],
    explicitDependencies: true
  }]
};
export const mockLogs: LogLine[] = [{
  id: 'log-1',
  taskRunId: 'tr-1',
  taskId: 'hello',
  level: 'INFO',
  message: 'Hello Mehdi!',
  timestamp: new Date(Date.now() - 22_500).toISOString()
}, {
  id: 'log-2',
  taskRunId: 'tr-1',
  taskId: 'hello',
  level: 'DEBUG',
  message: 'Log task completed in 1.2s',
  timestamp: new Date(Date.now() - 21_800).toISOString()
}, {
  id: 'log-3',
  taskRunId: 'tr-2',
  taskId: 'fetch_users',
  level: 'INFO',
  message: 'Calling https://example.com/users',
  timestamp: new Date(Date.now() - 8_300).toISOString()
}, {
  id: 'log-4',
  taskRunId: 'tr-2',
  taskId: 'fetch_users',
  level: 'INFO',
  message: 'Resolved templating: 0 placeholders substituted',
  timestamp: new Date(Date.now() - 8_200).toISOString()
}, {
  id: 'log-5',
  taskRunId: 'tr-2',
  taskId: 'fetch_users',
  level: 'WARN',
  message: 'Slow upstream: response taking longer than 5s',
  timestamp: new Date(Date.now() - 3_400).toISOString()
}, {
  id: 'log-6',
  taskRunId: 'tr-2',
  taskId: 'fetch_users',
  level: 'INFO',
  message: 'Still waiting for upstream response...',
  timestamp: new Date(Date.now() - 800).toISOString()
}];
function makeExec(opts: {
  id: string;
  workflowKey: string;
  namespace?: string;
  revision?: number;
  state: ExecutionState;
  trigger?: 'MANUAL' | 'SCHEDULE' | 'WEBHOOK';
  startedAgoMs: number;
  durationMs: number | null;
  taskCount: number;
  taskSuccess: number;
  taskFailed?: number;
  errorMessage?: string | null;
}): Execution {
  const startedAt = new Date(Date.now() - opts.startedAgoMs).toISOString();
  const endedAt = opts.durationMs === null ? null : new Date(Date.now() - opts.startedAgoMs + opts.durationMs).toISOString();
  return {
    id: opts.id,
    workflowId: `wf-${opts.workflowKey}`,
    workflowKey: opts.workflowKey,
    workflowNamespace: opts.namespace ?? 'demo',
    workflowRevision: opts.revision ?? 1,
    state: opts.state,
    triggerType: opts.trigger ?? 'MANUAL',
    triggerId: null,
    inputs: {},
    outputs: opts.state === 'SUCCESS' ? {} : null,
    errorMessage: opts.errorMessage ?? null,
    startedAt,
    endedAt,
    createdAt: startedAt,
    waitUntil: null,
    taskRuns: Array.from({
      length: opts.taskCount
    }, (_, i) => ({
      id: `${opts.id}-tr-${i}`,
      executionId: opts.id,
      taskId: `task_${i}`,
      taskType: 'io.workflowplatform.builtin.Log',
      parentTaskRunId: null,
      iteration: null,
      sequence: i,
      state: i < opts.taskSuccess ? 'SUCCESS' : i < opts.taskSuccess + (opts.taskFailed ?? 0) ? 'FAILED' : opts.state === 'RUNNING' && i === opts.taskSuccess ? 'RUNNING' : 'PENDING',
      attempt: 1,
      maxAttempts: 1,
      inputs: null,
      outputs: null,
      errorMessage: null,
      errorCode: null,
      startedAt: null,
      endedAt: null,
      createdAt: startedAt,
      dependsOn: [],
      explicitDependencies: false
    }))
  };
}
export const mockExecutions: Execution[] = [mockExecution, makeExec({
  id: 'exec-002',
  workflowKey: 'sync-customers',
  revision: 12,
  state: 'SUCCESS',
  startedAgoMs: 3 * 60_000,
  durationMs: 47_000,
  taskCount: 5,
  taskSuccess: 5
}), makeExec({
  id: 'exec-003',
  workflowKey: 'nightly-report',
  revision: 4,
  state: 'FAILED',
  trigger: 'SCHEDULE',
  startedAgoMs: 12 * 60_000,
  durationMs: 8_400,
  taskCount: 4,
  taskSuccess: 2,
  taskFailed: 1,
  errorMessage: 'HTTP_500: Server error from billing API'
}), makeExec({
  id: 'exec-004',
  workflowKey: 'webhook-handler',
  namespace: 'integration',
  revision: 2,
  state: 'SUCCESS',
  trigger: 'WEBHOOK',
  startedAgoMs: 26 * 60_000,
  durationMs: 1_200,
  taskCount: 2,
  taskSuccess: 2
}), makeExec({
  id: 'exec-005',
  workflowKey: 'data-cleanup',
  revision: 8,
  state: 'KILLED',
  startedAgoMs: 45 * 60_000,
  durationMs: 18_000,
  taskCount: 3,
  taskSuccess: 1,
  errorMessage: 'Killed by user'
}), makeExec({
  id: 'exec-006',
  workflowKey: 'sync-customers',
  revision: 11,
  state: 'SUCCESS',
  trigger: 'SCHEDULE',
  startedAgoMs: 2 * 3_600_000,
  durationMs: 51_000,
  taskCount: 5,
  taskSuccess: 5
}), makeExec({
  id: 'exec-007',
  workflowKey: 'enrich-leads',
  namespace: 'sales',
  revision: 17,
  state: 'RUNNING',
  startedAgoMs: 95_000,
  durationMs: null,
  taskCount: 6,
  taskSuccess: 2
}), makeExec({
  id: 'exec-008',
  workflowKey: 'greet',
  revision: 3,
  state: 'CREATED',
  startedAgoMs: 1_500,
  durationMs: null,
  taskCount: 3,
  taskSuccess: 0
}), makeExec({
  id: 'exec-009',
  workflowKey: 'nightly-report',
  revision: 4,
  state: 'SUCCESS',
  trigger: 'SCHEDULE',
  startedAgoMs: 24 * 3_600_000,
  durationMs: 42_000,
  taskCount: 4,
  taskSuccess: 4
}), makeExec({
  id: 'exec-010',
  workflowKey: 'data-cleanup',
  revision: 7,
  state: 'FAILED',
  startedAgoMs: 3 * 86_400_000,
  durationMs: 22_000,
  taskCount: 3,
  taskSuccess: 1,
  taskFailed: 1,
  errorMessage: 'HTTP_TIMEOUT: Request timed out after PT30S'
})];
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
const greetTasks: WorkflowTask[] = [{
  id: 'hello',
  type: 'io.workflowplatform.builtin.Log',
  dependsOn: [],
  explicitDependencies: false
}, {
  id: 'fetch_users',
  type: 'io.workflowplatform.builtin.Http',
  dependsOn: [],
  explicitDependencies: false
}, {
  id: 'each',
  type: 'io.workflowplatform.builtin.ForEach',
  dependsOn: ['hello', 'fetch_users'],
  explicitDependencies: true
}];
export const mockWorkflowDetail: WorkflowDetail = {
  id: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0',
  namespace: 'demo',
  key: 'greet',
  enabled: true,
  currentRevision: 3,
  sourceYaml: GREET_YAML,
  tasks: greetTasks,
  createdAt: new Date(Date.now() - 41 * 86_400_000).toISOString(),
  updatedAt: new Date(Date.now() - 2 * 86_400_000).toISOString()
};
function mkHash(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = h * 31 + seed.charCodeAt(i) | 0;
  const base = (Math.abs(h) >>> 0).toString(16).padStart(8, '0');
  return base.repeat(8).slice(0, 64);
}
export const mockRevisions: WorkflowRevision[] = [{
  id: 'rev-3',
  revision: 3,
  hash: mkHash('greet-3'),
  createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString()
}, {
  id: 'rev-2',
  revision: 2,
  hash: mkHash('greet-2'),
  createdAt: new Date(Date.now() - 16 * 86_400_000).toISOString()
}, {
  id: 'rev-1',
  revision: 1,
  hash: mkHash('greet-1'),
  createdAt: new Date(Date.now() - 41 * 86_400_000).toISOString()
}];
export const mockTriggers: Trigger[] = [{
  id: 'trg-1',
  triggerId: 'on_schedule',
  kind: 'SCHEDULE',
  type: 'io.workflowplatform.builtin.Cron',
  enabled: true,
  summary: 'every 15 minutes',
  nextEvaluationAt: new Date(Date.now() + 9 * 60_000).toISOString(),
  webhookUrl: null,
  errorMessage: null
}, {
  id: 'trg-2',
  triggerId: 'on_push',
  kind: 'WEBHOOK',
  type: 'io.workflowplatform.builtin.Webhook',
  enabled: true,
  summary: 'HMAC-verified',
  nextEvaluationAt: null,
  webhookUrl: '/api/v1/triggers/webhook/3f9a1c7e-greet',
  errorMessage: null
}];
interface WorkflowSeed {
  id: string;
  namespace: string;
  key: string;
  enabled: boolean;
  currentRevision: number;
  triggerCount: number;
  updatedAgoMs: number;
}
const WORKFLOW_SEEDS: WorkflowSeed[] = [{
  id: mockWorkflowDetail.id,
  namespace: 'demo',
  key: 'greet',
  enabled: true,
  currentRevision: 3,
  triggerCount: 2,
  updatedAgoMs: 2 * 86_400_000
}, {
  id: 'wf-sync-customers',
  namespace: 'demo',
  key: 'sync-customers',
  enabled: true,
  currentRevision: 12,
  triggerCount: 1,
  updatedAgoMs: 3 * 3_600_000
}, {
  id: 'wf-nightly-report',
  namespace: 'demo',
  key: 'nightly-report',
  enabled: true,
  currentRevision: 4,
  triggerCount: 1,
  updatedAgoMs: 26 * 60_000
}, {
  id: 'wf-webhook-handler',
  namespace: 'integration',
  key: 'webhook-handler',
  enabled: true,
  currentRevision: 2,
  triggerCount: 1,
  updatedAgoMs: 8 * 86_400_000
}, {
  id: 'wf-data-cleanup',
  namespace: 'demo',
  key: 'data-cleanup',
  enabled: false,
  currentRevision: 8,
  triggerCount: 0,
  updatedAgoMs: 3 * 86_400_000
}, {
  id: 'wf-enrich-leads',
  namespace: 'sales',
  key: 'enrich-leads',
  enabled: true,
  currentRevision: 17,
  triggerCount: 3,
  updatedAgoMs: 95_000
}];
export const mockWorkflows: WorkflowSummary[] = WORKFLOW_SEEDS.map(s => ({
  id: s.id,
  namespace: s.namespace,
  key: s.key,
  enabled: s.enabled,
  currentRevision: s.currentRevision,
  triggerCount: s.triggerCount,
  updatedAt: new Date(Date.now() - s.updatedAgoMs).toISOString()
}));
export function mockWorkflowDetailById(id: string): WorkflowDetail {
  if (id === mockWorkflowDetail.id) return mockWorkflowDetail;
  const seed = WORKFLOW_SEEDS.find(s => s.id === id) ?? WORKFLOW_SEEDS[0];
  return {
    ...mockWorkflowDetail,
    id: seed.id,
    namespace: seed.namespace,
    key: seed.key,
    enabled: seed.enabled,
    currentRevision: seed.currentRevision,
    sourceYaml: mockWorkflowDetail.sourceYaml.replace(/^namespace: .*$/m, `namespace: ${seed.namespace}`).replace(/^key: .*$/m, `key: ${seed.key}`),
    updatedAt: new Date(Date.now() - seed.updatedAgoMs).toISOString()
  };
}
const TRIGGER_TEMPLATES: Omit<Trigger, 'id'>[] = [{
  triggerId: 'on_schedule',
  kind: 'SCHEDULE',
  type: 'io.workflowplatform.builtin.Cron',
  enabled: true,
  summary: 'every 15 minutes',
  nextEvaluationAt: new Date(Date.now() + 9 * 60_000).toISOString(),
  webhookUrl: null,
  errorMessage: null
}, {
  triggerId: 'on_push',
  kind: 'WEBHOOK',
  type: 'io.workflowplatform.builtin.Webhook',
  enabled: true,
  summary: 'HMAC-verified',
  nextEvaluationAt: null,
  webhookUrl: '/api/v1/triggers/webhook/3f9a1c7e',
  errorMessage: null
}, {
  triggerId: 'on_demand',
  kind: 'MANUAL',
  type: 'io.workflowplatform.builtin.Manual',
  enabled: false,
  summary: 'manual dispatch only',
  nextEvaluationAt: null,
  webhookUrl: null,
  errorMessage: null
}];
export function mockTriggersFor(id: string): Trigger[] {
  if (id === mockWorkflowDetail.id) return mockTriggers;
  const seed = WORKFLOW_SEEDS.find(s => s.id === id) ?? WORKFLOW_SEEDS[0];
  return TRIGGER_TEMPLATES.slice(0, seed.triggerCount).map((t, i) => ({
    ...t,
    id: `${seed.id}-trg-${i}`
  }));
}
export function mockRevisionsFor(id: string): WorkflowRevision[] {
  if (id === mockWorkflowDetail.id) return mockRevisions;
  const seed = WORKFLOW_SEEDS.find(s => s.id === id) ?? WORKFLOW_SEEDS[0];
  const n = seed.currentRevision;
  return Array.from({
    length: n
  }, (_, i) => {
    const revision = n - i;
    return {
      id: `${seed.id}-rev-${revision}`,
      revision,
      hash: mkHash(`${seed.key}-${revision}`),
      createdAt: new Date(Date.now() - seed.updatedAgoMs - i * 6 * 86_400_000).toISOString()
    };
  });
}
function p(name: string, type: string, required: boolean, extra: Partial<Omit<PluginProperty, 'name' | 'type' | 'required'>> = {}): PluginProperty {
  return {
    name,
    type,
    required,
    enumValues: extra.enumValues ?? null,
    defaultValue: extra.defaultValue ?? null,
    description: extra.description ?? '',
    format: extra.format ?? null,
    sensitive: extra.sensitive ?? false
  };
}
const BUILTIN_PLUGINS: PluginDetail[] = [{
  id: 'io.workflowplatform.builtin.Http',
  name: 'Http',
  kind: 'TASK',
  version: '1.0.0',
  description: 'Performs an HTTP request',
  categories: ['http', 'integration'],
  deprecated: false,
  replacedBy: null,
  properties: [p('url', 'string', true, {
    description: 'Target URL',
    format: 'url'
  }), p('method', 'enum', false, {
    defaultValue: 'GET',
    description: 'HTTP method',
    enumValues: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
  }), p('headers', 'map', false, {
    description: 'HTTP headers'
  }), p('body', 'any', false, {
    description: 'Request body (object will be JSON-serialized, string sent as-is)'
  }), p('timeout', 'duration', false, {
    defaultValue: 'PT30S',
    description: 'Connect+request timeout (ISO-8601, e.g. PT30S)'
  }), p('allowFailureStatus', 'boolean', false, {
    defaultValue: 'false',
    description: "Treat 4xx as success (don't fail the task)"
  }), p('bearerToken', 'string', false, {
    description: 'Bearer token (sensitive, scrubbed from logs)',
    sensitive: true
  })]
}, {
  id: 'io.workflowplatform.builtin.Log',
  name: 'Log',
  kind: 'TASK',
  version: '1.0.0',
  description: 'Logs a message at the configured level',
  categories: [],
  deprecated: false,
  replacedBy: null,
  properties: [p('message', 'string', true, {
    description: 'Message to log'
  }), p('level', 'enum', false, {
    defaultValue: 'INFO',
    description: 'Log level (TRACE, DEBUG, INFO, WARN, ERROR)',
    enumValues: ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR']
  })]
}, {
  id: 'io.workflowplatform.builtin.ForEach',
  name: 'ForEach',
  kind: 'TASK',
  version: '1.0.0',
  description: '',
  categories: [],
  deprecated: false,
  replacedBy: null,
  properties: [p('values', 'list', true, {
    description: 'List to iterate over'
  }), p('concurrency', 'integer', false, {
    defaultValue: '1',
    description: 'Max parallel iterations'
  }), p('tasks', 'task[]', true, {
    description: 'Tasks to execute per item'
  })]
}, {
  id: 'io.workflowplatform.builtin.If',
  name: 'If',
  kind: 'TASK',
  version: '1.0.0',
  description: 'Branches based on a boolean condition',
  categories: [],
  deprecated: false,
  replacedBy: null,
  properties: [p('condition', 'string', true, {
    description: 'Pebble expression evaluating to true/false'
  }), p('then', 'task[]', false, {
    description: 'Tasks to run if condition is true'
  }), p('else', 'task[]', false, {
    description: 'Tasks to run if condition is false'
  })]
}, {
  id: 'io.workflowplatform.builtin.Sleep',
  name: 'Sleep',
  kind: 'TASK',
  version: '1.0.0',
  description: 'Pauses execution for the configured duration',
  categories: [],
  deprecated: false,
  replacedBy: null,
  properties: [p('duration', 'duration', true, {
    description: 'Duration in ISO-8601 format (e.g. PT5S, PT2M)'
  })]
}, {
  id: 'io.workflowplatform.builtin.Wait',
  name: 'Wait',
  kind: 'TASK',
  version: '1.0.0',
  description: 'Pauses the workflow execution for a duration. Execution is suspended and resumed later.',
  categories: ['orchestration'],
  deprecated: false,
  replacedBy: null,
  properties: [p('duration', 'duration', true, {
    description: 'Duration to wait (ISO-8601, e.g. PT1H, P1D)'
  })]
}, {
  id: 'io.workflowplatform.builtin.Schedule',
  name: 'Schedule',
  kind: 'TRIGGER',
  version: '1.0.0',
  description: 'Fires the workflow on a cron schedule',
  categories: ['trigger', 'schedule'],
  deprecated: false,
  replacedBy: null,
  properties: [p('cron', 'string', true, {
    description: 'Cron expression (Unix 5-field format)'
  }), p('timezone', 'string', false, {
    defaultValue: 'UTC',
    description: 'Timezone (default UTC)'
  }), p('inputs', 'map', false, {
    description: 'Inputs to pass to the workflow execution'
  })]
}, {
  id: 'io.workflowplatform.builtin.Webhook',
  name: 'Webhook',
  kind: 'TRIGGER',
  version: '1.0.0',
  description: 'Fires the workflow when a POST request is made to the webhook URL',
  categories: ['trigger', 'webhook'],
  deprecated: false,
  replacedBy: null,
  properties: [p('signatureSecret', 'string', false, {
    description: "Optional secret to verify request signature (HMAC-SHA256 of body in 'X-Workflow-Signature' header)"
  }), p('inputs', 'map', false, {
    description: 'Inputs are merged with the request payload (request takes precedence)'
  })]
}];
export const mockPlugins: PluginSummary[] = BUILTIN_PLUGINS.map(({
  properties: _properties,
  ...summary
}) => summary);
export function mockPluginDetailById(id: string): PluginDetail | null {
  return BUILTIN_PLUGINS.find(pl => pl.id === id) ?? null;
}
const SECRET_SEEDS: {
  key: string;
  version: number;
  createdAgoMs: number;
  updatedAgoMs: number;
}[] = [{
  key: 'stripe-api-key',
  version: 3,
  createdAgoMs: 120 * 86_400_000,
  updatedAgoMs: 6 * 86_400_000
}, {
  key: 'db-password',
  version: 1,
  createdAgoMs: 120 * 86_400_000,
  updatedAgoMs: 120 * 86_400_000
}, {
  key: 'slack-webhook-url',
  version: 2,
  createdAgoMs: 60 * 86_400_000,
  updatedAgoMs: 14 * 86_400_000
}, {
  key: 'sendgrid-token',
  version: 1,
  createdAgoMs: 9 * 86_400_000,
  updatedAgoMs: 9 * 86_400_000
}, {
  key: 'github-pat',
  version: 5,
  createdAgoMs: 200 * 86_400_000,
  updatedAgoMs: 2 * 3_600_000
}];
export function mockSecretsFor(namespace: string): SecretSummary[] {
  return SECRET_SEEDS.map((s, i) => ({
    id: `${namespace}-secret-${i}`,
    namespace,
    key: s.key,
    version: s.version,
    createdAt: new Date(Date.now() - s.createdAgoMs).toISOString(),
    updatedAt: new Date(Date.now() - s.updatedAgoMs).toISOString()
  }));
}
