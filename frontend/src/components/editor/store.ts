import { create } from 'zustand';
import { pluginSchema } from '@/lib/editor/catalog';
import { branchesFor } from '@/lib/editor/flowables';
import type { EditorView, DraftSnapshot, DraftTask } from '@/lib/editor/types';
import type { PluginProperty } from '@/lib/types';
function coerceDefault(p: PluginProperty): unknown {
  const d = p.defaultValue;
  if (d == null) return undefined;
  if (p.type === 'boolean') return d === 'true';
  if (p.type === 'integer' || p.type === 'number') {
    const n = Number(d);
    return Number.isFinite(n) ? n : d;
  }
  return d;
}
function uniqueId(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}_${n}`)) n += 1;
  return `${base}_${n}`;
}
function makeTask(type: string, taken: Set<string>): DraftTask {
  const leaf = (type.split('.').pop() ?? 'task').toLowerCase();
  const id = uniqueId(leaf, taken);
  const config: Record<string, unknown> = {};
  const schema = pluginSchema(type);
  if (schema) {
    for (const p of schema.properties) {
      if (p.type === 'task[]') continue;
      const dv = coerceDefault(p);
      if (dv !== undefined) config[p.name] = dv;
    }
  }
  const children: Record<string, DraftTask[]> = {};
  for (const b of branchesFor(type)) children[b] = [];
  return {
    id,
    type,
    dependsOn: [],
    config,
    children
  };
}
function mapBranch(tasks: DraftTask[], parentId: string, branch: string, fn: (kids: DraftTask[]) => DraftTask[]): DraftTask[] {
  return tasks.map(t => t.id === parentId ? {
    ...t,
    children: {
      ...t.children,
      [branch]: fn(t.children[branch] ?? [])
    }
  } : t);
}
interface EditorState extends DraftSnapshot {
  selectedId: string | null;
  view: EditorView;
  dirty: boolean;
  setNamespace: (v: string) => void;
  setKey: (v: string) => void;
  setView: (v: EditorView) => void;
  select: (id: string | null) => void;
  addTask: (type: string) => void;
  removeTask: (id: string) => void;
  renameTask: (id: string, newId: string) => void;
  setConfigValue: (id: string, name: string, value: unknown) => void;
  connect: (source: string, target: string) => void;
  disconnect: (source: string, target: string) => void;
  addChild: (parentId: string, branch: string, type: string) => void;
  removeChild: (parentId: string, branch: string, childId: string) => void;
  renameChild: (parentId: string, branch: string, childId: string, newId: string) => void;
  setChildConfigValue: (parentId: string, branch: string, childId: string, name: string, value: unknown) => void;
  hydrate: (snapshot: DraftSnapshot) => void;
  reset: () => void;
}
const INITIAL: DraftSnapshot & {
  selectedId: null;
  view: EditorView;
  dirty: false;
} = {
  namespace: '',
  key: '',
  tasks: [],
  selectedId: null,
  view: 'canvas',
  dirty: false
};
export const useEditorStore = create<EditorState>(set => ({
  ...INITIAL,
  setNamespace: v => set({
    namespace: v,
    dirty: true
  }),
  setKey: v => set({
    key: v,
    dirty: true
  }),
  setView: v => set({
    view: v
  }),
  select: id => set({
    selectedId: id
  }),
  addTask: type => set(s => {
    const task = makeTask(type, new Set(s.tasks.map(t => t.id)));
    return {
      tasks: [...s.tasks, task],
      selectedId: task.id,
      dirty: true
    };
  }),
  removeTask: id => set(s => ({
    tasks: s.tasks.filter(t => t.id !== id).map(t => t.dependsOn.includes(id) ? {
      ...t,
      dependsOn: t.dependsOn.filter(d => d !== id)
    } : t),
    selectedId: s.selectedId === id ? null : s.selectedId,
    dirty: true
  })),
  renameTask: (id, newId) => set(s => ({
    tasks: s.tasks.map(t => {
      if (t.id === id) return {
        ...t,
        id: newId
      };
      if (t.dependsOn.includes(id)) {
        return {
          ...t,
          dependsOn: t.dependsOn.map(d => d === id ? newId : d)
        };
      }
      return t;
    }),
    selectedId: s.selectedId === id ? newId : s.selectedId,
    dirty: true
  })),
  setConfigValue: (id, name, value) => set(s => ({
    tasks: s.tasks.map(t => t.id === id ? {
      ...t,
      config: {
        ...t.config,
        [name]: value
      }
    } : t),
    dirty: true
  })),
  connect: (source, target) => set(s => {
    const exists = s.tasks.some(t => t.id === source);
    if (!exists || source === target) return s;
    return {
      tasks: s.tasks.map(t => t.id === target && !t.dependsOn.includes(source) ? {
        ...t,
        dependsOn: [...t.dependsOn, source]
      } : t),
      dirty: true
    };
  }),
  disconnect: (source, target) => set(s => ({
    tasks: s.tasks.map(t => t.id === target ? {
      ...t,
      dependsOn: t.dependsOn.filter(d => d !== source)
    } : t),
    dirty: true
  })),
  addChild: (parentId, branch, type) => set(s => ({
    tasks: mapBranch(s.tasks, parentId, branch, kids => [...kids, makeTask(type, new Set(kids.map(k => k.id)))]),
    dirty: true
  })),
  removeChild: (parentId, branch, childId) => set(s => ({
    tasks: mapBranch(s.tasks, parentId, branch, kids => kids.filter(k => k.id !== childId)),
    dirty: true
  })),
  renameChild: (parentId, branch, childId, newId) => set(s => ({
    tasks: mapBranch(s.tasks, parentId, branch, kids => kids.map(k => k.id === childId ? {
      ...k,
      id: newId
    } : k)),
    dirty: true
  })),
  setChildConfigValue: (parentId, branch, childId, name, value) => set(s => ({
    tasks: mapBranch(s.tasks, parentId, branch, kids => kids.map(k => k.id === childId ? {
      ...k,
      config: {
        ...k.config,
        [name]: value
      }
    } : k)),
    dirty: true
  })),
  hydrate: snapshot => set({
    namespace: snapshot.namespace,
    key: snapshot.key,
    tasks: snapshot.tasks,
    selectedId: null,
    dirty: false
  }),
  reset: () => set({
    ...INITIAL
  })
}));
