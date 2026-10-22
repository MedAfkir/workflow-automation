import { ChevronRight, GitBranch, PauseCircle, Power } from 'lucide-react';
import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

import { useRovingFocus } from '@/shared/hooks/useRovingFocus';
import { cn } from '@/shared/lib/cn';
import { relativeTime } from '@/shared/lib/format';
import { CommandHint, EmptyState, NoMatches } from '@/shared/ui/States';
import { SkeletonBar, TableHeader } from '@/shared/ui/Table';

import type { WorkflowSummary } from '../types';
import { WF_COLUMNS, WF_ROW_GRID } from './grid';

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
  onClearFilters,
}: WorkflowsTableProps) {
  const roving = useRovingFocus<HTMLAnchorElement>(workflows.map((w) => w.id));

  if (workflows.length === 0) {
    return hasAny && isFiltered ? (
      <NoMatches message="No workflows match these filters" onClear={onClearFilters} />
    ) : (
      <EmptyState
        icon={GitBranch}
        title="No workflows yet"
        description="Define one in YAML and apply it from the CLI:"
      >
        <CommandHint>wf apply &lt;file&gt;.yaml</CommandHint>
      </EmptyState>
    );
  }

  return (
    <div
      className="flex-1 overflow-auto bg-cmd-surface"
      onKeyDown={roving.onKeyDown}
      aria-label="Workflows"
    >
      <TableHeader grid={WF_ROW_GRID} columns={WF_COLUMNS} />
      <div>
        {workflows.map((w) => (
          <WorkflowRow
            key={w.id}
            workflow={w}
            active={w.id === roving.activeId}
            {...roving.itemProps(w.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function WorkflowRowSkeleton() {
  return (
    <>
      <SkeletonBar className="w-16" />
      <div className="space-y-1.5">
        <SkeletonBar className="w-36" />
        <SkeletonBar className="h-2 w-20" />
      </div>
      <SkeletonBar className="w-8" />
      <SkeletonBar className="w-12" />
      <SkeletonBar className="w-16" />
    </>
  );
}

interface WorkflowRowProps {
  workflow: WorkflowSummary;
  active: boolean;
  tabIndex: number;
  onFocus: () => void;
}

const WorkflowRow = forwardRef<HTMLAnchorElement, WorkflowRowProps>(function WorkflowRow(
  { workflow, active, tabIndex, onFocus },
  ref,
) {
  return (
    <Link
      ref={ref}
      to={`/workflows/${workflow.id}`}
      tabIndex={tabIndex}
      onFocus={onFocus}
      aria-label={`${workflow.namespace}/${workflow.key}, ${workflow.enabled ? 'enabled' : 'disabled'}, revision ${workflow.currentRevision}`}
      className={cn(
        'group grid items-center gap-4 px-6 py-2.5',
        WF_ROW_GRID,
        'border-b border-cmd-line outline-none transition-colors',
        'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cmd-accent',
        active ? 'bg-cmd-sel' : 'hover:bg-cmd-hover',
      )}
    >
      <EnabledTag enabled={workflow.enabled} />

      <div className="min-w-0">
        <div className="truncate font-mono text-base font-medium text-cmd-fg">{workflow.key}</div>
        <div className="mt-0.5 truncate font-mono text-xs text-cmd-fg-mute">
          {workflow.namespace}
        </div>
      </div>

      <div className="font-mono text-xs tabular-nums text-cmd-fg-dim">
        {workflow.triggerCount > 0 ? (
          workflow.triggerCount
        ) : (
          <span className="text-cmd-fg-mute">-</span>
        )}
      </div>

      <div className="font-mono text-xs tabular-nums text-cmd-fg-dim">
        rev {workflow.currentRevision}
      </div>

      <div className="font-mono text-xs tabular-nums text-cmd-fg-dim" title={workflow.updatedAt}>
        {relativeTime(workflow.updatedAt)}
      </div>

      <ChevronRight
        className={cn(
          'h-3.5 w-3.5 text-cmd-fg-mute transition-opacity',
          'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
        )}
        aria-hidden
      />
    </Link>
  );
});

function EnabledTag({ enabled }: { enabled: boolean }) {
  const Icon = enabled ? Power : PauseCircle;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-xs tracking-[0.04em]',
        enabled ? 'text-cmd-fg-dim' : 'text-cmd-fg-mute',
      )}
    >
      <Icon className="h-[13px] w-[13px] shrink-0" aria-hidden />
      {enabled ? 'enabled' : 'disabled'}
    </span>
  );
}
