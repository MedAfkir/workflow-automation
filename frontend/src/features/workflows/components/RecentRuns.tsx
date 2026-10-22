import { ArrowUpRight, Play } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import {
  EXECUTION_ROW_GRID,
  ExecutionRow,
  ExecutionRowSkeleton,
  useExecutions,
} from '@/features/executions';
import { useRovingFocus } from '@/shared/hooks/useRovingFocus';
import { cn } from '@/shared/lib/cn';
import { Kbd } from '@/shared/ui/Kbd';
import { SkeletonRows } from '@/shared/ui/Table';

import type { WorkflowDetail } from '../types';

const VISIBLE_LIMIT = 8;

interface RecentRunsProps {
  workflow: WorkflowDetail;
  onRun: () => void;
}

export function RecentRuns({ workflow, onRun }: RecentRunsProps) {
  const { data, isLoading, isError } = useExecutions({ limit: 50 });

  const runs = useMemo(
    () =>
      (data ?? [])
        .filter((e) => e.workflowKey === workflow.key && e.workflowNamespace === workflow.namespace)
        .slice(0, VISIBLE_LIMIT),
    [data, workflow.key, workflow.namespace],
  );

  const roving = useRovingFocus<HTMLAnchorElement>(runs.map((e) => e.id));

  return (
    <section
      className="flex min-h-0 flex-col border-t border-cmd-line-strong"
      aria-label="Recent runs"
    >
      <div className="flex h-10 shrink-0 items-center justify-between bg-cmd-raised px-6">
        <div className="flex items-baseline gap-2">
          <h2 className="font-mono text-sm font-semibold text-cmd-fg">Recent runs</h2>
          <span className="font-mono text-xs tabular-nums text-cmd-fg-mute">
            {runs.length > 0 ? runs.length : ''}
          </span>
        </div>
        <Link
          to="/executions"
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5',
            'font-mono text-xs text-cmd-fg-mute outline-none transition-colors',
            'hover:bg-cmd-hover hover:text-cmd-fg',
            'focus-visible:ring-2 focus-visible:ring-cmd-accent',
          )}
        >
          All executions
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>

      {isLoading ? (
        <div className="bg-cmd-surface" aria-busy="true">
          <SkeletonRows grid={EXECUTION_ROW_GRID} rows={4}>
            <ExecutionRowSkeleton />
          </SkeletonRows>
        </div>
      ) : isError ? (
        <p className="bg-cmd-surface px-6 py-10 text-center font-mono text-xs text-run-failed">
          Couldn't load recent runs.
        </p>
      ) : runs.length === 0 ? (
        <Empty onRun={onRun} />
      ) : (
        <div
          className="max-h-[280px] overflow-auto bg-cmd-surface"
          onKeyDown={roving.onKeyDown}
          aria-label={`Recent runs of ${workflow.key}`}
        >
          {runs.map((e) => (
            <ExecutionRow
              key={e.id}
              execution={e}
              active={e.id === roving.activeId}
              {...roving.itemProps(e.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function Empty({ onRun }: { onRun: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center bg-cmd-surface px-6 py-10">
      <div className="max-w-xs text-center">
        <div className="font-mono text-base text-cmd-fg">No runs yet</div>
        <p className="mt-1.5 font-mono text-xs leading-relaxed text-cmd-fg-mute">
          This workflow hasn't executed. Run it to see its history here.
        </p>
        <button
          type="button"
          onClick={onRun}
          className={cn(
            'mt-3 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1',
            'border border-cmd-accent-dim bg-cmd-sel font-mono text-xs text-cmd-accent',
            'outline-none transition-colors hover:brightness-110',
            'focus-visible:ring-2 focus-visible:ring-cmd-accent',
          )}
        >
          <Play className="h-3 w-3" fill="currentColor" aria-hidden />
          Run workflow
          <Kbd variant="accentOutline" className="ml-0.5">
            R
          </Kbd>
        </button>
      </div>
    </div>
  );
}
