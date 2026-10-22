import type { Execution, ExecutionState, LogLine } from '@/features/executions';

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
    name: 'Mehdi',
  },
  outputs: null,
  errorMessage: null,
  startedAt,
  endedAt: null,
  createdAt: startedAt,
  waitUntil: null,
  taskRuns: [
    {
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
        message: 'Hello Mehdi!',
      },
      outputs: {},
      errorMessage: null,
      errorCode: null,
      startedAt: new Date(Date.now() - 23_000).toISOString(),
      endedAt: new Date(Date.now() - 21_800).toISOString(),
      createdAt: startedAt,
      dependsOn: [],
      explicitDependencies: false,
    },
    {
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
          Accept: 'application/json',
        },
        timeout: 'PT30S',
      },
      outputs: null,
      errorMessage: null,
      errorCode: null,
      startedAt: new Date(Date.now() - 8_400).toISOString(),
      endedAt: null,
      createdAt: startedAt,
      dependsOn: [],
      explicitDependencies: true,
    },
    {
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
        concurrency: 1,
      },
      outputs: null,
      errorMessage: null,
      errorCode: null,
      startedAt: null,
      endedAt: null,
      createdAt: startedAt,
      dependsOn: ['hello', 'fetch_users'],
      explicitDependencies: true,
    },
  ],
};

export const mockLogs: LogLine[] = [
  {
    id: 'log-1',
    taskRunId: 'tr-1',
    taskId: 'hello',
    level: 'INFO',
    message: 'Hello Mehdi!',
    timestamp: new Date(Date.now() - 22_500).toISOString(),
  },
  {
    id: 'log-2',
    taskRunId: 'tr-1',
    taskId: 'hello',
    level: 'DEBUG',
    message: 'Log task completed in 1.2s',
    timestamp: new Date(Date.now() - 21_800).toISOString(),
  },
  {
    id: 'log-3',
    taskRunId: 'tr-2',
    taskId: 'fetch_users',
    level: 'INFO',
    message: 'Calling https://example.com/users',
    timestamp: new Date(Date.now() - 8_300).toISOString(),
  },
  {
    id: 'log-4',
    taskRunId: 'tr-2',
    taskId: 'fetch_users',
    level: 'INFO',
    message: 'Resolved templating: 0 placeholders substituted',
    timestamp: new Date(Date.now() - 8_200).toISOString(),
  },
  {
    id: 'log-5',
    taskRunId: 'tr-2',
    taskId: 'fetch_users',
    level: 'WARN',
    message: 'Slow upstream: response taking longer than 5s',
    timestamp: new Date(Date.now() - 3_400).toISOString(),
  },
  {
    id: 'log-6',
    taskRunId: 'tr-2',
    taskId: 'fetch_users',
    level: 'INFO',
    message: 'Still waiting for upstream response...',
    timestamp: new Date(Date.now() - 800).toISOString(),
  },
];

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
  const endedAt =
    opts.durationMs === null
      ? null
      : new Date(Date.now() - opts.startedAgoMs + opts.durationMs).toISOString();
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
    taskRuns: Array.from(
      {
        length: opts.taskCount,
      },
      (_, i) => ({
        id: `${opts.id}-tr-${i}`,
        executionId: opts.id,
        taskId: `task_${i}`,
        taskType: 'io.workflowplatform.builtin.Log',
        parentTaskRunId: null,
        iteration: null,
        sequence: i,
        state:
          i < opts.taskSuccess
            ? 'SUCCESS'
            : i < opts.taskSuccess + (opts.taskFailed ?? 0)
              ? 'FAILED'
              : opts.state === 'RUNNING' && i === opts.taskSuccess
                ? 'RUNNING'
                : 'PENDING',
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
        explicitDependencies: false,
      }),
    ),
  };
}

export const mockExecutions: Execution[] = [
  mockExecution,
  makeExec({
    id: 'exec-002',
    workflowKey: 'sync-customers',
    revision: 12,
    state: 'SUCCESS',
    startedAgoMs: 3 * 60_000,
    durationMs: 47_000,
    taskCount: 5,
    taskSuccess: 5,
  }),
  makeExec({
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
    errorMessage: 'HTTP_500: Server error from billing API',
  }),
  makeExec({
    id: 'exec-004',
    workflowKey: 'webhook-handler',
    namespace: 'integration',
    revision: 2,
    state: 'SUCCESS',
    trigger: 'WEBHOOK',
    startedAgoMs: 26 * 60_000,
    durationMs: 1_200,
    taskCount: 2,
    taskSuccess: 2,
  }),
  makeExec({
    id: 'exec-005',
    workflowKey: 'data-cleanup',
    revision: 8,
    state: 'KILLED',
    startedAgoMs: 45 * 60_000,
    durationMs: 18_000,
    taskCount: 3,
    taskSuccess: 1,
    errorMessage: 'Killed by user',
  }),
  makeExec({
    id: 'exec-006',
    workflowKey: 'sync-customers',
    revision: 11,
    state: 'SUCCESS',
    trigger: 'SCHEDULE',
    startedAgoMs: 2 * 3_600_000,
    durationMs: 51_000,
    taskCount: 5,
    taskSuccess: 5,
  }),
  makeExec({
    id: 'exec-007',
    workflowKey: 'enrich-leads',
    namespace: 'sales',
    revision: 17,
    state: 'RUNNING',
    startedAgoMs: 95_000,
    durationMs: null,
    taskCount: 6,
    taskSuccess: 2,
  }),
  makeExec({
    id: 'exec-008',
    workflowKey: 'greet',
    revision: 3,
    state: 'CREATED',
    startedAgoMs: 1_500,
    durationMs: null,
    taskCount: 3,
    taskSuccess: 0,
  }),
  makeExec({
    id: 'exec-009',
    workflowKey: 'nightly-report',
    revision: 4,
    state: 'SUCCESS',
    trigger: 'SCHEDULE',
    startedAgoMs: 24 * 3_600_000,
    durationMs: 42_000,
    taskCount: 4,
    taskSuccess: 4,
  }),
  makeExec({
    id: 'exec-010',
    workflowKey: 'data-cleanup',
    revision: 7,
    state: 'FAILED',
    startedAgoMs: 3 * 86_400_000,
    durationMs: 22_000,
    taskCount: 3,
    taskSuccess: 1,
    taskFailed: 1,
    errorMessage: 'HTTP_TIMEOUT: Request timed out after PT30S',
  }),
];
