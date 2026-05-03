import { forwardRef, useCallback, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Layers } from 'lucide-react';
import { cn, relativeTime } from '@/lib/utils';
import type { NamespaceSummary } from '@/lib/types';
import { NS_ROW_GRID } from './grid';
interface NamespacesTableProps {
  namespaces: NamespaceSummary[];
  hasAny: boolean;
  isFiltered: boolean;
  onClearFilters: () => void;
}
const PREVIEW_LIMIT = 3;
export function NamespacesTable({
  namespaces,
  hasAny,
  isFiltered,
  onClearFilters
}: NamespacesTableProps) {
  const rowRefs = useRef(new Map<string, HTMLAnchorElement>());
  const [activeName, setActiveName] = useState<string | null>(null);
  const activeValid = activeName != null && namespaces.some(n => n.name === activeName);
  const rovingName = activeValid ? activeName : namespaces[0]?.name ?? null;
  const move = useCallback((delta: number) => {
    if (namespaces.length === 0) return;
    const names = namespaces.map(n => n.name);
    const current = activeValid ? names.indexOf(activeName!) : -1;
    const next = Math.max(0, Math.min(names.length - 1, (current < 0 ? 0 : current) + delta));
    const name = names[next];
    setActiveName(name);
    const el = rowRefs.current.get(name);
    el?.focus();
    el?.scrollIntoView({
      block: 'nearest'
    });
  }, [namespaces, activeValid, activeName]);
  const onKeyDown = useCallback((e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(-1);
    }
  }, [move]);
  if (namespaces.length === 0) {
    return hasAny && isFiltered ? <FilteredEmpty onClearFilters={onClearFilters} /> : <FirstRun />;
  }
  return <div className="flex-1 overflow-auto bg-cmd-surface" onKeyDown={onKeyDown} aria-label="Namespaces">
      <div className={cn('sticky top-0 z-10 grid items-center gap-4 px-6 py-2', NS_ROW_GRID, 'border-b border-cmd-line-strong bg-cmd-raised', 'font-mono text-[10px] uppercase tracking-[0.12em] text-cmd-fg-mute')}>
        <div>Namespace</div>
        <div>Workflows</div>
        <div>Triggers</div>
        <div>Updated</div>
        <div aria-hidden />
      </div>

      <div>
        {namespaces.map(n => <NamespaceRow key={n.name} namespace={n} active={n.name === activeName} tabIndex={n.name === rovingName ? 0 : -1} onFocus={() => setActiveName(n.name)} ref={el => {
        if (el) rowRefs.current.set(n.name, el);else rowRefs.current.delete(n.name);
      }} />)}
      </div>
    </div>;
}
interface NamespaceRowProps {
  namespace: NamespaceSummary;
  active: boolean;
  tabIndex: number;
  onFocus: () => void;
}
const NamespaceRow = forwardRef<HTMLAnchorElement, NamespaceRowProps>(function NamespaceRow({
  namespace,
  active,
  tabIndex,
  onFocus
}, ref) {
  const {
    name,
    workflowCount,
    disabledCount,
    triggerCount,
    workflowKeys
  } = namespace;
  const preview = workflowKeys.slice(0, PREVIEW_LIMIT).join(' - ');
  const overflow = workflowKeys.length - PREVIEW_LIMIT;
  const ariaLabel = `${name}, ${workflowCount} workflow${workflowCount === 1 ? '' : 's'}` + (disabledCount > 0 ? `, ${disabledCount} disabled` : '') + `, updated ${relativeTime(namespace.updatedAt)}`;
  return <Link ref={ref} to={`/workflows?ns=${encodeURIComponent(name)}`} tabIndex={tabIndex} onFocus={onFocus} aria-label={ariaLabel} className={cn('group grid items-center gap-4 px-6 py-2.5', NS_ROW_GRID, 'border-b border-cmd-line outline-none transition-colors', 'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cmd-accent', active ? 'bg-cmd-sel' : 'hover:bg-cmd-hover')}>
        <div className="flex min-w-0 items-start gap-2.5">
          <Layers className="mt-px h-3.5 w-3.5 shrink-0 text-cmd-fg-mute" aria-hidden />
          <div className="min-w-0">
            <div className="truncate font-mono text-[13px] font-medium text-cmd-fg">
              {name}
            </div>
            <div className="mt-0.5 truncate font-mono text-[11px] text-cmd-fg-mute">
              {preview}
              {overflow > 0 && <span className="text-cmd-fg-mute">{` - +${overflow}`}</span>}
            </div>
          </div>
        </div>

        <div className="font-mono text-[11px] tabular-nums text-cmd-fg-dim">
          {workflowCount}
          {disabledCount > 0 && <span className="text-cmd-fg-mute">{` - ${disabledCount} disabled`}</span>}
        </div>

        <div className="font-mono text-[11px] tabular-nums text-cmd-fg-dim">
          {triggerCount > 0 ? triggerCount : <span className="text-cmd-fg-mute">-</span>}
        </div>

        <div className="font-mono text-[11px] tabular-nums text-cmd-fg-dim" title={namespace.updatedAt ?? undefined}>
          {relativeTime(namespace.updatedAt)}
        </div>

        <ChevronRight className={cn('h-3.5 w-3.5 text-cmd-fg-mute transition-opacity', 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100')} aria-hidden />
      </Link>;
});
function FirstRun() {
  return <div className="flex flex-1 items-center justify-center bg-cmd-surface p-12">
      <div className="max-w-sm text-center">
        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md border border-cmd-line bg-cmd-raised">
          <Layers className="h-4 w-4 text-cmd-accent" aria-hidden />
        </div>
        <div className="font-mono text-[13px] text-cmd-fg">
          No namespaces yet
        </div>
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-cmd-fg-mute">
          A namespace appears once you apply a workflow into it:
        </p>
        <code className="mt-3 inline-block rounded-md border border-cmd-line bg-cmd-bg px-3 py-1.5 font-mono text-[11px] text-cmd-fg-dim">
          wf apply &lt;file&gt;.yaml
        </code>
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
          No namespaces match this filter
        </div>
        <button type="button" onClick={onClearFilters} className={cn('mt-3 rounded-md border border-cmd-line px-3 py-1 font-mono text-[11px]', 'text-cmd-fg-dim outline-none transition-colors', 'hover:bg-cmd-hover hover:text-cmd-fg', 'focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
          Clear filter
        </button>
      </div>
    </div>;
}
