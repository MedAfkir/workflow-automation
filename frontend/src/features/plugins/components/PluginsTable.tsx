import { AlertTriangle, Box, ChevronRight, Plug, Zap } from 'lucide-react';
import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

import { useRovingFocus } from '@/shared/hooks/useRovingFocus';
import { cn } from '@/shared/lib/cn';
import { EmptyState, NoMatches } from '@/shared/ui/States';
import { SkeletonBar, TableHeader } from '@/shared/ui/Table';

import type { PluginKind, PluginSummary } from '../types';
import { PLUGIN_COLUMNS, PLUGIN_ROW_GRID } from './grid';

interface PluginsTableProps {
  plugins: PluginSummary[];
  hasAny: boolean;
  isFiltered: boolean;
  onClearFilters: () => void;
}

export function PluginsTable({ plugins, hasAny, isFiltered, onClearFilters }: PluginsTableProps) {
  const roving = useRovingFocus<HTMLAnchorElement>(plugins.map((pl) => pl.id));

  if (plugins.length === 0) {
    return hasAny && isFiltered ? (
      <NoMatches message="No plugins match these filters" onClear={onClearFilters} />
    ) : (
      <EmptyState
        icon={Plug}
        title="No plugins registered"
        description={
          <>
            The engine indexes <span className="text-cmd-fg-dim">@Plugin</span> classes from the
            classpath at startup. None were found.
          </>
        }
      />
    );
  }

  return (
    <div
      className="flex-1 overflow-auto bg-cmd-surface"
      onKeyDown={roving.onKeyDown}
      aria-label="Plugins"
    >
      <TableHeader grid={PLUGIN_ROW_GRID} columns={PLUGIN_COLUMNS} />
      <div>
        {plugins.map((pl) => (
          <PluginRow
            key={pl.id}
            plugin={pl}
            active={pl.id === roving.activeId}
            {...roving.itemProps(pl.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function PluginRowSkeleton() {
  return (
    <>
      <SkeletonBar className="w-14" />
      <div className="space-y-1.5">
        <SkeletonBar className="w-24" />
        <SkeletonBar className="h-2 w-44" />
      </div>
      <SkeletonBar className="w-48" />
      <SkeletonBar className="w-20" />
      <SkeletonBar className="w-10" />
    </>
  );
}

interface PluginRowProps {
  plugin: PluginSummary;
  active: boolean;
  tabIndex: number;
  onFocus: () => void;
}

const PluginRow = forwardRef<HTMLAnchorElement, PluginRowProps>(function PluginRow(
  { plugin, active, tabIndex, onFocus },
  ref,
) {
  return (
    <Link
      ref={ref}
      to={`/plugins/${plugin.id}`}
      tabIndex={tabIndex}
      onFocus={onFocus}
      aria-label={`${plugin.name}, ${plugin.kind.toLowerCase()}, version ${plugin.version}${plugin.deprecated ? ', deprecated' : ''}`}
      className={cn(
        'group grid items-center gap-4 px-6 py-2.5',
        PLUGIN_ROW_GRID,
        'border-b border-cmd-line outline-none transition-colors',
        'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cmd-accent',
        plugin.deprecated && 'bg-cmd-fail-wash',
        active ? 'bg-cmd-sel' : plugin.deprecated ? 'hover:brightness-110' : 'hover:bg-cmd-hover',
      )}
    >
      <KindTag kind={plugin.kind} />

      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-mono text-base font-medium text-cmd-fg">
            {plugin.name}
          </span>
          {plugin.deprecated && (
            <span
              className="inline-flex shrink-0 items-center gap-1 font-mono text-2xs uppercase tracking-[0.08em] text-run-failed"
              title={plugin.replacedBy ? `Deprecated - use ${plugin.replacedBy}` : 'Deprecated'}
            >
              <AlertTriangle className="h-3 w-3" aria-hidden />
              deprecated
            </span>
          )}
        </div>
        <div className="mt-0.5 truncate font-mono text-xs text-cmd-fg-mute">{plugin.id}</div>
      </div>

      <div
        className="min-w-0 truncate font-mono text-sm text-cmd-fg-dim"
        title={plugin.description || undefined}
      >
        {plugin.description || <span className="text-cmd-fg-mute">-</span>}
      </div>

      <div className="flex min-w-0 flex-wrap gap-1">
        {plugin.categories.length > 0 ? (
          plugin.categories.map((c) => (
            <span
              key={c}
              className="rounded-md border border-cmd-line px-1.5 py-0.5 font-mono text-2xs text-cmd-fg-mute"
            >
              {c}
            </span>
          ))
        ) : (
          <span className="font-mono text-xs text-cmd-fg-mute">-</span>
        )}
      </div>

      <div className="font-mono text-xs tabular-nums text-cmd-fg-dim">{plugin.version}</div>

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

function KindTag({ kind }: { kind: PluginKind }) {
  const isTask = kind === 'TASK';
  const Icon = isTask ? Box : Zap;

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs tracking-[0.04em] text-cmd-fg-dim">
      <Icon className="h-[13px] w-[13px] shrink-0" aria-hidden />
      {isTask ? 'task' : 'trigger'}
    </span>
  );
}
