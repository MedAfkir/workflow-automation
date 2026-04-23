import { type RefObject } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExecutionState } from '@/lib/types';
export type StateFilter = 'ALL' | ExecutionState;
interface FiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  stateFilter: StateFilter;
  onStateFilterChange: (value: StateFilter) => void;
  totalCount: number;
  filteredCount: number;
  searchInputRef: RefObject<HTMLInputElement>;
}
const STATE_CHIPS: {
  value: StateFilter;
  label: string;
}[] = [{
  value: 'ALL',
  label: 'All'
}, {
  value: 'RUNNING',
  label: 'Running'
}, {
  value: 'SUCCESS',
  label: 'Success'
}, {
  value: 'FAILED',
  label: 'Failed'
}, {
  value: 'KILLED',
  label: 'Killed'
}];
export function Filters({
  search,
  onSearchChange,
  stateFilter,
  onStateFilterChange,
  totalCount,
  filteredCount,
  searchInputRef
}: FiltersProps) {
  return <div className="flex items-center gap-2 border-b border-cmd-line bg-cmd-raised px-6 py-3">
      {}
      <div className="flex items-center gap-1">
        {STATE_CHIPS.map(({
        value,
        label
      }) => {
        const active = stateFilter === value;
        return <button key={value} type="button" aria-pressed={active} onClick={() => onStateFilterChange(value)} className={cn('rounded-md border px-2.5 py-0.5 font-mono text-[11px]', 'whitespace-nowrap outline-none transition-colors', 'focus-visible:ring-2 focus-visible:ring-cmd-accent', active ? 'border-cmd-accent-dim bg-cmd-sel text-cmd-accent' : 'border-cmd-line text-cmd-fg-mute hover:bg-cmd-hover hover:text-cmd-fg-dim')}>
              {label}
            </button>;
      })}
      </div>

      <span className="mx-1 h-4 w-px bg-cmd-line" />

      {}
      <div className={cn('group flex w-72 items-center gap-1.5 px-2 py-1', 'rounded-md border border-cmd-line bg-cmd-bg', 'focus-within:border-cmd-accent-dim')}>
        <Search className="h-3 w-3 shrink-0 text-cmd-fg-mute" aria-hidden />
        <input ref={searchInputRef} type="text" value={search} onChange={e => onSearchChange(e.target.value)} placeholder="Filter by workflow, namespace, id" aria-label="Filter executions" className={cn('min-w-0 flex-1 bg-transparent outline-none', 'font-mono text-[12px] text-cmd-fg', 'placeholder:text-cmd-fg-mute')} />
        {search ? <button type="button" onClick={() => onSearchChange('')} aria-label="Clear filter" className="text-cmd-fg-mute outline-none hover:text-cmd-fg-dim focus-visible:text-cmd-fg">
            <X className="h-3 w-3" />
          </button> : <kbd className={cn('rounded border border-cmd-line px-1 font-mono text-[10px] text-cmd-fg-mute', 'group-focus-within:opacity-0')} aria-hidden>
            /
          </kbd>}
      </div>

      {}
      <span className="ml-auto font-mono text-[11px] tabular-nums text-cmd-fg-mute">
        {filteredCount === totalCount ? `${totalCount} execution${totalCount === 1 ? '' : 's'}` : `${filteredCount} / ${totalCount}`}
      </span>
    </div>;
}
