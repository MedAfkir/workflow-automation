import { Terminal } from 'lucide-react';

import { useRovingFocus } from '@/shared/hooks/useRovingFocus';
import { CommandHint, EmptyState, NoMatches } from '@/shared/ui/States';
import { TableHeader } from '@/shared/ui/Table';

import type { ExecutionSummary } from '../types';
import { ExecutionRow } from './ExecutionRow';
import { EXECUTION_COLUMNS, ROW_GRID } from './grid';

interface ExecutionsTableProps {
  executions: ExecutionSummary[];
  hasAnyExecutions: boolean;
  isFiltered: boolean;
  onClearFilters: () => void;
}

export function ExecutionsTable({
  executions,
  hasAnyExecutions,
  isFiltered,
  onClearFilters,
}: ExecutionsTableProps) {
  const roving = useRovingFocus<HTMLAnchorElement>(executions.map((e) => e.id));

  if (executions.length === 0) {
    return hasAnyExecutions && isFiltered ? (
      <NoMatches message="No runs match these filters" onClear={onClearFilters} />
    ) : (
      <EmptyState
        icon={Terminal}
        title="No executions yet"
        description="Runs appear here the moment a workflow fires. Trigger one from the CLI:"
      >
        <CommandHint>wf run &lt;namespace&gt;/&lt;workflow&gt;</CommandHint>
      </EmptyState>
    );
  }

  return (
    <div
      className="flex-1 overflow-auto bg-cmd-surface"
      onKeyDown={roving.onKeyDown}
      aria-label="Executions"
    >
      <TableHeader grid={ROW_GRID} columns={EXECUTION_COLUMNS} />
      <div>
        {executions.map((e) => (
          <ExecutionRow
            key={e.id}
            execution={e}
            active={e.id === roving.activeId}
            {...roving.itemProps(e.id)}
          />
        ))}
      </div>
    </div>
  );
}
