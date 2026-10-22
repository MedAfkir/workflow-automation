import { useMemo, useRef, useState } from 'react';

import { errorMessage } from '@/shared/api/client';
import { useHotkeys } from '@/shared/hooks/useHotkeys';
import { ChipGroup, type ChipOption } from '@/shared/ui/ChipGroup';
import { PageHeader } from '@/shared/ui/PageHeader';
import { SearchField } from '@/shared/ui/SearchField';
import { ErrorState } from '@/shared/ui/States';
import { TableSkeleton } from '@/shared/ui/Table';
import { ResultCount, Toolbar, ToolbarDivider } from '@/shared/ui/Toolbar';

import { NS_COLUMNS, NS_ROW_GRID } from '../components/grid';
import { NamespaceRowSkeleton, NamespacesTable } from '../components/NamespacesTable';
import { useNamespaces } from '../queries';

type Sort = 'RECENT' | 'NAME' | 'WORKFLOWS';

const SORT_CHIPS: ChipOption<Sort>[] = [
  { value: 'RECENT', label: 'Recent' },
  { value: 'NAME', label: 'Name' },
  { value: 'WORKFLOWS', label: 'Workflows' },
];

function sortTime(iso: string | null): number {
  return iso ? new Date(iso).getTime() : -Infinity;
}

export function NamespacesListPage() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort>('RECENT');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { data, isLoading, isError, error } = useNamespaces();
  const namespaces = useMemo(() => data ?? [], [data]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matched = namespaces.filter(
      (n) =>
        !q ||
        n.name.toLowerCase().includes(q) ||
        n.workflowKeys.some((k) => k.toLowerCase().includes(q)),
    );
    if (sort === 'NAME') return matched.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'WORKFLOWS') {
      return matched.sort(
        (a, b) => b.workflowCount - a.workflowCount || a.name.localeCompare(b.name),
      );
    }
    return matched.sort((a, b) => sortTime(b.updatedAt) - sortTime(a.updatedAt));
  }, [namespaces, search, sort]);

  useHotkeys({ '/': () => searchInputRef.current?.focus() });

  return (
    <div className="flex h-full flex-col bg-cmd-bg font-mono text-cmd-fg">
      <PageHeader
        title="Namespaces"
        description="Every namespace across the platform, with the workflows it groups. Open one to see its workflows."
      />

      <Toolbar>
        <ChipGroup
          label="Sort"
          options={SORT_CHIPS}
          isActive={(value) => value === sort}
          onSelect={setSort}
        />
        <ToolbarDivider />
        <SearchField
          value={search}
          onChange={setSearch}
          inputRef={searchInputRef}
          placeholder="Filter by namespace or workflow"
          ariaLabel="Filter namespaces"
        />
        <ResultCount total={namespaces.length} shown={visible.length} noun="namespace" />
      </Toolbar>

      {isError ? (
        <ErrorState title="Can't reach the backend" message={errorMessage(error)} />
      ) : isLoading ? (
        <TableSkeleton grid={NS_ROW_GRID} columns={NS_COLUMNS} rows={5}>
          <NamespaceRowSkeleton />
        </TableSkeleton>
      ) : (
        <NamespacesTable
          namespaces={visible}
          hasAny={namespaces.length > 0}
          isFiltered={search.trim() !== ''}
          onClearFilters={() => setSearch('')}
        />
      )}
    </div>
  );
}
