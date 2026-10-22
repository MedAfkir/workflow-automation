import { apiGet } from '@/shared/api/client';
import { DEMO_MODE } from '@/shared/lib/env';

import type { PluginDetail, PluginKind, PluginProperty, PluginSummary } from './types';

type WireKind = 'RUNNABLE' | 'FLOWABLE' | 'TRIGGER';

interface JsonSchemaNode {
  type?: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  format?: string;
  required?: string[];
  items?: JsonSchemaNode;
  properties?: Record<string, JsonSchemaNode>;
  'x-sensitive'?: boolean;
}

interface PluginDescriptorWire {
  id: string;
  version: string;
  description?: string;
  kind: WireKind;
  categories?: string[];
  deprecated?: boolean;
  replacedBy?: string | null;
  schema?: JsonSchemaNode;
}

function shortName(id: string): string {
  const parts = id.split('.');
  return parts[parts.length - 1] || id;
}

function adaptKind(kind: WireKind): PluginKind {
  return kind === 'TRIGGER' ? 'TRIGGER' : 'TASK';
}

function displayType(node: JsonSchemaNode): string {
  if (Array.isArray(node.enum)) return 'enum';
  switch (node.type) {
    case 'array':
      return 'list';
    case 'object':
      return 'map';
    case 'integer':
    case 'number':
      return 'integer';
    case 'boolean':
      return 'boolean';
    case 'string':
      return 'string';
    default:
      return 'any';
  }
}

function isTaskSpecArray(node: JsonSchemaNode): boolean {
  const item = node.type === 'array' ? node.items : undefined;
  const props = item?.properties;
  return !!props && 'id' in props && 'type' in props && 'config' in props;
}

function schemaToProperties(schema: JsonSchemaNode | undefined): PluginProperty[] {
  if (!schema?.properties) return [];
  const required = new Set(schema.required ?? []);
  return Object.entries(schema.properties).map(([name, node]) => ({
    name,
    type: isTaskSpecArray(node) ? 'task[]' : displayType(node),
    enumValues: Array.isArray(node.enum) ? node.enum.map((v) => String(v)) : null,
    required: required.has(name),
    defaultValue: node.default != null ? String(node.default) : null,
    description: node.description ?? '',
    format: node.format ?? null,
    sensitive: node['x-sensitive'] === true,
  }));
}

function adaptSummary(w: PluginDescriptorWire): PluginSummary {
  return {
    id: w.id,
    name: shortName(w.id),
    kind: adaptKind(w.kind),
    version: w.version,
    description: w.description ?? '',
    categories: w.categories ?? [],
    deprecated: w.deprecated ?? false,
    replacedBy: w.replacedBy ?? null,
  };
}

function adaptDetail(w: PluginDescriptorWire): PluginDetail {
  return {
    ...adaptSummary(w),
    properties: schemaToProperties(w.schema),
  };
}

export async function fetchPlugins(signal?: AbortSignal): Promise<PluginDetail[]> {
  if (DEMO_MODE) return (await import('@/mocks/plugins')).mockPluginDetails;
  const wire = await apiGet<PluginDescriptorWire[]>('/api/v1/plugins', {
    signal,
  });
  return (wire ?? []).map(adaptDetail);
}
