import { ChevronRight, KeyRound, Plus } from 'lucide-react';
import { forwardRef, useState } from 'react';

import { useRovingFocus } from '@/shared/hooks/useRovingFocus';
import { cn } from '@/shared/lib/cn';
import { relativeTime } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import { EmptyState, NoMatches } from '@/shared/ui/States';
import { SkeletonBar, TableHeader } from '@/shared/ui/Table';

import type { SecretSummary } from '../types';
import { SECRET_COLUMNS, SECRET_ROW_GRID } from './grid';
import { SecretRowPanel } from './SecretRowPanel';

interface SecretsTableProps {
  secrets: SecretSummary[];
  namespace: string;
  hasAny: boolean;
  isFiltered: boolean;
  onClearFilters: () => void;
  onRequestCreate: () => void;
}

export function SecretsTable({
  secrets,
  namespace,
  hasAny,
  isFiltered,
  onClearFilters,
  onRequestCreate,
}: SecretsTableProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const roving = useRovingFocus<HTMLButtonElement>(
    secrets.map((s) => s.id),
    !openId,
  );

  if (secrets.length === 0) {
    return hasAny && isFiltered ? (
      <NoMatches
        message="No keys match this filter"
        clearLabel="Clear filter"
        onClear={onClearFilters}
      />
    ) : (
      <EmptyState
        icon={KeyRound}
        title={`No secrets in ${namespace}`}
        description={
          <>
            Add one here, then reference it from a plugin as{' '}
            <span className="text-cmd-fg-dim">{namespace}/&lt;key&gt;</span>. Values are encrypted
            and never shown again.
          </>
        }
      >
        <Button
          variant="primary"
          size="sm"
          onClick={onRequestCreate}
          className="mt-4 h-auto px-3 py-1.5"
        >
          <Plus className="h-3 w-3" aria-hidden />
          New secret
        </Button>
      </EmptyState>
    );
  }

  return (
    <div
      className="flex-1 overflow-auto bg-cmd-surface"
      onKeyDown={roving.onKeyDown}
      aria-label={`Secrets in ${namespace}`}
    >
      <TableHeader grid={SECRET_ROW_GRID} columns={SECRET_COLUMNS} />
      <div>
        {secrets.map((s) => (
          <SecretRow
            key={s.id}
            secret={s}
            active={s.id === roving.activeId}
            open={s.id === openId}
            onOpen={() => {
              roving.setActiveId(s.id);
              setOpenId(s.id);
            }}
            onClose={() => setOpenId(null)}
            {...roving.itemProps(s.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function SecretRowSkeleton() {
  return (
    <>
      <SkeletonBar className="w-40" />
      <SkeletonBar className="w-8" />
      <SkeletonBar className="w-16" />
      <SkeletonBar className="w-16" />
    </>
  );
}

interface SecretRowProps {
  secret: SecretSummary;
  active: boolean;
  open: boolean;
  tabIndex: number;
  onFocus: () => void;
  onOpen: () => void;
  onClose: () => void;
}

const SecretRow = forwardRef<HTMLButtonElement, SecretRowProps>(function SecretRow(
  { secret, active, open, tabIndex, onFocus, onOpen, onClose },
  ref,
) {
  return (
    <div className="relative">
      <button
        ref={ref}
        type="button"
        tabIndex={tabIndex}
        onFocus={onFocus}
        onClick={onOpen}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${secret.namespace}/${secret.key}, version ${secret.version}`}
        className={cn(
          'group grid w-full items-center gap-4 px-6 py-2.5 text-left',
          SECRET_ROW_GRID,
          'border-b border-cmd-line outline-none transition-colors',
          'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cmd-accent',
          active || open ? 'bg-cmd-sel' : 'hover:bg-cmd-hover',
        )}
      >
        <div className="min-w-0 truncate font-mono text-base font-medium text-cmd-fg">
          {secret.key}
        </div>
        <div className="font-mono text-xs tabular-nums text-cmd-fg-dim">v{secret.version}</div>
        <div className="font-mono text-xs tabular-nums text-cmd-fg-dim" title={secret.updatedAt}>
          {relativeTime(secret.updatedAt)}
        </div>
        <div className="font-mono text-xs tabular-nums text-cmd-fg-dim" title={secret.createdAt}>
          {relativeTime(secret.createdAt)}
        </div>
        <ChevronRight
          className={cn(
            'h-3.5 w-3.5 text-cmd-fg-mute transition-opacity',
            open
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
          )}
          aria-hidden
        />
      </button>
      {open && <SecretRowPanel secret={secret} onClose={onClose} />}
    </div>
  );
});
