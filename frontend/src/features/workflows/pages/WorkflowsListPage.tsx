import { Plus } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { errorMessage } from '@/shared/api/client';
import { FilterInput } from '@/shared/filter/FilterInput';
import {
  compileMatcher,
  type FilterSchema,
  setSingleValue,
  valuesForKey,
} from '@/shared/filter/filterQuery';
import { useHotkeys } from '@/shared/hooks/useHotkeys';
import { Button } from '@/shared/ui/Button';
import { ChipGroup, type ChipOption } from '@/shared/ui/ChipGroup';
import { Kbd } from '@/shared/ui/Kbd';
import { PageHeader } from '@/shared/ui/PageHeader';
import { ErrorState } from '@/shared/ui/States';
import { TableSkeleton } from '@/shared/ui/Table';
import { ResultCount, Toolbar, ToolbarDivider } from '@/shared/ui/Toolbar';

import { WF_COLUMNS, WF_ROW_GRID } from '../components/grid';
import { WorkflowRowSkeleton, WorkflowsTable } from '../components/WorkflowsTable';
import { useWorkflows } from '../queries';
import type { WorkflowSummary } from '../types';

type EnabledChip = 'ALL' | 'true' | 'false';

const WF_FILTER_SCHEMA: FilterSchema<WorkflowSummary> = {
  fields: [
    {
      key: 'namespace',
      label: 'Namespace',
      description: 'Workflow namespace',
      match: 'substring',
      get: (w) => w.namespace,
    },
    {
      key: 'key',
      label: 'Key',
      description: 'Workflow key',
      match: 'substring',
      get: (w) => w.key,
    },
    {
      key: 'enabled',
      label: 'Enabled',
      description: 'true or false',
      match: 'enum',
      values: ['true', 'false'],
      get: (w) => String(w.enabled),
    },
  ],
  text: (w) => [w.key, w.namespace],
};

const ENABLED_CHIPS: ChipOption<EnabledChip>[] = [
  { value: 'ALL', label: 'All' },
  { value: 'true', label: 'Enabled' },
  { value: 'false', label: 'Disabled' },
];

export function WorkflowsListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => {
    const ns = searchParams.get('ns');
    return ns ? `namespace:${ns}` : '';
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { data, isLoading, isError, error } = useWorkflows();
  const workflows = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const match = compileMatcher(query, WF_FILTER_SCHEMA);
    return workflows.filter(match);
  }, [workflows, query]);

  const enabledValues = valuesForKey(query, 'enabled');
  const isChipActive = (value: EnabledChip) =>
    value === 'ALL'
      ? enabledValues.length === 0
      : enabledValues.length === 1 && enabledValues[0].toLowerCase() === value;
  const selectEnabled = (value: EnabledChip) =>
    setQuery(setSingleValue(query, 'enabled', value === 'ALL' ? null : value));

  useHotkeys({
    '/': () => searchInputRef.current?.focus(),
    n: () => navigate('/workflows/new'),
  });

  return (
    <div className="flex h-full flex-col bg-cmd-bg font-mono text-cmd-fg">
      <PageHeader
        title="Workflows"
        description="Definitions across all namespaces. Open one to run it and inspect its graph."
        actions={
          <Button asChild variant="primary">
            <Link to="/workflows/new">
              <Plus className="h-3.5 w-3.5" aria-hidden />
              New workflow
              <Kbd variant="accent" className="ml-0.5">
                N
              </Kbd>
            </Link>
          </Button>
        }
      />

      <Toolbar>
        <ChipGroup options={ENABLED_CHIPS} isActive={isChipActive} onSelect={selectEnabled} />
        <ToolbarDivider />
        <FilterInput
          className="w-96"
          value={query}
          onChange={setQuery}
          schema={WF_FILTER_SCHEMA}
          items={workflows}
          inputRef={searchInputRef}
          ariaLabel="Filter workflows"
          placeholder="Filter - try namespace:demo or enabled:true"
        />
        <ResultCount total={workflows.length} shown={filtered.length} noun="workflow" />
      </Toolbar>

      {isError ? (
        <ErrorState title="Can't reach the backend" message={errorMessage(error)} />
      ) : isLoading ? (
        <TableSkeleton grid={WF_ROW_GRID} columns={WF_COLUMNS} rows={6}>
          <WorkflowRowSkeleton />
        </TableSkeleton>
      ) : (
        <WorkflowsTable
          workflows={filtered}
          hasAny={workflows.length > 0}
          isFiltered={query.trim() !== ''}
          onClearFilters={() => setQuery('')}
        />
      )}
    </div>
  );
}
