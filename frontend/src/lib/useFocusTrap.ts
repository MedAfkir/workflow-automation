import { useEffect, type RefObject } from 'react';
export function useFocusTrap(containerRef: RefObject<HTMLElement>, active: boolean, onClose: () => void, restoreRef?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    const restore = restoreRef?.current ?? document.activeElement as HTMLElement | null;
    function focusables(): HTMLElement[] {
      if (!container) return [];
      return Array.from(container.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(el => el.offsetParent !== null);
    }
    if (container && !container.contains(document.activeElement)) {
      (focusables()[0] ?? container).focus();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const els = focusables();
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      const focused = document.activeElement as HTMLElement | null;
      const inside = !!container && container.contains(focused);
      if (e.shiftKey) {
        if (!inside || focused === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (!inside || focused === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      restore?.focus?.();
    };
  }, [active, containerRef, onClose, restoreRef]);
}
