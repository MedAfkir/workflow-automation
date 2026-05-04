import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { KeyRound, Plus, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSecrets } from '@/lib/api/secrets';
import { mockSecretsFor } from '@/lib/mockData';
import type { SecretSummary } from '@/lib/types';
import { SECRET_ROW_GRID } from './grid';
import { rememberNamespace } from './recents';
import { SecretsTable } from './SecretsTable';
import { NamespaceSwitcher } from './NamespaceSwitcher';
import { NamespacePicker } from './NamespacePicker';
import { SecretFormPanel } from './SecretFormPanel';
export function SecretsListPage() {
  const {
    namespace
  } = useParams();
  if (!namespace) return <SecretsLanding />;
  return <NamespaceSecrets key={namespace} namespace={namespace} />;
}
function SecretsLanding() {
  const navigate = useNavigate();
  return <div className="flex h-full flex-col bg-cmd-bg font-mono text-cmd-fg">
      <header className="flex h-16 items-center border-b border-cmd-line bg-cmd-raised px-6">
        <div>
          <h1 className="font-mono text-[15px] font-semibold tracking-tight text-cmd-fg">
            Secrets
          </h1>
          <p className="mt-0.5 font-mono text-[11px] text-cmd-fg-mute">
            Encrypted values, scoped per namespace. Open one to view its keys.
          </p>
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center bg-cmd-surface p-8">
        <div className="w-[360px]">
          <div className="mb-3 flex items-center gap-2">
            <KeyRound className="h-3.5 w-3.5 text-cmd-accent" aria-hidden />
            <span className="font-mono text-[13px] text-cmd-fg">
              Open a namespace
            </span>
          </div>
          <div className="overflow-hidden rounded-md border border-cmd-line bg-cmd-raised">
            <NamespacePicker onSelect={ns => navigate(`/secrets/${ns}`)} autoFocus />
          </div>
          <p className="mt-3 font-mono text-[11px] leading-relaxed text-cmd-fg-mute">
            Secrets are addressed as{' '}
            <span className="text-cmd-fg-dim">namespace/key</span> and resolved
            only at run time. Values are never displayed.
          </p>
        </div>
      </div>
    </div>;
}
function NamespaceSecrets({
  namespace
}: {
  namespace: string;
}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const createBtnRef = useRef<HTMLButtonElement>(null);
  const {
    data,
    isLoading,
    isError,
    refetch
  } = useSecrets(namespace);
  const demo = isError;
  const secrets = demo ? mockSecretsFor(namespace) : data ?? [];
  useEffect(() => {
    rememberNamespace(namespace);
  }, [namespace]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? secrets.filter(s => s.key.toLowerCase().includes(q)) : secrets;
  }, [secrets, search]);
  const isFiltered = search.trim() !== '';
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = document.activeElement;
      const typing = el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (e.key === '/' && !typing) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if ((e.key === 'n' || e.key === 'N') && !typing) {
        e.preventDefault();
        setCreateOpen(true);
      } else if (e.key === 'Escape' && el === searchInputRef.current) {
        if (search) setSearch('');
        searchInputRef.current?.blur();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [search]);
  const onCreated = (s: SecretSummary) => {
    setCreateOpen(false);
    rememberNamespace(s.namespace);
    if (s.namespace !== namespace) navigate(`/secrets/${s.namespace}`);else void refetch();
  };
  const total = secrets.length;
  return <div className="flex h-full flex-col bg-cmd-bg font-mono text-cmd-fg">
      <header className="flex h-16 items-center justify-between gap-4 border-b border-cmd-line bg-cmd-raised px-6">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="font-mono text-[15px] font-semibold tracking-tight text-cmd-fg">
            Secrets
          </h1>
          <span className="h-4 w-px shrink-0 bg-cmd-line" aria-hidden />
          <NamespaceSwitcher namespace={namespace} />
        </div>
        <div className="relative shrink-0">
          <button ref={createBtnRef} type="button" onClick={() => setCreateOpen(o => !o)} aria-haspopup="dialog" aria-expanded={createOpen} className={cn('inline-flex h-8 items-center gap-1.5 rounded-md px-3', 'bg-cmd-accent font-mono text-[13px] text-cmd-bg outline-none', 'transition-[filter] hover:brightness-110', 'focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New secret
            <kbd className="ml-0.5 rounded bg-cmd-bg px-1 text-[10px] text-cmd-accent">
              N
            </kbd>
          </button>
          <SecretFormPanel open={createOpen} defaultNamespace={namespace} onClose={() => setCreateOpen(false)} onCreated={onCreated} triggerRef={createBtnRef} />
        </div>
      </header>

      <div className="flex items-center gap-2 border-b border-cmd-line bg-cmd-raised px-6 py-3">
        <div className={cn('group flex w-72 items-center gap-1.5 px-2 py-1', 'rounded-md border border-cmd-line bg-cmd-bg', 'focus-within:border-cmd-accent-dim')}>
          <Search className="h-3 w-3 shrink-0 text-cmd-fg-mute" aria-hidden />
          <input ref={searchInputRef} type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by key" aria-label="Filter secrets" className={cn('min-w-0 flex-1 bg-transparent outline-none', 'font-mono text-[12px] text-cmd-fg placeholder:text-cmd-fg-mute')} />
          {search ? <button type="button" onClick={() => setSearch('')} aria-label="Clear filter" className="text-cmd-fg-mute outline-none hover:text-cmd-fg-dim focus-visible:text-cmd-fg">
              <X className="h-3 w-3" />
            </button> : <kbd className={cn('rounded border border-cmd-line px-1 font-mono text-[10px] text-cmd-fg-mute', 'group-focus-within:opacity-0')} aria-hidden>
              /
            </kbd>}
        </div>

        {demo && <span className="ml-auto mr-3 shrink-0 rounded-md border border-cmd-line bg-cmd-surface px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-cmd-fg-mute" title="Backend unreachable; showing demo data">
            demo data
          </span>}
        <span className={cn('font-mono text-[11px] tabular-nums text-cmd-fg-mute', !demo && 'ml-auto')}>
          {filtered.length === total ? `${total} key${total === 1 ? '' : 's'}` : `${filtered.length} / ${total}`}
        </span>
      </div>

      {isLoading ? <SkeletonTable /> : <SecretsTable secrets={filtered} namespace={namespace} hasAny={total > 0} isFiltered={isFiltered} onClearFilters={() => setSearch('')} onChanged={() => void refetch()} onRequestCreate={() => setCreateOpen(true)} />}
    </div>;
}
function SkeletonTable() {
  return <div className="flex-1 overflow-hidden bg-cmd-surface" aria-busy="true">
      <div className={cn('grid items-center gap-4 border-b border-cmd-line-strong px-6 py-2', SECRET_ROW_GRID, 'font-mono text-[10px] uppercase tracking-[0.12em] text-cmd-fg-mute')}>
        <div>Key</div>
        <div>Version</div>
        <div>Updated</div>
        <div>Created</div>
        <div aria-hidden />
      </div>
      {Array.from({
      length: 6
    }).map((_, i) => <div key={i} className={cn('grid items-center gap-4 border-b border-cmd-line px-6 py-2.5', SECRET_ROW_GRID)}>
          <div className="h-3 w-40 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
          <div className="h-3 w-8 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
          <div className="h-3 w-16 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
          <div className="h-3 w-16 rounded-sm bg-cmd-hover motion-safe:animate-pulse" />
          <span />
        </div>)}
    </div>;
}
