import { X } from 'lucide-react';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import { useFocusTrap } from '@/shared/hooks/useFocusTrap';
import { isTypingTarget } from '@/shared/hooks/useHotkeys';
import { cn } from '@/shared/lib/cn';
import { Kbd } from '@/shared/ui/Kbd';
import { SearchField } from '@/shared/ui/SearchField';

import { ShortcutKeys } from './ShortcutKeys';
import { filterGroups, type ShortcutGroup } from './shortcuts';

interface ShortcutsDialogProps {
  current: ShortcutGroup | null;
  common: ShortcutGroup;
  others: readonly ShortcutGroup[];
  onClose: () => void;
}

const SECTION_TITLE = 'flex items-center gap-2 pb-2 font-mono text-2xs uppercase tracking-[0.12em]';

export function ShortcutsDialog({ current, common, others, onClose }: ShortcutsDialogProps) {
  const [query, setQuery] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const queryRef = useRef(query);
  const titleId = useId();

  useEffect(() => {
    queryRef.current = query;
  });

  const dismiss = useCallback(() => {
    if (queryRef.current) setQuery('');
    else onClose();
  }, [onClose]);

  useFocusTrap(panelRef, true, dismiss);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const mod = e.metaKey || e.ctrlKey;
    if ((mod && e.key === '/') || (!mod && e.key === '?' && !isTypingTarget(e.target as Element))) {
      e.preventDefault();
      onClose();
    }
  };

  const searching = query.trim() !== '';
  const groups = searching
    ? filterGroups(current ? [current, common, ...others] : [common, ...others], query)
    : null;
  const resultCount = groups?.reduce((n, g) => n + g.shortcuts.length, 0) ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-cmd-bg/70 px-4 pt-[12vh] motion-safe:animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        className={cn(
          'flex max-h-[76vh] w-full max-w-[640px] flex-col overflow-hidden',
          'rounded-md border border-cmd-line-strong bg-cmd-raised motion-safe:animate-dialog-in',
        )}
      >
        <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2.5 border-b border-cmd-line px-4 py-3">
          <h2 id={titleId} className="font-mono text-md font-semibold text-cmd-fg">
            Keyboard shortcuts
          </h2>
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search all pages"
            ariaLabel="Search shortcuts"
            className="order-last w-full sm:order-none sm:ml-auto sm:w-56"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto rounded p-1 text-cmd-fg-mute outline-none transition-colors hover:bg-cmd-hover hover:text-cmd-fg focus-visible:ring-2 focus-visible:ring-cmd-accent sm:ml-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {groups ? (
            groups.length > 0 ? (
              groups.map((group) => (
                <ShortcutSection
                  key={group.id}
                  group={group}
                  isCurrent={group.id === current?.id}
                />
              ))
            ) : (
              <p className="py-10 text-center font-mono text-sm text-cmd-fg-mute">
                No shortcut matches &quot;<span className="text-cmd-fg-dim">{query.trim()}</span>
                &quot;. <Kbd>Esc</Kbd> clears the search.
              </p>
            )
          ) : (
            <>
              {current ? (
                <ShortcutSection group={current} isCurrent />
              ) : (
                <section className="pt-4">
                  <h3 className={cn(SECTION_TITLE, 'text-cmd-fg-mute')}>This page</h3>
                  <p className="border-t border-cmd-line/60 py-2 font-mono text-sm text-cmd-fg-mute">
                    No shortcuts specific to this page.
                  </p>
                </section>
              )}
              <ShortcutSection group={common} />
            </>
          )}
        </div>

        <p className="sr-only" aria-live="polite">
          {searching ? `${resultCount} ${resultCount === 1 ? 'shortcut' : 'shortcuts'} found` : ''}
        </p>
      </div>
    </div>
  );
}

function ShortcutSection({
  group,
  isCurrent = false,
}: {
  group: ShortcutGroup;
  isCurrent?: boolean;
}) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="pt-4">
      <h3 id={titleId} className={cn(SECTION_TITLE, 'text-cmd-fg-mute')}>
        {group.title}
        {isCurrent && (
          <span className="rounded border border-cmd-accent-dim bg-cmd-sel px-1 py-px text-3xs tracking-[0.08em] text-cmd-accent">
            this page
          </span>
        )}
      </h3>
      <dl className="grid gap-x-8 sm:grid-cols-2">
        {group.shortcuts.map((s) => (
          <div
            key={s.label}
            className="flex min-h-9 items-center justify-between gap-3 border-t border-cmd-line/60 py-1.5"
          >
            <dt className="font-mono text-base text-cmd-fg-dim">{s.label}</dt>
            <dd>
              <ShortcutKeys keys={s.keys} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
