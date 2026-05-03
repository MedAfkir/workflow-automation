import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { aggregateNamespaces, useNamespaces } from '@/lib/api/namespaces';
import { mockWorkflows } from '@/lib/mockData';
import { NamespacesTable } from './NamespacesTable';
import { NS_ROW_GRID } from './grid';
type Sort = 'RECENT' | 'NAME' | 'WORKFLOWS';
const SORT_CHIPS: {
  value: Sort;
  label: string;
}[] = [{
  value: 'RECENT',
  label: 'Recent'
}, {
  value: 'NAME',
  label: 'Name'
}, {
  value: 'WORKFLOWS',
  label: 'Workflows'
}];
function sortTime(iso: string | null): number {
  return iso ? new Date(iso).getTime() : -Infinity;
}
export function NamespacesListPage() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort>('RECENT');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const {
    data,
    isLoading,
    isError
  } = useNamespaces();
  const demo = isError || !isLoading && !data;
  const namespaces = demo ? aggregateNamespaces(mockWorkflows) : data ?? [];
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matched = namespaces.filter(n => {
      if (!q) return true;
      return n.name.toLowerCase().includes(q) || n.workflowKeys.some(k => k.toLowerCase().includes(q));
    });
    const sorted = [...matched];
    if (sort === 'NAME') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'WORKFLOWS') {
      sorted.sort((a, b) => b.workflowCount - a.workflowCount || a.name.localeCompare(b.name));
    } else {
      sorted.sort((a, b) => sortTime(b.updatedAt) - sortTime(a.updatedAt));
    }
    return sorted;
  }, [namespaces, search, sort]);
  const isFiltered = search.trim() !== '';
  const clearFilters = () => setSearch('');
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
            Namespaces
          </h1>
          <p className="mt-0.5 font-mono text-[11px] text-cmd-fg-mute">
            Every namespace across the platform, with the workflows it
            groups. Open one to see its workflows.
          </p>
        </div>
      </header>

      <div className="flex items-center gap-2 border-b border-cmd-line bg-cmd-raised px-6 py-3">
        <div className="flex items-center gap-1">
          <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.12em] text-cmd-fg-mute">
            Sort
          </span>
          {SORT_CHIPS.map(({
          value,
          label
        }) => {
          const active = sort === value;
          return <button key={value} type="button" aria-pressed={active} onClick={() => setSort(value)} className={cn('rounded-md border px-2.5 py-0.5 font-mono text-[11px]', 'whitespace-nowrap outline-none transition-colors', 'focus-visible:ring-2 focus-visible:ring-cmd-accent', active ? 'border-cmd-accent-dim bg-cmd-sel text-cmd-accent' : 'border-cmd-line text-cmd-fg-mute hover:bg-cmd-hover hover:text-cmd-fg-dim')}>
                {label}
              </button>;
        })}
        </div>

        <span className="mx-1 h-4 w-px bg-cmd-line" />

        <div className={cn('group flex w-72 items-center gap-1.5 px-2 py-1', 'rounded-md border border-cmd-line bg-cmd-bg', 'focus-within:border-cmd-accent-dim')}>
          <Search className="h-3 w-3 shrink-0 text-cmd-fg-mute" aria-hidden />
          <input ref={searchInputRef} type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by namespace or workflow" aria-label="Filter namespaces" className={cn('min-w-0 flex-1 bg-transparent outline-none', 'font-mono text-[12px] text-cmd-fg', 'placeholder:text-cmd-fg-mute')} />
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
          {visible.length === namespaces.length ? `${namespaces.length} namespace${namespaces.length === 1 ? '' : 's'}` : `${visible.length} / ${namespaces.length}`}
        </span>
      </div>

      {isLoading ? <Skeleton /> : <NamespacesTable namespaces={visible} hasAny={namespaces.length > 0} isFiltered={isFiltered} onClearFilters={clearFilters} />}
    </div>;
}
function Skeleton() {
  return <div className="flex-1 overflow-hidden bg-cmd-surface" aria-busy="true">
      <div className={cn('grid items-center gap-4 border-b border-cmd-line-strong px-6 py-2', NS_ROW_GRID, 'font-mono text-[10px] uppercase tracking-[0.12em] text-cmd-fg-mute')}>
        <div>Namespace</div>
        <div>Workflows</div>
        <div>Triggers</div>
        <div>Updated</div>
        <div aria-hidden />
      </div>
      {Array.from({
      length: 5
    }).map((_, i) => <div key={i} className={cn('grid items-center gap-4 border-b border-cmd-line px-6 py-2.5', NS_ROW_GRID)}>
          <div className="flex items-start gap-2.5">
            <div className="mt-px h-3.5 w-3.5 shrink-0 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-3 w-28 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
              <div className="h-2 w-44 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
            </div>
          </div>
          <div className="h-3 w-10 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
          <div className="h-3 w-6 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
          <div className="h-3 w-16 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
          <span />
        </div>)}
    </div>;
}
