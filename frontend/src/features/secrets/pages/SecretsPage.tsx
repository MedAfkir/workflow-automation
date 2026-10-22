import { KeyRound, Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { errorMessage } from '@/shared/api/client';
import { useHotkeys } from '@/shared/hooks/useHotkeys';
import { Button } from '@/shared/ui/Button';
import { Kbd } from '@/shared/ui/Kbd';
import { PageHeader } from '@/shared/ui/PageHeader';
import { SearchField } from '@/shared/ui/SearchField';
import { ErrorState } from '@/shared/ui/States';
import { TableSkeleton } from '@/shared/ui/Table';
import { ResultCount, Toolbar } from '@/shared/ui/Toolbar';

import { SECRET_COLUMNS, SECRET_ROW_GRID } from '../components/grid';
import { NamespacePicker } from '../components/NamespacePicker';
import { NamespaceSwitcher } from '../components/NamespaceSwitcher';
import { SecretFormPanel } from '../components/SecretFormPanel';
import { SecretRowSkeleton, SecretsTable } from '../components/SecretsTable';
import { rememberNamespace } from '../lib/recents';
import { useSecrets } from '../queries';
import type { SecretSummary } from '../types';

export function SecretsPage() {
  const { namespace } = useParams();
  if (!namespace) return <SecretsLanding />;
  return <NamespaceSecrets key={namespace} namespace={namespace} />;
}

function SecretsLanding() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col bg-cmd-bg font-mono text-cmd-fg">
      <PageHeader
        title="Secrets"
        description="Encrypted values, scoped per namespace. Open one to view its keys."
      />
      <div className="flex flex-1 items-center justify-center bg-cmd-surface p-8">
        <div className="w-[360px]">
          <div className="mb-3 flex items-center gap-2">
            <KeyRound className="h-3.5 w-3.5 text-cmd-accent" aria-hidden />
            <span className="font-mono text-base text-cmd-fg">Open a namespace</span>
          </div>
          <div className="overflow-hidden rounded-md border border-cmd-line bg-cmd-raised">
            <NamespacePicker onSelect={(ns) => navigate(`/secrets/${ns}`)} autoFocus />
          </div>
          <p className="mt-3 font-mono text-xs leading-relaxed text-cmd-fg-mute">
            Secrets are addressed as <span className="text-cmd-fg-dim">namespace/key</span> and
            resolved only at run time. Values are never displayed.
          </p>
        </div>
      </div>
    </div>
  );
}

function NamespaceSecrets({ namespace }: { namespace: string }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const createBtnRef = useRef<HTMLButtonElement>(null);
  const { data, isLoading, isError, error } = useSecrets(namespace);
  const secrets = useMemo(() => data ?? [], [data]);

  useEffect(() => {
    rememberNamespace(namespace);
  }, [namespace]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? secrets.filter((s) => s.key.toLowerCase().includes(q)) : secrets;
  }, [secrets, search]);

  useHotkeys({
    '/': () => searchInputRef.current?.focus(),
    n: () => setCreateOpen(true),
  });

  const onCreated = (secret: SecretSummary) => {
    setCreateOpen(false);
    rememberNamespace(secret.namespace);
    if (secret.namespace !== namespace) navigate(`/secrets/${secret.namespace}`);
  };

  return (
    <div className="flex h-full flex-col bg-cmd-bg font-mono text-cmd-fg">
      <PageHeader
        title="Secrets"
        meta={<NamespaceSwitcher namespace={namespace} />}
        actions={
          <>
            <Button
              ref={createBtnRef}
              variant="primary"
              onClick={() => setCreateOpen((o) => !o)}
              aria-haspopup="dialog"
              aria-expanded={createOpen}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              New secret
              <Kbd variant="accent" className="ml-0.5">
                N
              </Kbd>
            </Button>
            <SecretFormPanel
              open={createOpen}
              defaultNamespace={namespace}
              onClose={() => setCreateOpen(false)}
              onCreated={onCreated}
              triggerRef={createBtnRef}
            />
          </>
        }
      />

      <Toolbar>
        <SearchField
          value={search}
          onChange={setSearch}
          inputRef={searchInputRef}
          placeholder="Filter by key"
          ariaLabel="Filter secrets"
        />
        <ResultCount total={secrets.length} shown={filtered.length} noun="key" />
      </Toolbar>

      {isError ? (
        <ErrorState title="Can't reach the backend" message={errorMessage(error)} />
      ) : isLoading ? (
        <TableSkeleton grid={SECRET_ROW_GRID} columns={SECRET_COLUMNS} rows={6}>
          <SecretRowSkeleton />
        </TableSkeleton>
      ) : (
        <SecretsTable
          secrets={filtered}
          namespace={namespace}
          hasAny={secrets.length > 0}
          isFiltered={search.trim() !== ''}
          onClearFilters={() => setSearch('')}
          onRequestCreate={() => setCreateOpen(true)}
        />
      )}
    </div>
  );
}
