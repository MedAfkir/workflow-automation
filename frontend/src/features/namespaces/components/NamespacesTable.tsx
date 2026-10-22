import { ChevronRight, Layers } from 'lucide-react';
import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

import { useRovingFocus } from '@/shared/hooks/useRovingFocus';
import { cn } from '@/shared/lib/cn';
import { relativeTime } from '@/shared/lib/format';
import { CommandHint, EmptyState, NoMatches } from '@/shared/ui/States';
import { SkeletonBar, TableHeader } from '@/shared/ui/Table';

import type { NamespaceSummary } from '../types';
import { NS_COLUMNS, NS_ROW_GRID } from './grid';

const PREVIEW_LIMIT = 3;

interface NamespacesTableProps {
  namespaces: NamespaceSummary[];
  hasAny: boolean;
  isFiltered: boolean;
  onClearFilters: () => void;
}

export function NamespacesTable({
  namespaces,
  hasAny,
  isFiltered,
  onClearFilters,
}: NamespacesTableProps) {
  const roving = useRovingFocus<HTMLAnchorElement>(namespaces.map((n) => n.name));

  if (namespaces.length === 0) {
    return hasAny && isFiltered ? (
      <NoMatches
        message="No namespaces match this filter"
        clearLabel="Clear filter"
        onClear={onClearFilters}
      />
    ) : (
      <EmptyState
        icon={Layers}
        title="No namespaces yet"
        description="A namespace appears once you apply a workflow into it:"
      >
        <CommandHint>wf apply &lt;file&gt;.yaml</CommandHint>
      </EmptyState>
    );
  }

  return (
    <div
      className="flex-1 overflow-auto bg-cmd-surface"
      onKeyDown={roving.onKeyDown}
      aria-label="Namespaces"
    >
      <TableHeader grid={NS_ROW_GRID} columns={NS_COLUMNS} />
      <div>
        {namespaces.map((n) => (
          <NamespaceRow
            key={n.name}
            namespace={n}
            active={n.name === roving.activeId}
            {...roving.itemProps(n.name)}
          />
        ))}
      </div>
    </div>
  );
}

export function NamespaceRowSkeleton() {
  return (
    <>
      <div className="flex items-start gap-2.5">
        <SkeletonBar className="mt-px h-3.5 w-3.5 shrink-0" />
        <div className="space-y-1.5">
          <SkeletonBar className="w-28" />
          <SkeletonBar className="h-2 w-44" />
        </div>
      </div>
      <SkeletonBar className="w-10" />
      <SkeletonBar className="w-6" />
      <SkeletonBar className="w-16" />
    </>
  );
}

interface NamespaceRowProps {
  namespace: NamespaceSummary;
  active: boolean;
  tabIndex: number;
  onFocus: () => void;
}

const NamespaceRow = forwardRef<HTMLAnchorElement, NamespaceRowProps>(function NamespaceRow(
  { namespace, active, tabIndex, onFocus },
  ref,
) {
  const { name, workflowCount, disabledCount, triggerCount, workflowKeys } = namespace;
  const preview = workflowKeys.slice(0, PREVIEW_LIMIT).join(' - ');
  const overflow = workflowKeys.length - PREVIEW_LIMIT;
  const ariaLabel =
    `${name}, ${workflowCount} workflow${workflowCount === 1 ? '' : 's'}` +
    (disabledCount > 0 ? `, ${disabledCount} disabled` : '') +
    `, updated ${relativeTime(namespace.updatedAt)}`;

  return (
    <Link
      ref={ref}
      to={`/workflows?ns=${encodeURIComponent(name)}`}
      tabIndex={tabIndex}
      onFocus={onFocus}
      aria-label={ariaLabel}
      className={cn(
        'group grid items-center gap-4 px-6 py-2.5',
        NS_ROW_GRID,
        'border-b border-cmd-line outline-none transition-colors',
        'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cmd-accent',
        active ? 'bg-cmd-sel' : 'hover:bg-cmd-hover',
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <Layers className="mt-px h-3.5 w-3.5 shrink-0 text-cmd-fg-mute" aria-hidden />
        <div className="min-w-0">
          <div className="truncate font-mono text-base font-medium text-cmd-fg">{name}</div>
          <div className="mt-0.5 truncate font-mono text-xs text-cmd-fg-mute">
            {preview}
            {overflow > 0 && <span className="text-cmd-fg-mute">{` - +${overflow}`}</span>}
          </div>
        </div>
      </div>

      <div className="font-mono text-xs tabular-nums text-cmd-fg-dim">
        {workflowCount}
        {disabledCount > 0 && (
          <span className="text-cmd-fg-mute">{` - ${disabledCount} disabled`}</span>
        )}
      </div>

      <div className="font-mono text-xs tabular-nums text-cmd-fg-dim">
        {triggerCount > 0 ? triggerCount : <span className="text-cmd-fg-mute">-</span>}
      </div>

      <div
        className="font-mono text-xs tabular-nums text-cmd-fg-dim"
        title={namespace.updatedAt ?? undefined}
      >
        {relativeTime(namespace.updatedAt)}
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
