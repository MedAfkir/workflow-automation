import { useCallback, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExecutions } from '@/lib/api/executions';
import { mockExecutions } from '@/lib/mockData';
import type { ExecutionSummary, WorkflowDetail } from '@/lib/types';
import { ExecutionRow } from '@/components/executions-list/ExecutionRow';
import { ROW_GRID } from '@/components/executions-list/grid';
interface RecentRunsProps {
  workflow: WorkflowDetail;
  onRun: () => void;
}
const VISIBLE_LIMIT = 8;
export function RecentRuns({
  workflow,
  onRun
}: RecentRunsProps) {
  const {
    data,
    isLoading,
    isError
  } = useExecutions({
    limit: 50
  });
  const runs = useMemo(() => {
    const source: ExecutionSummary[] = isError ? mockExecutions : data ?? [];
    return source.filter(e => e.workflowKey === workflow.key && e.workflowNamespace === workflow.namespace).slice(0, VISIBLE_LIMIT);
  }, [data, isError, workflow.key, workflow.namespace]);
  const rowRefs = useRef(new Map<string, HTMLAnchorElement>());
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeValid = activeId != null && runs.some(e => e.id === activeId);
  const rovingId = activeValid ? activeId : runs[0]?.id ?? null;
  const move = useCallback((delta: number) => {
    if (runs.length === 0) return;
    const ids = runs.map(e => e.id);
    const current = activeValid ? ids.indexOf(activeId!) : -1;
    const next = Math.max(0, Math.min(ids.length - 1, (current < 0 ? 0 : current) + delta));
    const id = ids[next];
    setActiveId(id);
    const el = rowRefs.current.get(id);
    el?.focus();
    el?.scrollIntoView({
      block: 'nearest'
    });
  }, [runs, activeValid, activeId]);
  const onKeyDown = useCallback((e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(-1);
    }
  }, [move]);
  return <section className="flex min-h-0 flex-col border-t border-cmd-line-strong" aria-label="Recent runs">
      <div className="flex h-10 shrink-0 items-center justify-between bg-cmd-raised px-6">
        <div className="flex items-baseline gap-2">
          <h2 className="font-mono text-[12px] font-semibold text-cmd-fg">
            Recent runs
          </h2>
          <span className="font-mono text-[11px] tabular-nums text-cmd-fg-mute">
            {runs.length > 0 ? runs.length : ''}
          </span>
        </div>
        <Link to="/executions" className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5', 'font-mono text-[11px] text-cmd-fg-mute outline-none transition-colors', 'hover:bg-cmd-hover hover:text-cmd-fg', 'focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
          All executions
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>

      {isLoading ? <Skeleton /> : runs.length === 0 ? <Empty onRun={onRun} /> : <div className="max-h-[280px] overflow-auto bg-cmd-surface" onKeyDown={onKeyDown} aria-label={`Recent runs of ${workflow.key}`}>
          {runs.map(e => <ExecutionRow key={e.id} execution={e} active={e.id === activeId} tabIndex={e.id === rovingId ? 0 : -1} onFocus={() => setActiveId(e.id)} ref={el => {
        if (el) rowRefs.current.set(e.id, el);else rowRefs.current.delete(e.id);
      }} />)}
        </div>}
    </section>;
}
function Empty({
  onRun
}: {
  onRun: () => void;
}) {
  return <div className="flex flex-1 items-center justify-center bg-cmd-surface px-6 py-10">
      <div className="max-w-xs text-center">
        <div className="font-mono text-[13px] text-cmd-fg">No runs yet</div>
        <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-cmd-fg-mute">
          This workflow hasn't executed. Run it to see its history here.
        </p>
        <button type="button" onClick={onRun} className={cn('mt-3 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1', 'border border-cmd-accent-dim bg-cmd-sel font-mono text-[11px] text-cmd-accent', 'outline-none transition-colors hover:brightness-110', 'focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
          <Play className="h-3 w-3" fill="currentColor" aria-hidden />
          Run workflow
          <kbd className="ml-0.5 rounded border border-cmd-accent-dim px-1 text-[10px]">
            R
          </kbd>
        </button>
      </div>
    </div>;
}
function Skeleton() {
  return <div className="bg-cmd-surface" aria-busy="true">
      {Array.from({
      length: 4
    }).map((_, i) => <div key={i} className={cn('grid items-center gap-4 border-b border-cmd-line px-6 py-2.5', ROW_GRID)}>
          <div className="h-3 w-20 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-3 w-40 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
            <div className="h-2 w-56 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
          </div>
          <div className="h-3 w-14 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
          <div className="h-3 w-16 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
          <div className="h-3 w-10 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
          <span />
        </div>)}
    </div>;
}
