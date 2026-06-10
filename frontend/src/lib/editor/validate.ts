import { pluginSchema } from './catalog';
import { branchesFor } from './flowables';
import type { DraftSnapshot, DraftTask } from './types';
export interface Issue {
  level: 'error' | 'warn';
  message: string;
  taskId?: string;
  field?: string;
}
const KEY_RE = /^[a-z][a-z0-9-]*$/;
const ID_RE = /^[a-zA-Z_][a-zA-Z0-9_-]*$/;
function isBlank(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') return Object.keys(v as object).length === 0;
  return false;
}
export function missingRequired(task: DraftTask): string[] {
  const schema = pluginSchema(task.type);
  if (!schema) return [];
  const missing: string[] = [];
  for (const p of schema.properties) {
    if (!p.required) continue;
    if (p.type === 'task[]') {
      if ((task.children[p.name]?.length ?? 0) === 0) missing.push(p.name);
    } else if (isBlank(task.config[p.name])) {
      missing.push(p.name);
    }
  }
  return missing;
}
function findCycle(tasks: DraftTask[]): boolean {
  const ids = new Set(tasks.map(t => t.id));
  const adj = new Map<string, string[]>();
  for (const t of tasks) {
    adj.set(t.id, t.dependsOn.filter(d => ids.has(d)));
  }
  const state = new Map<string, 0 | 1 | 2>();
  const visit = (id: string): boolean => {
    if (state.get(id) === 1) return true;
    if (state.get(id) === 2) return false;
    state.set(id, 1);
    for (const dep of adj.get(id) ?? []) if (visit(dep)) return true;
    state.set(id, 2);
    return false;
  };
  for (const t of tasks) if (visit(t.id)) return true;
  return false;
}
export function validate(draft: DraftSnapshot): Issue[] {
  const issues: Issue[] = [];
  if (isBlank(draft.namespace)) {
    issues.push({
      level: 'error',
      message: 'Add a namespace.',
      field: 'namespace'
    });
  }
  if (isBlank(draft.key)) {
    issues.push({
      level: 'error',
      message: 'Add a key.',
      field: 'key'
    });
  } else if (!KEY_RE.test(draft.key)) {
    issues.push({
      level: 'error',
      field: 'key',
      message: 'Key needs to be lowercase letters, digits, or hyphens. Example: sync-customers'
    });
  }
  if (draft.tasks.length === 0) {
    issues.push({
      level: 'error',
      message: 'Add at least one task to run.'
    });
    return issues;
  }
  const ids = draft.tasks.map(t => t.id);
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) dupes.add(id);
    seen.add(id);
  }
  for (const t of draft.tasks) {
    if (isBlank(t.id)) {
      issues.push({
        level: 'error',
        taskId: t.id,
        field: 'id',
        message: 'Give this task an id.'
      });
    } else if (!ID_RE.test(t.id)) {
      issues.push({
        level: 'error',
        taskId: t.id,
        field: 'id',
        message: `Task id "${t.id}" needs to start with a letter and use letters, digits, _ or -.`
      });
    }
    if (dupes.has(t.id)) {
      issues.push({
        level: 'error',
        taskId: t.id,
        field: 'id',
        message: `Task id "${t.id}" is used more than once.`
      });
    }
    for (const dep of t.dependsOn) {
      if (dep === t.id) {
        issues.push({
          level: 'error',
          taskId: t.id,
          message: `Task "${t.id}" depends on itself.`
        });
      } else if (!seen.has(dep)) {
        issues.push({
          level: 'error',
          taskId: t.id,
          message: `Task "${t.id}" depends on "${dep}", which doesn't exist.`
        });
      }
    }
    for (const name of missingRequired(t)) {
      const branch = branchesFor(t.type).includes(name);
      issues.push({
        level: 'error',
        taskId: t.id,
        field: name,
        message: branch ? `"${t.id}" needs at least one task in its ${name} branch.` : `"${t.id}" is missing required config: ${name}.`
      });
    }
    for (const [branch, kids] of Object.entries(t.children)) {
      const childIds = new Set<string>();
      for (const child of kids) {
        const label = child.id || 'a task';
        if (isBlank(child.id) || !ID_RE.test(child.id)) {
          issues.push({
            level: 'error',
            taskId: t.id,
            message: `A task in "${t.id}" -> ${branch} needs a valid id.`
          });
        } else if (childIds.has(child.id)) {
          issues.push({
            level: 'error',
            taskId: t.id,
            message: `Duplicate task id "${child.id}" inside "${t.id}" -> ${branch}.`
          });
        }
        childIds.add(child.id);
        for (const name of missingRequired(child)) {
          issues.push({
            level: 'error',
            taskId: t.id,
            message: `"${label}" in ${branch} is missing required config: ${name}.`
          });
        }
      }
    }
  }
  if (findCycle(draft.tasks)) {
    issues.push({
      level: 'error',
      message: 'Tasks form a dependency cycle. Break the loop to continue.'
    });
  }
  return issues;
}
export function invalidTaskIds(issues: Issue[]): Set<string> {
  const out = new Set<string>();
  for (const i of issues) if (i.level === 'error' && i.taskId) out.add(i.taskId);
  return out;
}
