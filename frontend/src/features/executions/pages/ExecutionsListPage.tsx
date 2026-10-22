import { useMemo, useRef, useState } from 'react';

import { errorMessage } from '@/shared/api/client';
import { compileMatcher, type FilterSchema } from '@/shared/filter/filterQuery';
import { useHotkeys } from '@/shared/hooks/useHotkeys';
import { PageHeader } from '@/shared/ui/PageHeader';
import { ErrorState } from '@/shared/ui/States';
import { TableSkeleton } from '@/shared/ui/Table';

import { ExecutionFilters } from '../components/ExecutionFilters';
import { ExecutionRowSkeleton } from '../components/ExecutionRow';
import { ExecutionsTable } from '../components/ExecutionsTable';
import { EXECUTION_COLUMNS, ROW_GRID } from '../components/grid';
import { useExecutions } from '../queries';
import type { ExecutionSummary } from '../types';

const EXEC_FILTER_SCHEMA: FilterSchema<ExecutionSummary> = {
  fields: [
    {
      key: 'state',
      label: 'State',
      description: 'Run status',
      match: 'enum',
      values: ['CREATED', 'RUNNING', 'SUCCESS', 'FAILED', 'KILLED'],
      get: (e) => e.state,
    },
    {
      key: 'trigger',
      label: 'Trigger',
      description: 'How it started',
      match: 'enum',
      values: ['MANUAL', 'SCHEDULE', 'WEBHOOK'],
      get: (e) => e.triggerType,
    },
    {
      key: 'workflow',
      label: 'Workflow',
      description: 'Workflow key',
      match: 'substring',
      get: (e) => e.workflowKey,
    },
    {
      key: 'namespace',
      label: 'Namespace',
      description: 'Workflow namespace',
      match: 'substring',
      get: (e) => e.workflowNamespace,
    },
    {
      key: 'execution',
      label: 'Execution',
      description: 'Execution id',
      match: 'substring',
      suggest: false,
      get: (e) => e.id,
    },
  ],
  text: (e) => [e.workflowKey, e.workflowNamespace, e.id],
};

export function ExecutionsListPage() {
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { data, isLoading, isError, error } = useExecutions({ limit: 50 });

  const filtered = useMemo(() => {
    const match = compileMatcher(query, EXEC_FILTER_SCHEMA);
    return (data ?? []).filter(match);
  }, [data, query]);

  useHotkeys({ '/': () => searchInputRef.current?.focus() });

  return (
    <div className="flex h-full flex-col bg-cmd-bg font-mono text-cmd-fg">
      <PageHeader
        title="Executions"
        description="Recent runs across all workflows. Refreshes every 5s."
      />

      <ExecutionFilters
        query={query}
        onQueryChange={setQuery}
        schema={EXEC_FILTER_SCHEMA}
        items={data ?? []}
        totalCount={data?.length ?? 0}
        filteredCount={filtered.length}
        searchInputRef={searchInputRef}
      />

      {isError ? (
        <ErrorState title="Can't reach the backend" message={errorMessage(error)}>
          <p className="mt-3 text-xs text-cmd-fg-dim">
            Check the API on <span className="text-cmd-fg">:8080</span>. Retrying every 5s.
          </p>
        </ErrorState>
      ) : isLoading ? (
        <TableSkeleton grid={ROW_GRID} columns={EXECUTION_COLUMNS} rows={8}>
          <ExecutionRowSkeleton />
        </TableSkeleton>
      ) : (
        <ExecutionsTable
          executions={filtered}
          hasAnyExecutions={(data?.length ?? 0) > 0}
          isFiltered={query.trim() !== ''}
          onClearFilters={() => setQuery('')}
        />
      )}
    </div>
  );
}
