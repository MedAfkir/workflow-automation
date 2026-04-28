import { forwardRef, useCallback, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, GitBranch, PauseCircle, Power } from 'lucide-react';
import { cn, relativeTime } from '@/lib/utils';
import type { WorkflowSummary } from '@/lib/types';
import { WF_ROW_GRID } from './grid';
interface WorkflowsTableProps {
  workflows: WorkflowSummary[];
  hasAny: boolean;
  isFiltered: boolean;
  onClearFilters: () => void;
}
export function WorkflowsTable({
  workflows,
  hasAny,
  isFiltered,
  onClearFilters
}: WorkflowsTableProps) {
  const rowRefs = useRef(new Map<string, HTMLAnchorElement>());
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeValid = activeId != null && workflows.some(w => w.id === activeId);
  const rovingId = activeValid ? activeId : workflows[0]?.id ?? null;
  const move = useCallback((delta: number) => {
    if (workflows.length === 0) return;
    const ids = workflows.map(w => w.id);
    const current = activeValid ? ids.indexOf(activeId!) : -1;
    const next = Math.max(0, Math.min(ids.length - 1, (current < 0 ? 0 : current) + delta));
    const id = ids[next];
    setActiveId(id);
    const el = rowRefs.current.get(id);
    el?.focus();
    el?.scrollIntoView({
      block: 'nearest'
    });
  }, [workflows, activeValid, activeId]);
  const onKeyDown = useCallback((e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(-1);
    }
  }, [move]);
  if (workflows.length === 0) {
    return hasAny && isFiltered ? <FilteredEmpty onClearFilters={onClearFilters} /> : <FirstRun />;
  }
  return <div className="flex-1 overflow-auto bg-cmd-surface" onKeyDown={onKeyDown} aria-label="Workflows">
      <div className={cn('sticky top-0 z-10 grid items-center gap-4 px-6 py-2', WF_ROW_GRID, 'border-b border-cmd-line-strong bg-cmd-raised', 'font-mono text-[10px] uppercase tracking-[0.12em] text-cmd-fg-mute')}>
        <div>State</div>
        <div>Workflow</div>
        <div>Triggers</div>
        <div>Revision</div>
        <div>Updated</div>
        <div aria-hidden />
      </div>

      <div>
        {workflows.map(w => <WorkflowRow key={w.id} workflow={w} active={w.id === activeId} tabIndex={w.id === rovingId ? 0 : -1} onFocus={() => setActiveId(w.id)} ref={el => {
        if (el) rowRefs.current.set(w.id, el);else rowRefs.current.delete(w.id);
      }} />)}
      </div>
    </div>;
}
interface WorkflowRowProps {
  workflow: WorkflowSummary;
  active: boolean;
  tabIndex: number;
  onFocus: () => void;
}
const WorkflowRow = forwardRef<HTMLAnchorElement, WorkflowRowProps>(function WorkflowRow({
  workflow,
  active,
  tabIndex,
  onFocus
}, ref) {
  return <Link ref={ref} to={`/workflows/${workflow.id}`} tabIndex={tabIndex} onFocus={onFocus} aria-label={`${workflow.namespace}/${workflow.key}, ${workflow.enabled ? 'enabled' : 'disabled'}, revision ${workflow.currentRevision}`} className={cn('group grid items-center gap-4 px-6 py-2.5', WF_ROW_GRID, 'border-b border-cmd-line outline-none transition-colors', 'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cmd-accent', active ? 'bg-cmd-sel' : 'hover:bg-cmd-hover')}>
        <EnabledTag enabled={workflow.enabled} />

        <div className="min-w-0">
          <div className="truncate font-mono text-[13px] font-medium text-cmd-fg">
            {workflow.key}
          </div>
          <div className="mt-0.5 truncate font-mono text-[11px] text-cmd-fg-mute">
            {workflow.namespace}
          </div>
        </div>

        <div className="font-mono text-[11px] tabular-nums text-cmd-fg-dim">
          {workflow.triggerCount > 0 ? workflow.triggerCount : <span className="text-cmd-fg-mute">-</span>}
        </div>

        <div className="font-mono text-[11px] tabular-nums text-cmd-fg-dim">
          rev {workflow.currentRevision}
        </div>

        <div className="font-mono text-[11px] tabular-nums text-cmd-fg-dim" title={workflow.updatedAt}>
          {relativeTime(workflow.updatedAt)}
        </div>

        <ChevronRight className={cn('h-3.5 w-3.5 text-cmd-fg-mute transition-opacity', 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100')} aria-hidden />
      </Link>;
});
function EnabledTag({
  enabled
}: {
  enabled: boolean;
}) {
  return <span className={cn('inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.04em]', enabled ? 'text-cmd-fg-dim' : 'text-cmd-fg-mute')}>
      {enabled ? <Power className="h-[13px] w-[13px] shrink-0" aria-hidden /> : <PauseCircle className="h-[13px] w-[13px] shrink-0" aria-hidden />}
      {enabled ? 'enabled' : 'disabled'}
    </span>;
}
function FirstRun() {
  return <div className="flex flex-1 items-center justify-center bg-cmd-surface p-12">
      <div className="max-w-sm text-center">
        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md border border-cmd-line bg-cmd-raised">
          <GitBranch className="h-4 w-4 text-cmd-accent" aria-hidden />
        </div>
        <div className="font-mono text-[13px] text-cmd-fg">
          No workflows yet
        </div>
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-cmd-fg-mute">
          Define one in YAML and apply it from the CLI:
        </p>
        <code className="mt-3 inline-block rounded-md border border-cmd-line bg-cmd-bg px-3 py-1.5 font-mono text-[11px] text-cmd-fg-dim">
          wf apply &lt;file&gt;.yaml
        </code>
      </div>
    </div>;
}
function FilteredEmpty({
  onClearFilters
}: {
  onClearFilters: () => void;
}) {
  return <div className="flex flex-1 items-center justify-center bg-cmd-surface p-12">
      <div className="text-center">
        <div className="font-mono text-[13px] text-cmd-fg-dim">
          No workflows match these filters
        </div>
        <button type="button" onClick={onClearFilters} className={cn('mt-3 rounded-md border border-cmd-line px-3 py-1 font-mono text-[11px]', 'text-cmd-fg-dim outline-none transition-colors', 'hover:bg-cmd-hover hover:text-cmd-fg', 'focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
          Clear filters
        </button>
      </div>
    </div>;
}
