import { forwardRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { RunStatus } from './RunStatus';
import { ROW_GRID } from './grid';
import { cn, formatDuration, relativeTime, shortId } from '@/lib/utils';
import type { ExecutionState, ExecutionSummary } from '@/lib/types';
interface ExecutionRowProps {
  execution: ExecutionSummary;
  active: boolean;
  tabIndex: number;
  onFocus: () => void;
}
export const ExecutionRow = forwardRef<HTMLAnchorElement, ExecutionRowProps>(function ExecutionRow({
  execution,
  active,
  tabIndex,
  onFocus
}, ref) {
  const now = useNow(execution.state);
  const duration = execution.startedAt && formatDuration((execution.endedAt ? new Date(execution.endedAt).getTime() : now) - new Date(execution.startedAt).getTime());
  const started = execution.startedAt ? relativeTime(execution.startedAt, now) : '-';
  const isFail = execution.state === 'FAILED' || execution.state === 'KILLED';
  return <Link ref={ref} to={`/executions/${execution.id}`} tabIndex={tabIndex} onFocus={onFocus} aria-label={`${execution.workflowKey}, ${execution.state.toLowerCase()}, started ${started}`} className={cn('group grid items-center gap-4 px-6 py-2.5', ROW_GRID, 'border-b border-cmd-line outline-none transition-colors', 'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cmd-accent', active ? 'bg-cmd-sel' : isFail ? 'bg-cmd-fail-wash hover:bg-cmd-hover' : 'hover:bg-cmd-hover')}>
        {}
        <RunStatus state={execution.state} />

        {}
        <div className="min-w-0">
          <div className="truncate font-mono text-[13px] font-medium text-cmd-fg">
            {execution.workflowKey}
          </div>
          <div className="mt-0.5 truncate font-mono text-[11px] text-cmd-fg-mute">
            {execution.workflowNamespace}
            <span className="mx-1.5 text-cmd-line-strong">-</span>
            rev {execution.workflowRevision}
            <span className="mx-1.5 text-cmd-line-strong">-</span>
            {shortId(execution.id)}
            {execution.errorMessage && <>
                <span className="mx-1.5 text-cmd-line-strong">-</span>
                <span className="text-run-failed">
                  {execution.errorMessage.length > 72 ? execution.errorMessage.slice(0, 72) + '...' : execution.errorMessage}
                </span>
              </>}
          </div>
        </div>

        {}
        <div className="font-mono text-[11px] lowercase text-cmd-fg-mute">
          {execution.triggerType.toLowerCase()}
        </div>

        {}
        <div className="font-mono text-[11px] tabular-nums text-cmd-fg-dim" title={execution.startedAt ?? undefined}>
          {started}
        </div>

        {}
        <div className="font-mono text-[11px] tabular-nums text-cmd-fg-dim">
          {duration ?? '-'}
        </div>

        {}
        <ChevronRight className={cn('h-3.5 w-3.5 text-cmd-fg-mute transition-opacity', 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100')} aria-hidden />
      </Link>;
});
function useNow(state: ExecutionState): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (state !== 'CREATED' && state !== 'RUNNING') return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [state]);
  return now;
}
