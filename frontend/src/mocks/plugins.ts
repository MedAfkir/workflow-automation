import type { PluginDetail, PluginProperty } from '@/features/plugins';

function p(
  name: string,
  type: string,
  required: boolean,
  extra: Partial<Omit<PluginProperty, 'name' | 'type' | 'required'>> = {},
): PluginProperty {
  return {
    name,
    type,
    required,
    enumValues: extra.enumValues ?? null,
    defaultValue: extra.defaultValue ?? null,
    description: extra.description ?? '',
    format: extra.format ?? null,
    sensitive: extra.sensitive ?? false,
  };
}

export const mockPluginDetails: PluginDetail[] = [
  {
    id: 'io.workflowplatform.builtin.Http',
    name: 'Http',
    kind: 'TASK',
    version: '1.0.0',
    description: 'Performs an HTTP request',
    categories: ['http', 'integration'],
    deprecated: false,
    replacedBy: null,
    properties: [
      p('url', 'string', true, {
        description: 'Target URL',
        format: 'url',
      }),
      p('method', 'enum', false, {
        defaultValue: 'GET',
        description: 'HTTP method',
        enumValues: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      }),
      p('headers', 'map', false, {
        description: 'HTTP headers',
      }),
      p('body', 'any', false, {
        description: 'Request body (object will be JSON-serialized, string sent as-is)',
      }),
      p('timeout', 'duration', false, {
        defaultValue: 'PT30S',
        description: 'Connect+request timeout (ISO-8601, e.g. PT30S)',
      }),
      p('allowFailureStatus', 'boolean', false, {
        defaultValue: 'false',
        description: "Treat 4xx as success (don't fail the task)",
      }),
      p('bearerToken', 'string', false, {
        description: 'Bearer token (sensitive, scrubbed from logs)',
        sensitive: true,
      }),
    ],
  },
  {
    id: 'io.workflowplatform.builtin.Log',
    name: 'Log',
    kind: 'TASK',
    version: '1.0.0',
    description: 'Logs a message at the configured level',
    categories: [],
    deprecated: false,
    replacedBy: null,
    properties: [
      p('message', 'string', true, {
        description: 'Message to log',
      }),
      p('level', 'enum', false, {
        defaultValue: 'INFO',
        description: 'Log level (TRACE, DEBUG, INFO, WARN, ERROR)',
        enumValues: ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'],
      }),
    ],
  },
  {
    id: 'io.workflowplatform.builtin.ForEach',
    name: 'ForEach',
    kind: 'TASK',
    version: '1.0.0',
    description: '',
    categories: [],
    deprecated: false,
    replacedBy: null,
    properties: [
      p('values', 'list', true, {
        description: 'List to iterate over',
      }),
      p('concurrency', 'integer', false, {
        defaultValue: '1',
        description: 'Max parallel iterations',
      }),
      p('tasks', 'task[]', true, {
        description: 'Tasks to execute per item',
      }),
    ],
  },
  {
    id: 'io.workflowplatform.builtin.If',
    name: 'If',
    kind: 'TASK',
    version: '1.0.0',
    description: 'Branches based on a boolean condition',
    categories: [],
    deprecated: false,
    replacedBy: null,
    properties: [
      p('condition', 'string', true, {
        description: 'Pebble expression evaluating to true/false',
      }),
      p('then', 'task[]', false, {
        description: 'Tasks to run if condition is true',
      }),
      p('else', 'task[]', false, {
        description: 'Tasks to run if condition is false',
      }),
    ],
  },
  {
    id: 'io.workflowplatform.builtin.Sleep',
    name: 'Sleep',
    kind: 'TASK',
    version: '1.0.0',
    description: 'Pauses execution for the configured duration',
    categories: [],
    deprecated: false,
    replacedBy: null,
    properties: [
      p('duration', 'duration', true, {
        description: 'Duration in ISO-8601 format (e.g. PT5S, PT2M)',
      }),
    ],
  },
  {
    id: 'io.workflowplatform.builtin.Wait',
    name: 'Wait',
    kind: 'TASK',
    version: '1.0.0',
    description:
      'Pauses the workflow execution for a duration. Execution is suspended and resumed later.',
    categories: ['orchestration'],
    deprecated: false,
    replacedBy: null,
    properties: [
      p('duration', 'duration', true, {
        description: 'Duration to wait (ISO-8601, e.g. PT1H, P1D)',
      }),
    ],
  },
  {
    id: 'io.workflowplatform.builtin.Schedule',
    name: 'Schedule',
    kind: 'TRIGGER',
    version: '1.0.0',
    description: 'Fires the workflow on a cron schedule',
    categories: ['trigger', 'schedule'],
    deprecated: false,
    replacedBy: null,
    properties: [
      p('cron', 'string', true, {
        description: 'Cron expression (Unix 5-field format)',
      }),
      p('timezone', 'string', false, {
        defaultValue: 'UTC',
        description: 'Timezone (default UTC)',
      }),
      p('inputs', 'map', false, {
        description: 'Inputs to pass to the workflow execution',
      }),
    ],
  },
  {
    id: 'io.workflowplatform.builtin.Webhook',
    name: 'Webhook',
    kind: 'TRIGGER',
    version: '1.0.0',
    description: 'Fires the workflow when a POST request is made to the webhook URL',
    categories: ['trigger', 'webhook'],
    deprecated: false,
    replacedBy: null,
    properties: [
      p('signatureSecret', 'string', false, {
        description:
          "Optional secret to verify request signature (HMAC-SHA256 of body in 'X-Workflow-Signature' header)",
      }),
      p('inputs', 'map', false, {
        description: 'Inputs are merged with the request payload (request takes precedence)',
      }),
    ],
  },
];
