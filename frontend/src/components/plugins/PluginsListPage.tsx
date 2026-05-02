import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlugins } from '@/lib/api/plugins';
import { mockPlugins } from '@/lib/mockData';
import { PluginsTable } from './PluginsTable';
import { PLUGIN_ROW_GRID } from './grid';
type KindFilter = 'ALL' | 'TASK' | 'TRIGGER';
const CHIPS: {
  value: KindFilter;
  label: string;
}[] = [{
  value: 'ALL',
  label: 'All'
}, {
  value: 'TASK',
  label: 'Tasks'
}, {
  value: 'TRIGGER',
  label: 'Triggers'
}];
export function PluginsListPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<KindFilter>('ALL');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const {
    data,
    isLoading,
    isError
  } = usePlugins();
  const demo = isError || !isLoading && !data;
  const plugins = demo ? mockPlugins : data ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return plugins.filter(pl => {
      if (filter !== 'ALL' && pl.kind !== filter) return false;
      if (!q) return true;
      return pl.name.toLowerCase().includes(q) || pl.id.toLowerCase().includes(q) || pl.description.toLowerCase().includes(q) || pl.categories.some(c => c.toLowerCase().includes(q));
    });
  }, [plugins, search, filter]);
  const isFiltered = search.trim() !== '' || filter !== 'ALL';
  const clearFilters = () => {
    setSearch('');
    setFilter('ALL');
  };
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = document.activeElement;
      const typing = el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (e.key === '/' && !typing) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && el === searchInputRef.current) {
        if (search) setSearch('');
        searchInputRef.current?.blur();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [search]);
  return <div className="flex h-full flex-col bg-cmd-bg font-mono text-cmd-fg">
      <header className="flex h-16 items-center border-b border-cmd-line bg-cmd-raised px-6">
        <div>
          <h1 className="font-mono text-[15px] font-semibold tracking-tight text-cmd-fg">
            Plugins
          </h1>
          <p className="mt-0.5 font-mono text-[11px] text-cmd-fg-mute">
            Installed task and trigger building blocks. Open one for its
            config schema.
          </p>
        </div>
      </header>

      <div className="flex items-center gap-2 border-b border-cmd-line bg-cmd-raised px-6 py-3">
        <div className="flex items-center gap-1">
          {CHIPS.map(({
          value,
          label
        }) => {
          const active = filter === value;
          return <button key={value} type="button" aria-pressed={active} onClick={() => setFilter(value)} className={cn('rounded-md border px-2.5 py-0.5 font-mono text-[11px]', 'whitespace-nowrap outline-none transition-colors', 'focus-visible:ring-2 focus-visible:ring-cmd-accent', active ? 'border-cmd-accent-dim bg-cmd-sel text-cmd-accent' : 'border-cmd-line text-cmd-fg-mute hover:bg-cmd-hover hover:text-cmd-fg-dim')}>
                {label}
              </button>;
        })}
        </div>

        <span className="mx-1 h-4 w-px bg-cmd-line" />

        <div className={cn('group flex w-72 items-center gap-1.5 px-2 py-1', 'rounded-md border border-cmd-line bg-cmd-bg', 'focus-within:border-cmd-accent-dim')}>
          <Search className="h-3 w-3 shrink-0 text-cmd-fg-mute" aria-hidden />
          <input ref={searchInputRef} type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by name, id or category" aria-label="Filter plugins" className={cn('min-w-0 flex-1 bg-transparent outline-none', 'font-mono text-[12px] text-cmd-fg', 'placeholder:text-cmd-fg-mute')} />
          {search ? <button type="button" onClick={() => setSearch('')} aria-label="Clear filter" className="text-cmd-fg-mute outline-none hover:text-cmd-fg-dim focus-visible:text-cmd-fg">
              <X className="h-3 w-3" />
            </button> : <kbd className={cn('rounded border border-cmd-line px-1 font-mono text-[10px] text-cmd-fg-mute', 'group-focus-within:opacity-0')} aria-hidden>
              /
            </kbd>}
        </div>

        {demo && <span className="ml-auto mr-3 shrink-0 rounded-md border border-cmd-line bg-cmd-surface px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-cmd-fg-mute" title="Backend unreachable; showing demo data">
            demo data
          </span>}
        <span className={cn('font-mono text-[11px] tabular-nums text-cmd-fg-mute', !demo && 'ml-auto')}>
          {filtered.length === plugins.length ? `${plugins.length} plugin${plugins.length === 1 ? '' : 's'}` : `${filtered.length} / ${plugins.length}`}
        </span>
      </div>

      {isLoading ? <Skeleton /> : <PluginsTable plugins={filtered} hasAny={plugins.length > 0} isFiltered={isFiltered} onClearFilters={clearFilters} />}
    </div>;
}
function Skeleton() {
  return <div className="flex-1 overflow-hidden bg-cmd-surface" aria-busy="true">
      <div className={cn('grid items-center gap-4 border-b border-cmd-line-strong px-6 py-2', PLUGIN_ROW_GRID, 'font-mono text-[10px] uppercase tracking-[0.12em] text-cmd-fg-mute')}>
        <div>Kind</div>
        <div>Plugin</div>
        <div>Description</div>
        <div>Categories</div>
        <div>Version</div>
        <div aria-hidden />
      </div>
      {Array.from({
      length: 8
    }).map((_, i) => <div key={i} className={cn('grid items-center gap-4 border-b border-cmd-line px-6 py-2.5', PLUGIN_ROW_GRID)}>
          <div className="h-3 w-14 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-3 w-24 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
            <div className="h-2 w-44 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
          </div>
          <div className="h-3 w-48 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
          <div className="h-3 w-20 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
          <div className="h-3 w-10 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
          <span />
        </div>)}
    </div>;
}
