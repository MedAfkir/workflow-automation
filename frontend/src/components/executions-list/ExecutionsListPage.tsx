import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Filters } from './Filters';
import { ExecutionsTable } from './ExecutionsTable';
import { ROW_GRID } from './grid';
import { cn } from '@/lib/utils';
import { useExecutions } from '@/lib/api/executions';
import { compileMatcher, type FilterSchema } from '@/lib/filterQuery';
import type { ExecutionSummary } from '@/lib/types';
const EXEC_FILTER_SCHEMA: FilterSchema<ExecutionSummary> = {
  fields: [{
    key: 'state',
    label: 'State',
    description: 'Run status',
    match: 'enum',
    values: ['CREATED', 'RUNNING', 'SUCCESS', 'FAILED', 'KILLED'],
    get: e => e.state
  }, {
    key: 'trigger',
    label: 'Trigger',
    description: 'How it started',
    match: 'enum',
    values: ['MANUAL', 'SCHEDULE', 'WEBHOOK'],
    get: e => e.triggerType
  }, {
    key: 'workflow',
    label: 'Workflow',
    description: 'Workflow key',
    match: 'substring',
    get: e => e.workflowKey
  }, {
    key: 'namespace',
    label: 'Namespace',
    description: 'Workflow namespace',
    match: 'substring',
    get: e => e.workflowNamespace
  }, {
    key: 'execution',
    label: 'Execution',
    description: 'Execution id',
    match: 'substring',
    suggest: false,
    get: e => e.id
  }],
  text: e => [e.workflowKey, e.workflowNamespace, e.id]
};
export function ExecutionsListPage() {
  const [query, setQuery] = useState('');
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
    const match = compileMatcher(query, EXEC_FILTER_SCHEMA);
    return (data ?? []).filter(match);
  }, [data, query]);
  const isFiltered = query.trim() !== '';
  const clearFilters = () => setQuery('');
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = document.activeElement;
      const typing = el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (e.key === '/' && !typing) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
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

      <Filters query={query} onQueryChange={setQuery} schema={EXEC_FILTER_SCHEMA} items={data ?? []} totalCount={data?.length ?? 0} filteredCount={filtered.length} searchInputRef={searchInputRef} />

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
