import { useMemo, useRef, useState } from 'react';

import { errorMessage } from '@/shared/api/client';
import { useHotkeys } from '@/shared/hooks/useHotkeys';
import { ChipGroup, type ChipOption } from '@/shared/ui/ChipGroup';
import { PageHeader } from '@/shared/ui/PageHeader';
import { SearchField } from '@/shared/ui/SearchField';
import { ErrorState } from '@/shared/ui/States';
import { TableSkeleton } from '@/shared/ui/Table';
import { ResultCount, Toolbar, ToolbarDivider } from '@/shared/ui/Toolbar';

import { PLUGIN_COLUMNS, PLUGIN_ROW_GRID } from '../components/grid';
import { PluginRowSkeleton, PluginsTable } from '../components/PluginsTable';
import { usePlugins } from '../queries';

type KindFilter = 'ALL' | 'TASK' | 'TRIGGER';

const KIND_CHIPS: ChipOption<KindFilter>[] = [
  { value: 'ALL', label: 'All' },
  { value: 'TASK', label: 'Tasks' },
  { value: 'TRIGGER', label: 'Triggers' },
];

export function PluginsListPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<KindFilter>('ALL');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { data, isLoading, isError, error } = usePlugins();
  const plugins = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return plugins.filter((pl) => {
      if (filter !== 'ALL' && pl.kind !== filter) return false;
      if (!q) return true;

      return (
        pl.name.toLowerCase().includes(q) ||
        pl.id.toLowerCase().includes(q) ||
        pl.description.toLowerCase().includes(q) ||
        pl.categories.some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [plugins, search, filter]);

  const clearFilters = () => {
    setSearch('');
    setFilter('ALL');
  };

  useHotkeys({ '/': () => searchInputRef.current?.focus() });

  return (
    <div className="flex h-full flex-col bg-cmd-bg font-mono text-cmd-fg">
      <PageHeader
        title="Plugins"
        description="Installed task and trigger building blocks. Open one for its config schema."
      />

      <Toolbar>
        <ChipGroup
          options={KIND_CHIPS}
          isActive={(value) => value === filter}
          onSelect={setFilter}
        />
        <ToolbarDivider />
        <SearchField
          value={search}
          onChange={setSearch}
          inputRef={searchInputRef}
          placeholder="Filter by name, id or category"
          ariaLabel="Filter plugins"
        />
        <ResultCount total={plugins.length} shown={filtered.length} noun="plugin" />
      </Toolbar>

      {isError ? (
        <ErrorState title="Can't reach the backend" message={errorMessage(error)} />
      ) : isLoading ? (
        <TableSkeleton grid={PLUGIN_ROW_GRID} columns={PLUGIN_COLUMNS} rows={8}>
          <PluginRowSkeleton />
        </TableSkeleton>
      ) : (
        <PluginsTable
          plugins={filtered}
          hasAny={plugins.length > 0}
          isFiltered={search.trim() !== '' || filter !== 'ALL'}
          onClearFilters={clearFilters}
        />
      )}
    </div>
  );
}
