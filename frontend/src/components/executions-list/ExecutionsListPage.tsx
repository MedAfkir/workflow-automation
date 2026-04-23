import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Filters, type StateFilter } from './Filters';
import { ExecutionsTable } from './ExecutionsTable';
import { ROW_GRID } from './grid';
import { cn } from '@/lib/utils';
import { useExecutions } from '@/lib/api/executions';
export function ExecutionsListPage() {
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<StateFilter>('ALL');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const {
    data,
    isLoading,
    isError,
    error
  } = useExecutions({
    limit: 50
  });
  const filtered = useMemo(() => {
    const all = data ?? [];
    const q = search.trim().toLowerCase();
    return all.filter(e => {
      if (stateFilter !== 'ALL' && e.state !== stateFilter) return false;
      if (!q) return true;
      return e.workflowKey.toLowerCase().includes(q) || e.workflowNamespace.toLowerCase().includes(q) || e.id.toLowerCase().includes(q);
    });
  }, [data, search, stateFilter]);
  const isFiltered = search.trim() !== '' || stateFilter !== 'ALL';
  const clearFilters = () => {
    setSearch('');
    setStateFilter('ALL');
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
            Executions
          </h1>
          <p className="mt-0.5 font-mono text-[11px] text-cmd-fg-mute">
            Recent runs across all workflows. Refreshes every 5s.
          </p>
        </div>
      </header>

      <Filters search={search} onSearchChange={setSearch} stateFilter={stateFilter} onStateFilterChange={setStateFilter} totalCount={data?.length ?? 0} filteredCount={filtered.length} searchInputRef={searchInputRef} />

      {isError ? <ErrorState message={(error as Error | null)?.message ?? 'Unknown error'} /> : isLoading ? <SkeletonTable /> : <ExecutionsTable executions={filtered} hasAnyExecutions={(data?.length ?? 0) > 0} isFiltered={isFiltered} onClearFilters={clearFilters} />}
    </div>;
}
function SkeletonTable() {
  return <div className="flex-1 overflow-hidden bg-cmd-surface" aria-busy="true">
      <div className={cn('grid items-center gap-4 border-b border-cmd-line-strong px-6 py-2', ROW_GRID, 'font-mono text-[10px] uppercase tracking-[0.12em] text-cmd-fg-mute')}>
        <div>Status</div>
        <div>Workflow</div>
        <div>Trigger</div>
        <div>Started</div>
        <div>Duration</div>
        <div aria-hidden />
      </div>
      {Array.from({
      length: 8
    }).map((_, i) => <div key={i} className={cn('grid items-center gap-4 border-b border-cmd-line px-6 py-2.5', ROW_GRID)}>
          <Bar w="w-20" />
          <div className="space-y-1.5">
            <Bar w="w-40" />
            <Bar w="w-56" h="h-2" />
          </div>
          <Bar w="w-14" />
          <Bar w="w-16" />
          <Bar w="w-10" />
          <span />
        </div>)}
    </div>;
}
function Bar({
  w,
  h = 'h-3'
}: {
  w: string;
  h?: string;
}) {
  return <div className={cn('rounded-sm bg-cmd-hover motion-safe:animate-pulse', w, h)} />;
}
function ErrorState({
  message
}: {
  message: string;
}) {
  return <div className="flex flex-1 items-center justify-center bg-cmd-surface p-8">
      <div className="max-w-md text-center">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md border border-cmd-line bg-cmd-fail-wash">
          <AlertTriangle className="h-4 w-4 text-run-failed" aria-hidden />
        </div>
        <div className="font-mono text-[13px] text-cmd-fg">
          Can't reach the backend
        </div>
        <p className="mx-auto mt-2 max-w-sm break-all font-mono text-[11px] text-cmd-fg-mute">
          {message}
        </p>
        <p className="mt-3 font-mono text-[11px] text-cmd-fg-dim">
          Check the API on <span className="text-cmd-fg">:8080</span>.
          Retrying every 5s.
        </p>
      </div>
    </div>;
}
