import { type KeyboardEvent, useCallback, useRef, useState } from 'react';

export function useRovingFocus<T extends HTMLElement>(ids: readonly string[], enabled = true) {
  const refs = useRef(new Map<string, T>());
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeValid = activeId != null && ids.includes(activeId);
  const rovingId = activeValid ? activeId : (ids[0] ?? null);

  const move = useCallback(
    (delta: number) => {
      if (ids.length === 0) return;
      const current = activeValid && activeId ? ids.indexOf(activeId) : -1;
      const next = Math.max(0, Math.min(ids.length - 1, (current < 0 ? 0 : current) + delta));
      const id = ids[next];
      setActiveId(id);
      const el = refs.current.get(id);
      el?.focus();
      el?.scrollIntoView({ block: 'nearest' });
    },
    [ids, activeValid, activeId],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (!enabled) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        move(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        move(-1);
      }
    },
    [enabled, move],
  );

  const itemProps = (id: string) => ({
    tabIndex: id === rovingId ? 0 : -1,
    onFocus: () => setActiveId(id),
    ref: (el: T | null) => {
      if (el) refs.current.set(id, el);
      else refs.current.delete(id);
    },
  });

  return { activeId, setActiveId, onKeyDown, itemProps };
}
