import { useEffect, useRef } from 'react';

type Hotkeys = Partial<Record<string, ((event: KeyboardEvent) => void) | false | null>>;

export function isTypingTarget(el: Element | null): boolean {
  return (
    el instanceof HTMLElement &&
    (el.tagName === 'INPUT' ||
      el.tagName === 'TEXTAREA' ||
      el.tagName === 'SELECT' ||
      el.isContentEditable)
  );
}

export function useHotkeys(hotkeys: Hotkeys) {
  const ref = useRef(hotkeys);

  useEffect(() => {
    ref.current = hotkeys;
  });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingTarget(document.activeElement)) return;
      const handler = ref.current[e.key.toLowerCase()];
      if (!handler) return;
      e.preventDefault();
      handler(e);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
