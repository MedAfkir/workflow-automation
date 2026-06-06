import { type RefObject } from 'react';
import { cn } from '@/lib/utils';
import type { ExecutionState, ExecutionSummary } from '@/lib/types';
import { setSingleValue, valuesForKey, type FilterSchema } from '@/lib/filterQuery';
import { FilterInput } from '@/components/filter/FilterInput';
interface FiltersProps {
  query: string;
  onQueryChange: (value: string) => void;
  schema: FilterSchema<ExecutionSummary>;
  items: ExecutionSummary[];
  totalCount: number;
  filteredCount: number;
  searchInputRef: RefObject<HTMLInputElement>;
}
const STATE_CHIPS: {
  value: 'ALL' | ExecutionState;
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
  query,
  onQueryChange,
  schema,
  items,
  totalCount,
  filteredCount,
  searchInputRef
}: FiltersProps) {
  const states = valuesForKey(query, 'state');
  const isActive = (value: 'ALL' | ExecutionState) => value === 'ALL' ? states.length === 0 : states.length === 1 && states[0].toUpperCase() === value;
  const selectState = (value: 'ALL' | ExecutionState) => onQueryChange(setSingleValue(query, 'state', value === 'ALL' ? null : value));
  return <div className="flex items-center gap-2 border-b border-cmd-line bg-cmd-raised px-6 py-3">
      <div className="flex items-center gap-1">
        {STATE_CHIPS.map(({
        value,
        label
      }) => {
        const active = isActive(value);
        return <button key={value} type="button" aria-pressed={active} onClick={() => selectState(value)} className={cn('rounded-md border px-2.5 py-0.5 font-mono text-[11px]', 'whitespace-nowrap outline-none transition-colors', 'focus-visible:ring-2 focus-visible:ring-cmd-accent', active ? 'border-cmd-accent-dim bg-cmd-sel text-cmd-accent' : 'border-cmd-line text-cmd-fg-mute hover:bg-cmd-hover hover:text-cmd-fg-dim')}>
              {label}
            </button>;
      })}
      </div>

      <span className="mx-1 h-4 w-px bg-cmd-line" />

      <FilterInput className="w-96" value={query} onChange={onQueryChange} schema={schema} items={items} inputRef={searchInputRef} ariaLabel="Filter executions" placeholder="Filter - try state:running or workflow:greet" />

      <span className="ml-auto font-mono text-[11px] tabular-nums text-cmd-fg-mute">
        {filteredCount === totalCount ? `${totalCount} execution${totalCount === 1 ? '' : 's'}` : `${filteredCount} / ${totalCount}`}
      </span>
    </div>;
}
