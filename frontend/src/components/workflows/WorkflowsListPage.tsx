import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkflows } from '@/lib/api/workflows';
import { mockWorkflows } from '@/lib/mockData';
import { WorkflowsTable } from './WorkflowsTable';
import { WF_ROW_GRID } from './grid';
type EnabledFilter = 'ALL' | 'ENABLED' | 'DISABLED';
const CHIPS: {
  value: EnabledFilter;
  label: string;
}[] = [{
  value: 'ALL',
  label: 'All'
}, {
  value: 'ENABLED',
  label: 'Enabled'
}, {
  value: 'DISABLED',
  label: 'Disabled'
}];
export function WorkflowsListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get('ns') ?? '');
  const [filter, setFilter] = useState<EnabledFilter>('ALL');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const {
    data,
    isLoading,
    isError
  } = useWorkflows();
  const demo = isError;
  const workflows = demo ? mockWorkflows : data ?? [];
  const filtered = useMemo(() => {
    const all = workflows;
    const q = search.trim().toLowerCase();
    return all.filter(w => {
      if (filter === 'ENABLED' && !w.enabled) return false;
      if (filter === 'DISABLED' && w.enabled) return false;
      if (!q) return true;
      return w.key.toLowerCase().includes(q) || w.namespace.toLowerCase().includes(q);
    });
  }, [workflows, search, filter]);
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
      } else if ((e.key === 'n' || e.key === 'N') && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        navigate('/workflows/new');
      } else if (e.key === 'Escape' && el === searchInputRef.current) {
        if (search) setSearch('');
        searchInputRef.current?.blur();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [search, navigate]);
  return <div className="flex h-full flex-col bg-cmd-bg font-mono text-cmd-fg">
      <header className="flex h-16 items-center justify-between gap-4 border-b border-cmd-line bg-cmd-raised px-6">
        <div>
          <h1 className="font-mono text-[15px] font-semibold tracking-tight text-cmd-fg">
            Workflows
          </h1>
          <p className="mt-0.5 font-mono text-[11px] text-cmd-fg-mute">
            Definitions across all namespaces. Open one to run it and
            inspect its graph.
          </p>
        </div>
        <Link to="/workflows/new" className={cn('inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3', 'bg-cmd-accent font-mono text-[13px] text-cmd-bg outline-none', 'transition-[filter] hover:brightness-110', 'focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
          <Plus className="h-3.5 w-3.5" aria-hidden />
          New workflow
          <kbd className="ml-0.5 rounded bg-cmd-bg px-1 text-[10px] text-cmd-accent">
            N
          </kbd>
        </Link>
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
          <input ref={searchInputRef} type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by key or namespace" aria-label="Filter workflows" className={cn('min-w-0 flex-1 bg-transparent outline-none', 'font-mono text-[12px] text-cmd-fg', 'placeholder:text-cmd-fg-mute')} />
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
          {filtered.length === workflows.length ? `${workflows.length} workflow${workflows.length === 1 ? '' : 's'}` : `${filtered.length} / ${workflows.length}`}
        </span>
      </div>

      {isLoading ? <Skeleton /> : <WorkflowsTable workflows={filtered} hasAny={workflows.length > 0} isFiltered={isFiltered} onClearFilters={clearFilters} />}
    </div>;
}
function Skeleton() {
  return <div className="flex-1 overflow-hidden bg-cmd-surface" aria-busy="true">
      <div className={cn('grid items-center gap-4 border-b border-cmd-line-strong px-6 py-2', WF_ROW_GRID, 'font-mono text-[10px] uppercase tracking-[0.12em] text-cmd-fg-mute')}>
        <div>State</div>
        <div>Workflow</div>
        <div>Triggers</div>
        <div>Revision</div>
        <div>Updated</div>
        <div aria-hidden />
      </div>
      {Array.from({
      length: 6
    }).map((_, i) => <div key={i} className={cn('grid items-center gap-4 border-b border-cmd-line px-6 py-2.5', WF_ROW_GRID)}>
          <div className="h-3 w-16 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-3 w-36 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
            <div className="h-2 w-20 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
          </div>
          <div className="h-3 w-8 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
          <div className="h-3 w-12 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
          <div className="h-3 w-16 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
          <span />
        </div>)}
    </div>;
}
