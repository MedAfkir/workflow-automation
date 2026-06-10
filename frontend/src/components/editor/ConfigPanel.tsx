import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Settings2, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlugins } from '@/lib/api/plugins';
import { mockPlugins } from '@/lib/mockData';
import { pluginSchema } from '@/lib/editor/catalog';
import { branchesFor } from '@/lib/editor/flowables';
import type { Issue } from '@/lib/editor/validate';
import type { DraftTask } from '@/lib/editor/types';
import type { PluginProperty, PluginSummary } from '@/lib/types';
import { ConfigField } from './ConfigField';
import { glyphForType } from './glyphs';
import { useEditorStore } from './store';
interface ConfigPanelProps {
  issues: Issue[];
  showErrors: boolean;
}
export function ConfigPanel({
  issues,
  showErrors
}: ConfigPanelProps) {
  const tasks = useEditorStore(s => s.tasks);
  const selectedId = useEditorStore(s => s.selectedId);
  const task = tasks.find(t => t.id === selectedId) ?? null;
  return <aside className="flex w-[340px] shrink-0 flex-col overflow-y-auto border-l border-cmd-line bg-cmd-raised" aria-label="Task configuration">
      {task ? <TaskConfig key={task.id} task={task} allTasks={tasks} issues={issues} showErrors={showErrors} /> : <EmptyState />}
    </aside>;
}
function EmptyState() {
  return <div className="grid flex-1 place-items-center p-6">
      <div className="max-w-[16rem] text-center">
        <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md border border-cmd-line bg-cmd-surface">
          <Settings2 className="h-4 w-4 text-cmd-fg-mute" aria-hidden />
        </div>
        <p className="font-mono text-[12px] text-cmd-fg-dim">No task selected</p>
        <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-cmd-fg-mute">
          Select a node on the canvas to edit its id, dependencies, and
          configuration.
        </p>
      </div>
    </div>;
}
function TaskConfig({
  task,
  allTasks,
  issues,
  showErrors
}: {
  task: DraftTask;
  allTasks: DraftTask[];
  issues: Issue[];
  showErrors: boolean;
}) {
  const renameTask = useEditorStore(s => s.renameTask);
  const setConfigValue = useEditorStore(s => s.setConfigValue);
  const removeTask = useEditorStore(s => s.removeTask);
  const connect = useEditorStore(s => s.connect);
  const disconnect = useEditorStore(s => s.disconnect);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  useEffect(() => setTouched(new Set()), [task.id]);
  const schema = pluginSchema(task.type);
  const branches = branchesFor(task.type);
  const fields = schema ? schema.properties.filter(p => p.type !== 'task[]') : [];
  const taskIssues = issues.filter(i => i.taskId === task.id);
  const errorFor = (name: string) => {
    if (!touched.has(name) && !showErrors) return undefined;
    return taskIssues.find(i => i.field === name)?.message;
  };
  const markTouched = (name: string) => setTouched(prev => new Set(prev).add(name));
  const Icon = glyphForType(task.type);
  const candidates = allTasks.filter(t => t.id !== task.id && !task.dependsOn.includes(t.id));
  return <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-cmd-line px-4">
        <Icon className="h-3.5 w-3.5 shrink-0 text-cmd-fg-mute" aria-hidden />
        <span className="truncate font-mono text-[12px] font-semibold text-cmd-fg">
          {task.type.split('.').pop()}
        </span>
        <Link to={`/plugins/${task.type}`} title="Open plugin reference" className="ml-auto rounded p-0.5 text-cmd-fg-mute outline-none transition-colors hover:text-cmd-fg-dim focus-visible:ring-2 focus-visible:ring-cmd-accent" aria-label="Open plugin reference">
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <div className="flex flex-col gap-5 px-4 py-4">
        {}
        <Field label="Task id" htmlFor="cfg-task-id" error={errorFor('id')}>
          <input id="cfg-task-id" type="text" spellCheck={false} value={task.id} onChange={e => renameTask(task.id, e.target.value)} onBlur={() => markTouched('id')} className={cn('w-full rounded-md border bg-cmd-bg px-2.5 py-1.5 font-mono text-[12px] text-cmd-fg outline-none', errorFor('id') ? 'border-run-failed' : 'border-cmd-line focus:border-cmd-accent-dim')} />
        </Field>

        <div className="font-mono text-[10px] leading-relaxed text-cmd-fg-mute">
          {task.type}
        </div>

        {}
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] text-cmd-fg-dim">Depends on</span>
          {task.dependsOn.length === 0 ? <p className="font-mono text-[10px] leading-relaxed text-cmd-fg-mute">
              Runs after the previous task by default. Add explicit
              dependencies to fan in.
            </p> : <div className="flex flex-wrap gap-1.5">
              {task.dependsOn.map(dep => <span key={dep} className="inline-flex items-center gap-1 rounded border border-cmd-line bg-cmd-surface px-1.5 py-0.5 font-mono text-[11px] text-cmd-fg-dim">
                  {dep}
                  <button type="button" onClick={() => disconnect(dep, task.id)} aria-label={`Remove dependency on ${dep}`} className="text-cmd-fg-mute outline-none hover:text-run-failed focus-visible:text-run-failed">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>)}
            </div>}
          {candidates.length > 0 && <select value="" onChange={e => {
          if (e.target.value) connect(e.target.value, task.id);
        }} aria-label="Add a dependency" className="mt-0.5 w-full cursor-pointer rounded-md border border-cmd-line bg-cmd-bg px-2 py-1 font-mono text-[11px] text-cmd-fg-dim outline-none focus:border-cmd-accent-dim">
              <option value="">+ depends on...</option>
              {candidates.map(t => <option key={t.id} value={t.id}>
                  {t.id}
                </option>)}
            </select>}
        </div>

        {}
        {fields.length > 0 && <div className="flex flex-col gap-4 border-t border-cmd-line pt-4">
            {fields.map(p => <ConfigField key={p.name} prop={p} value={task.config[p.name]} onChange={v => setConfigValue(task.id, p.name, v)} onBlur={() => markTouched(p.name)} error={errorFor(p.name)} />)}
          </div>}

        {!schema && <p className="border-t border-cmd-line pt-4 font-mono text-[11px] leading-relaxed text-cmd-fg-mute">
            No config schema for this plugin. Switch to YAML to edit it
            directly.
          </p>}

        {}
        {branches.map(branch => <BranchEditor key={branch} parentId={task.id} branch={branch} kids={task.children[branch] ?? []} />)}

        <button type="button" onClick={() => removeTask(task.id)} className={cn('mt-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-cmd-line bg-cmd-fail-wash px-3 py-1.5', 'font-mono text-[12px] text-run-failed outline-none transition-[filter]', 'hover:brightness-125 focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Delete task
        </button>
      </div>
    </div>;
}
function BranchEditor({
  parentId,
  branch,
  kids
}: {
  parentId: string;
  branch: string;
  kids: DraftTask[];
}) {
  const addChild = useEditorStore(s => s.addChild);
  const {
    data
  } = usePlugins();
  const source = data && data.length > 0 ? data : mockPlugins;
  const taskPlugins = source.filter((p): p is PluginSummary => p.kind === 'TASK');
  return <section className="flex flex-col gap-2 border-t border-cmd-line pt-4">
      <div className="flex items-center gap-2">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-cmd-fg-mute">
          {branch} branch
        </h3>
        <span className="font-mono text-[10px] tabular-nums text-cmd-fg-mute">
          {kids.length}
        </span>
      </div>

      {kids.length === 0 ? <p className="font-mono text-[10px] leading-relaxed text-cmd-fg-mute">
          No tasks yet. Add the steps to run in this branch.
        </p> : <ul className="flex flex-col gap-2">
          {kids.map(child => <ChildEditor key={child.id} parentId={parentId} branch={branch} child={child} />)}
        </ul>}

      <select value="" onChange={e => {
      if (e.target.value) addChild(parentId, branch, e.target.value);
    }} aria-label={`Add a task to the ${branch} branch`} className="w-full cursor-pointer rounded-md border border-cmd-line bg-cmd-bg px-2 py-1 font-mono text-[11px] text-cmd-fg-dim outline-none focus:border-cmd-accent-dim">
        <option value="">+ add task...</option>
        {taskPlugins.map(p => <option key={p.id} value={p.id}>
            {p.name}
          </option>)}
      </select>
    </section>;
}
function ChildEditor({
  parentId,
  branch,
  child
}: {
  parentId: string;
  branch: string;
  child: DraftTask;
}) {
  const renameChild = useEditorStore(s => s.renameChild);
  const removeChild = useEditorStore(s => s.removeChild);
  const setChildConfigValue = useEditorStore(s => s.setChildConfigValue);
  const schema = pluginSchema(child.type);
  const fields: PluginProperty[] = schema ? schema.properties.filter(p => p.type !== 'task[]') : [];
  const Icon = glyphForType(child.type);
  return <li className="rounded-md border border-cmd-line bg-cmd-bg p-2.5">
      <div className="flex items-center gap-2">
        <Icon className="h-3 w-3 shrink-0 text-cmd-fg-mute" aria-hidden />
        <input type="text" value={child.id} spellCheck={false} onChange={e => renameChild(parentId, branch, child.id, e.target.value)} aria-label="Child task id" className="min-w-0 flex-1 rounded border border-cmd-line bg-cmd-surface px-1.5 py-0.5 font-mono text-[11px] text-cmd-fg outline-none focus:border-cmd-accent-dim" />
        <span className="shrink-0 font-mono text-[10px] text-cmd-fg-mute">
          {child.type.split('.').pop()}
        </span>
        <button type="button" onClick={() => removeChild(parentId, branch, child.id)} aria-label={`Remove ${child.id}`} className="rounded p-0.5 text-cmd-fg-mute outline-none hover:text-run-failed focus-visible:ring-2 focus-visible:ring-cmd-accent">
          <X className="h-3 w-3" />
        </button>
      </div>

      {fields.length > 0 && <div className="mt-2.5 flex flex-col gap-3 border-t border-cmd-line pt-2.5">
          {fields.map(p => <ConfigField key={p.name} prop={p} value={child.config[p.name]} onChange={v => setChildConfigValue(parentId, branch, child.id, p.name, v)} onBlur={() => {}} />)}
        </div>}
    </li>;
}
function Field({
  label,
  htmlFor,
  error,
  children
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="font-mono text-[11px] text-cmd-fg-dim">
        {label}
      </label>
      {children}
      {error && <p className="font-mono text-[10px] leading-relaxed text-run-failed">
          {error}
        </p>}
    </div>;
}
