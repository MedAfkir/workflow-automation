import { stringify } from 'yaml';
import type { DraftSnapshot, DraftTask } from './types';
function isEmpty(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') return Object.keys(v as object).length === 0;
  return false;
}
function pruneConfig(config: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config)) {
    if (!isEmpty(v)) out[k] = v;
  }
  return out;
}
function toYamlTask(t: DraftTask): Record<string, unknown> {
  const out: Record<string, unknown> = {
    id: t.id,
    type: t.type
  };
  if (t.dependsOn.length > 0) out.dependsOn = [...t.dependsOn];
  const config = pruneConfig(t.config);
  for (const [branch, kids] of Object.entries(t.children)) {
    if (kids.length > 0) config[branch] = kids.map(toYamlTask);
  }
  if (Object.keys(config).length > 0) out.config = config;
  return out;
}
export function serializeWorkflow(draft: DraftSnapshot): string {
  const obj: Record<string, unknown> = {
    namespace: draft.namespace,
    key: draft.key
  };
  if (draft.tasks.length > 0) obj.tasks = draft.tasks.map(toYamlTask);
  return stringify(obj, {
    lineWidth: 0
  });
}
