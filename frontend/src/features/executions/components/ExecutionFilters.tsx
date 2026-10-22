import type { RefObject } from 'react';

import { FilterInput } from '@/shared/filter/FilterInput';
import { type FilterSchema, setSingleValue, valuesForKey } from '@/shared/filter/filterQuery';
import { ChipGroup, type ChipOption } from '@/shared/ui/ChipGroup';
import { ResultCount, Toolbar, ToolbarDivider } from '@/shared/ui/Toolbar';

import type { ExecutionState, ExecutionSummary } from '../types';

type StateChip = 'ALL' | ExecutionState;

const STATE_CHIPS: ChipOption<StateChip>[] = [
  { value: 'ALL', label: 'All' },
  { value: 'RUNNING', label: 'Running' },
  { value: 'SUCCESS', label: 'Success' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'KILLED', label: 'Killed' },
];

interface ExecutionFiltersProps {
  query: string;
  onQueryChange: (value: string) => void;
  schema: FilterSchema<ExecutionSummary>;
  items: ExecutionSummary[];
  totalCount: number;
  filteredCount: number;
  searchInputRef: RefObject<HTMLInputElement>;
}

export function ExecutionFilters({
  query,
  onQueryChange,
  schema,
  items,
  totalCount,
  filteredCount,
  searchInputRef,
}: ExecutionFiltersProps) {
  const states = valuesForKey(query, 'state');
  const isActive = (value: StateChip) =>
    value === 'ALL'
      ? states.length === 0
      : states.length === 1 && states[0].toUpperCase() === value;
  const selectState = (value: StateChip) =>
    onQueryChange(setSingleValue(query, 'state', value === 'ALL' ? null : value));

  return (
    <Toolbar>
      <ChipGroup options={STATE_CHIPS} isActive={isActive} onSelect={selectState} />
      <ToolbarDivider />
      <FilterInput
        className="w-96"
        value={query}
        onChange={onQueryChange}
        schema={schema}
        items={items}
        inputRef={searchInputRef}
        ariaLabel="Filter executions"
        placeholder="Filter - try state:running or workflow:greet"
      />
      <ResultCount total={totalCount} shown={filteredCount} noun="execution" />
    </Toolbar>
  );
}
