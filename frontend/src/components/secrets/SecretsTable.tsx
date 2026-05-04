import { forwardRef, useCallback, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ChevronRight, KeyRound, Plus } from 'lucide-react';
import { cn, relativeTime } from '@/lib/utils';
import type { SecretSummary } from '@/lib/types';
import { SECRET_ROW_GRID } from './grid';
import { SecretRowPanel } from './SecretRowPanel';
interface SecretsTableProps {
  secrets: SecretSummary[];
  namespace: string;
  hasAny: boolean;
  isFiltered: boolean;
  onClearFilters: () => void;
  onChanged: () => void;
  onRequestCreate: () => void;
}
export function SecretsTable({
  secrets,
  namespace,
  hasAny,
  isFiltered,
  onClearFilters,
  onChanged,
  onRequestCreate
}: SecretsTableProps) {
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const activeValid = activeId != null && secrets.some(s => s.id === activeId);
  const rovingId = activeValid ? activeId : secrets[0]?.id ?? null;
  const move = useCallback((delta: number) => {
    if (secrets.length === 0) return;
    const ids = secrets.map(s => s.id);
    const current = activeValid ? ids.indexOf(activeId!) : -1;
    const next = Math.max(0, Math.min(ids.length - 1, (current < 0 ? 0 : current) + delta));
    const id = ids[next];
    setActiveId(id);
    const el = rowRefs.current.get(id);
    el?.focus();
    el?.scrollIntoView({
      block: 'nearest'
    });
  }, [secrets, activeValid, activeId]);
  const onKeyDown = useCallback((e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (openId) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(-1);
    }
  }, [move, openId]);
  if (secrets.length === 0) {
    return hasAny && isFiltered ? <FilteredEmpty onClearFilters={onClearFilters} /> : <NamespaceEmpty namespace={namespace} onRequestCreate={onRequestCreate} />;
  }
  return <div className="flex-1 overflow-auto bg-cmd-surface" onKeyDown={onKeyDown} aria-label={`Secrets in ${namespace}`}>
      <div className={cn('sticky top-0 z-10 grid items-center gap-4 px-6 py-2', SECRET_ROW_GRID, 'border-b border-cmd-line-strong bg-cmd-raised', 'font-mono text-[10px] uppercase tracking-[0.12em] text-cmd-fg-mute')}>
        <div>Key</div>
        <div>Version</div>
        <div>Updated</div>
        <div>Created</div>
        <div aria-hidden />
      </div>

      <div>
        {secrets.map(s => <SecretRow key={s.id} secret={s} active={s.id === activeId} open={s.id === openId} tabIndex={s.id === rovingId ? 0 : -1} onFocus={() => setActiveId(s.id)} onOpen={() => {
        setActiveId(s.id);
        setOpenId(s.id);
      }} onClose={() => setOpenId(null)} onChanged={onChanged} ref={el => {
        if (el) rowRefs.current.set(s.id, el);else rowRefs.current.delete(s.id);
      }} />)}
      </div>
    </div>;
}
interface SecretRowProps {
  secret: SecretSummary;
  active: boolean;
  open: boolean;
  tabIndex: number;
  onFocus: () => void;
  onOpen: () => void;
  onClose: () => void;
  onChanged: () => void;
}
const SecretRow = forwardRef<HTMLButtonElement, SecretRowProps>(function SecretRow({
  secret,
  active,
  open,
  tabIndex,
  onFocus,
  onOpen,
  onClose,
  onChanged
}, ref) {
  return <div className="relative">
        <button ref={ref} type="button" tabIndex={tabIndex} onFocus={onFocus} onClick={onOpen} aria-haspopup="dialog" aria-expanded={open} aria-label={`${secret.namespace}/${secret.key}, version ${secret.version}`} className={cn('group grid w-full items-center gap-4 px-6 py-2.5 text-left', SECRET_ROW_GRID, 'border-b border-cmd-line outline-none transition-colors', 'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cmd-accent', active || open ? 'bg-cmd-sel' : 'hover:bg-cmd-hover')}>
          <div className="min-w-0 truncate font-mono text-[13px] font-medium text-cmd-fg">
            {secret.key}
          </div>
          <div className="font-mono text-[11px] tabular-nums text-cmd-fg-dim">
            v{secret.version}
          </div>
          <div className="font-mono text-[11px] tabular-nums text-cmd-fg-dim" title={secret.updatedAt}>
            {relativeTime(secret.updatedAt)}
          </div>
          <div className="font-mono text-[11px] tabular-nums text-cmd-fg-dim" title={secret.createdAt}>
            {relativeTime(secret.createdAt)}
          </div>
          <ChevronRight className={cn('h-3.5 w-3.5 text-cmd-fg-mute transition-opacity', open ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100')} aria-hidden />
        </button>
        {open && <SecretRowPanel secret={secret} onClose={onClose} onChanged={onChanged} />}
      </div>;
});
function NamespaceEmpty({
  namespace,
  onRequestCreate
}: {
  namespace: string;
  onRequestCreate: () => void;
}) {
  return <div className="flex flex-1 items-center justify-center bg-cmd-surface p-12">
      <div className="max-w-sm text-center">
        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md border border-cmd-line bg-cmd-raised">
          <KeyRound className="h-4 w-4 text-cmd-accent" aria-hidden />
        </div>
        <div className="font-mono text-[13px] text-cmd-fg">
          No secrets in {namespace}
        </div>
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-cmd-fg-mute">
          Add one here, then reference it from a plugin as{' '}
          <span className="text-cmd-fg-dim">{namespace}/&lt;key&gt;</span>.
          Values are encrypted and never shown again.
        </p>
        <button type="button" onClick={onRequestCreate} className={cn('mt-4 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5', 'bg-cmd-accent font-mono text-[12px] text-cmd-bg outline-none', 'transition-[filter] hover:brightness-110', 'focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
          <Plus className="h-3 w-3" aria-hidden />
          New secret
        </button>
      </div>
    </div>;
}
function FilteredEmpty({
  onClearFilters
}: {
  onClearFilters: () => void;
}) {
  return <div className="flex flex-1 items-center justify-center bg-cmd-surface p-12">
      <div className="text-center">
        <div className="font-mono text-[13px] text-cmd-fg-dim">
          No keys match this filter
        </div>
        <button type="button" onClick={onClearFilters} className={cn('mt-3 rounded-md border border-cmd-line px-3 py-1 font-mono text-[11px]', 'text-cmd-fg-dim outline-none transition-colors', 'hover:bg-cmd-hover hover:text-cmd-fg', 'focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
          Clear filter
        </button>
      </div>
    </div>;
}
