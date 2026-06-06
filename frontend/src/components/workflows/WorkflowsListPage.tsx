import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkflows } from '@/lib/api/workflows';
import { mockWorkflows } from '@/lib/mockData';
import { compileMatcher, setSingleValue, valuesForKey, type FilterSchema } from '@/lib/filterQuery';
import type { WorkflowSummary } from '@/lib/types';
import { FilterInput } from '@/components/filter/FilterInput';
import { WorkflowsTable } from './WorkflowsTable';
import { WF_ROW_GRID } from './grid';
const WF_FILTER_SCHEMA: FilterSchema<WorkflowSummary> = {
  fields: [{
    key: 'namespace',
    label: 'Namespace',
    description: 'Workflow namespace',
    match: 'substring',
    get: w => w.namespace
  }, {
    key: 'key',
    label: 'Key',
    description: 'Workflow key',
    match: 'substring',
    get: w => w.key
  }, {
    key: 'enabled',
    label: 'Enabled',
    description: 'true or false',
    match: 'enum',
    values: ['true', 'false'],
    get: w => String(w.enabled)
  }],
  text: w => [w.key, w.namespace]
};
const ENABLED_CHIPS: {
  value: 'ALL' | 'true' | 'false';
  label: string;
}[] = [{
  value: 'ALL',
  label: 'All'
}, {
  value: 'true',
  label: 'Enabled'
}, {
  value: 'false',
  label: 'Disabled'
}];
export function WorkflowsListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => {
    const ns = searchParams.get('ns');
    return ns ? `namespace:${ns}` : '';
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const {
    data,
    isLoading,
    isError
  } = useWorkflows();
  const demo = isError;
  const workflows = demo ? mockWorkflows : data ?? [];
  const filtered = useMemo(() => {
    const match = compileMatcher(query, WF_FILTER_SCHEMA);
    return workflows.filter(match);
  }, [workflows, query]);
  const enabledValues = valuesForKey(query, 'enabled');
  const isChipActive = (value: 'ALL' | 'true' | 'false') => value === 'ALL' ? enabledValues.length === 0 : enabledValues.length === 1 && enabledValues[0].toLowerCase() === value;
  const selectEnabled = (value: 'ALL' | 'true' | 'false') => setQuery(setSingleValue(query, 'enabled', value === 'ALL' ? null : value));
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
      } else if ((e.key === 'n' || e.key === 'N') && !typing) {
        e.preventDefault();
        navigate('/workflows/new');
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate]);
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
          {ENABLED_CHIPS.map(({
          value,
          label
        }) => {
          const active = isChipActive(value);
          return <button key={value} type="button" aria-pressed={active} onClick={() => selectEnabled(value)} className={cn('rounded-md border px-2.5 py-0.5 font-mono text-[11px]', 'whitespace-nowrap outline-none transition-colors', 'focus-visible:ring-2 focus-visible:ring-cmd-accent', active ? 'border-cmd-accent-dim bg-cmd-sel text-cmd-accent' : 'border-cmd-line text-cmd-fg-mute hover:bg-cmd-hover hover:text-cmd-fg-dim')}>
                {label}
              </button>;
        })}
        </div>

        <span className="mx-1 h-4 w-px bg-cmd-line" />

        <FilterInput className="w-96" value={query} onChange={setQuery} schema={WF_FILTER_SCHEMA} items={workflows} inputRef={searchInputRef} ariaLabel="Filter workflows" placeholder="Filter - try namespace:demo or enabled:true" />

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
