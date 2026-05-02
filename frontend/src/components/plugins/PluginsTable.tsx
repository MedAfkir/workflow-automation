import { forwardRef, useCallback, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Box, ChevronRight, Plug, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PluginKind, PluginSummary } from '@/lib/types';
import { PLUGIN_ROW_GRID } from './grid';
interface PluginsTableProps {
  plugins: PluginSummary[];
  hasAny: boolean;
  isFiltered: boolean;
  onClearFilters: () => void;
}
export function PluginsTable({
  plugins,
  hasAny,
  isFiltered,
  onClearFilters
}: PluginsTableProps) {
  const rowRefs = useRef(new Map<string, HTMLAnchorElement>());
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeValid = activeId != null && plugins.some(pl => pl.id === activeId);
  const rovingId = activeValid ? activeId : plugins[0]?.id ?? null;
  const move = useCallback((delta: number) => {
    if (plugins.length === 0) return;
    const ids = plugins.map(pl => pl.id);
    const current = activeValid ? ids.indexOf(activeId!) : -1;
    const next = Math.max(0, Math.min(ids.length - 1, (current < 0 ? 0 : current) + delta));
    const id = ids[next];
    setActiveId(id);
    const el = rowRefs.current.get(id);
    el?.focus();
    el?.scrollIntoView({
      block: 'nearest'
    });
  }, [plugins, activeValid, activeId]);
  const onKeyDown = useCallback((e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(-1);
    }
  }, [move]);
  if (plugins.length === 0) {
    return hasAny && isFiltered ? <FilteredEmpty onClearFilters={onClearFilters} /> : <FirstRun />;
  }
  return <div className="flex-1 overflow-auto bg-cmd-surface" onKeyDown={onKeyDown} aria-label="Plugins">
      <div className={cn('sticky top-0 z-10 grid items-center gap-4 px-6 py-2', PLUGIN_ROW_GRID, 'border-b border-cmd-line-strong bg-cmd-raised', 'font-mono text-[10px] uppercase tracking-[0.12em] text-cmd-fg-mute')}>
        <div>Kind</div>
        <div>Plugin</div>
        <div>Description</div>
        <div>Categories</div>
        <div>Version</div>
        <div aria-hidden />
      </div>

      <div>
        {plugins.map(pl => <PluginRow key={pl.id} plugin={pl} active={pl.id === activeId} tabIndex={pl.id === rovingId ? 0 : -1} onFocus={() => setActiveId(pl.id)} ref={el => {
        if (el) rowRefs.current.set(pl.id, el);else rowRefs.current.delete(pl.id);
      }} />)}
      </div>
    </div>;
}
interface PluginRowProps {
  plugin: PluginSummary;
  active: boolean;
  tabIndex: number;
  onFocus: () => void;
}
const PluginRow = forwardRef<HTMLAnchorElement, PluginRowProps>(function PluginRow({
  plugin,
  active,
  tabIndex,
  onFocus
}, ref) {
  return <Link ref={ref} to={`/plugins/${plugin.id}`} tabIndex={tabIndex} onFocus={onFocus} aria-label={`${plugin.name}, ${plugin.kind.toLowerCase()}, version ${plugin.version}${plugin.deprecated ? ', deprecated' : ''}`} className={cn('group grid items-center gap-4 px-6 py-2.5', PLUGIN_ROW_GRID, 'border-b border-cmd-line outline-none transition-colors', 'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cmd-accent', plugin.deprecated && 'bg-cmd-fail-wash', active ? 'bg-cmd-sel' : plugin.deprecated ? 'hover:brightness-110' : 'hover:bg-cmd-hover')}>
        <KindTag kind={plugin.kind} />

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-mono text-[13px] font-medium text-cmd-fg">
              {plugin.name}
            </span>
            {plugin.deprecated && <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-run-failed" title={plugin.replacedBy ? `Deprecated - use ${plugin.replacedBy}` : 'Deprecated'}>
                <AlertTriangle className="h-3 w-3" aria-hidden />
                deprecated
              </span>}
          </div>
          <div className="mt-0.5 truncate font-mono text-[11px] text-cmd-fg-mute">
            {plugin.id}
          </div>
        </div>

        <div className="min-w-0 truncate font-mono text-[12px] text-cmd-fg-dim" title={plugin.description || undefined}>
          {plugin.description || <span className="text-cmd-fg-mute">-</span>}
        </div>

        <div className="flex min-w-0 flex-wrap gap-1">
          {plugin.categories.length > 0 ? plugin.categories.map(c => <span key={c} className="rounded-md border border-cmd-line px-1.5 py-0.5 font-mono text-[10px] text-cmd-fg-mute">
                {c}
              </span>) : <span className="font-mono text-[11px] text-cmd-fg-mute">-</span>}
        </div>

        <div className="font-mono text-[11px] tabular-nums text-cmd-fg-dim">
          {plugin.version}
        </div>

        <ChevronRight className={cn('h-3.5 w-3.5 text-cmd-fg-mute transition-opacity', 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100')} aria-hidden />
      </Link>;
});
function KindTag({
  kind
}: {
  kind: PluginKind;
}) {
  const isTask = kind === 'TASK';
  const Icon = isTask ? Box : Zap;
  return <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.04em] text-cmd-fg-dim">
      <Icon className="h-[13px] w-[13px] shrink-0" aria-hidden />
      {isTask ? 'task' : 'trigger'}
    </span>;
}
function FirstRun() {
  return <div className="flex flex-1 items-center justify-center bg-cmd-surface p-12">
      <div className="max-w-sm text-center">
        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md border border-cmd-line bg-cmd-raised">
          <Plug className="h-4 w-4 text-cmd-accent" aria-hidden />
        </div>
        <div className="font-mono text-[13px] text-cmd-fg">
          No plugins registered
        </div>
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-cmd-fg-mute">
          The engine indexes <span className="text-cmd-fg-dim">@Plugin</span>{' '}
          classes from the classpath at startup. None were found.
        </p>
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
          No plugins match these filters
        </div>
        <button type="button" onClick={onClearFilters} className={cn('mt-3 rounded-md border border-cmd-line px-3 py-1 font-mono text-[11px]', 'text-cmd-fg-dim outline-none transition-colors', 'hover:bg-cmd-hover hover:text-cmd-fg', 'focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
          Clear filters
        </button>
      </div>
    </div>;
}
