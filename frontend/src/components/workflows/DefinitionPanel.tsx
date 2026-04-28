import { useMemo, useState } from 'react';
import { Check, Copy, GitBranch, FileCode2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowTask } from '@/lib/types';
import { WorkflowDagCanvas } from './WorkflowDagCanvas';
export type DefinitionView = 'graph' | 'yaml';
interface DefinitionPanelProps {
  tasks: WorkflowTask[];
  sourceYaml: string;
  view: DefinitionView;
  onViewChange: (view: DefinitionView) => void;
}
export function DefinitionPanel({
  tasks,
  sourceYaml,
  view,
  onViewChange
}: DefinitionPanelProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  return <section className="flex min-h-0 flex-1 flex-col" aria-label="Definition">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-cmd-line bg-cmd-raised px-4">
        <Segmented view={view} onViewChange={onViewChange} taskCount={tasks.length} />
        <div className="flex items-center gap-3">
          {view === 'yaml' && <CopyYaml sourceYaml={sourceYaml} />}
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-cmd-fg-mute">
            read-only
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {view === 'graph' ? <WorkflowDagCanvas tasks={tasks} selectedTaskId={selectedTaskId} onSelectTask={setSelectedTaskId} /> : <YamlView sourceYaml={sourceYaml} />}
      </div>
    </section>;
}
function Segmented({
  view,
  onViewChange,
  taskCount
}: {
  view: DefinitionView;
  onViewChange: (view: DefinitionView) => void;
  taskCount: number;
}) {
  const tabs: {
    value: DefinitionView;
    label: string;
    icon: typeof GitBranch;
    kbd: string;
  }[] = [{
    value: 'graph',
    label: 'Graph',
    icon: GitBranch,
    kbd: 'G'
  }, {
    value: 'yaml',
    label: 'YAML',
    icon: FileCode2,
    kbd: 'Y'
  }];
  return <div role="tablist" aria-label="Definition view" className="flex items-center gap-1">
      {tabs.map(({
      value,
      label,
      icon: Icon,
      kbd
    }) => {
      const active = view === value;
      return <button key={value} type="button" role="tab" aria-selected={active} onClick={() => onViewChange(value)} className={cn('inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1', 'font-mono text-[11px] outline-none transition-colors', 'focus-visible:ring-2 focus-visible:ring-cmd-accent', active ? 'border-cmd-accent-dim bg-cmd-sel text-cmd-accent' : 'border-cmd-line text-cmd-fg-mute hover:bg-cmd-hover hover:text-cmd-fg-dim')}>
            <Icon className="h-3 w-3" aria-hidden />
            {label}
            {value === 'graph' && <span className="text-cmd-fg-mute">- {taskCount}</span>}
            <kbd className="ml-0.5 rounded border border-cmd-line px-1 text-[10px] text-cmd-fg-mute" aria-hidden>
              {kbd}
            </kbd>
          </button>;
    })}
    </div>;
}
function CopyYaml({
  sourceYaml
}: {
  sourceYaml: string;
}) {
  const [copied, setCopied] = useState(false);
  return <button type="button" onClick={async () => {
    await navigator.clipboard.writeText(sourceYaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }} className={cn('inline-flex items-center gap-1.5 rounded-md border border-cmd-line px-2 py-0.5', 'font-mono text-[11px] text-cmd-fg-mute outline-none transition-colors', 'hover:bg-cmd-hover hover:text-cmd-fg', 'focus-visible:ring-2 focus-visible:ring-cmd-accent')} aria-label="Copy YAML source">
      {copied ? <Check className="h-3 w-3 text-run-success" aria-hidden /> : <Copy className="h-3 w-3" aria-hidden />}
      {copied ? 'Copied' : 'Copy'}
    </button>;
}
function YamlView({
  sourceYaml
}: {
  sourceYaml: string;
}) {
  const lines = useMemo(() => sourceYaml.replace(/\n$/, '').split('\n'), [sourceYaml]);
  return <div className="h-full overflow-auto bg-cmd-bg">
      <pre className="py-4 font-mono text-[12px] leading-relaxed">
        <code className="grid grid-cols-[auto_1fr]">
          {lines.map((line, i) => <span key={i} className="contents">
              <span className="select-none border-r border-cmd-line px-3 text-right tabular-nums text-cmd-fg-mute" aria-hidden>
                {i + 1}
              </span>
              <span className="whitespace-pre px-4 text-cmd-fg-dim">
                {line || ' '}
              </span>
            </span>)}
        </code>
      </pre>
    </div>;
}
