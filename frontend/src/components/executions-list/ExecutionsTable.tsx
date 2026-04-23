import { useCallback, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExecutionSummary } from '@/lib/types';
import { ExecutionRow } from './ExecutionRow';
import { ROW_GRID } from './grid';
interface ExecutionsTableProps {
  executions: ExecutionSummary[];
  hasAnyExecutions: boolean;
  isFiltered: boolean;
  onClearFilters: () => void;
}
export function ExecutionsTable({
  executions,
  hasAnyExecutions,
  isFiltered,
  onClearFilters
}: ExecutionsTableProps) {
  const rowRefs = useRef(new Map<string, HTMLAnchorElement>());
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeValid = activeId != null && executions.some(e => e.id === activeId);
  const rovingId = activeValid ? activeId : executions[0]?.id ?? null;
  const move = useCallback((delta: number) => {
    if (executions.length === 0) return;
    const ids = executions.map(e => e.id);
    const current = activeValid ? ids.indexOf(activeId!) : -1;
    const next = Math.max(0, Math.min(ids.length - 1, (current < 0 ? 0 : current) + delta));
    const id = ids[next];
    setActiveId(id);
    const el = rowRefs.current.get(id);
    el?.focus();
    el?.scrollIntoView({
      block: 'nearest'
    });
  }, [executions, activeValid, activeId]);
  const onKeyDown = useCallback((e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(-1);
    }
  }, [move]);
  if (executions.length === 0) {
    return hasAnyExecutions && isFiltered ? <FilteredEmpty onClearFilters={onClearFilters} /> : <FirstRun />;
  }
  return <div className="flex-1 overflow-auto bg-cmd-surface" onKeyDown={onKeyDown} aria-label="Executions">
      {}
      <div className={cn('sticky top-0 z-10 grid items-center gap-4 px-6 py-2', ROW_GRID, 'bg-cmd-raised border-b border-cmd-line-strong', 'font-mono text-[10px] uppercase tracking-[0.12em] text-cmd-fg-mute')}>
        <div>Status</div>
        <div>Workflow</div>
        <div>Trigger</div>
        <div>Started</div>
        <div>Duration</div>
        <div aria-hidden />
      </div>

      {}
      <div>
        {executions.map(e => <ExecutionRow key={e.id} execution={e} active={e.id === activeId} tabIndex={e.id === rovingId ? 0 : -1} onFocus={() => setActiveId(e.id)} ref={el => {
        if (el) rowRefs.current.set(e.id, el);else rowRefs.current.delete(e.id);
      }} />)}
      </div>
    </div>;
}
function FirstRun() {
  return <div className="flex flex-1 items-center justify-center bg-cmd-surface p-12">
      <div className="max-w-sm text-center">
        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md border border-cmd-line bg-cmd-raised">
          <Terminal className="h-4 w-4 text-cmd-accent" aria-hidden />
        </div>
        <div className="font-mono text-[13px] text-cmd-fg">
          No executions yet
        </div>
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-cmd-fg-mute">
          Runs appear here the moment a workflow fires. Trigger one from
          the CLI:
        </p>
        <code className="mt-3 inline-block rounded-md border border-cmd-line bg-cmd-bg px-3 py-1.5 font-mono text-[11px] text-cmd-fg-dim">
          wf run &lt;namespace&gt;/&lt;workflow&gt;
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
          No runs match these filters
        </div>
        <button type="button" onClick={onClearFilters} className={cn('mt-3 rounded-md border border-cmd-line px-3 py-1 font-mono text-[11px]', 'text-cmd-fg-dim outline-none transition-colors', 'hover:bg-cmd-hover hover:text-cmd-fg', 'focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
          Clear filters
        </button>
      </div>
    </div>;
}
