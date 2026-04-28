import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '@/lib/useFocusTrap';
interface ShortcutsSheetProps {
  open: boolean;
  onClose: () => void;
}
const SHORTCUTS: {
  keys: string[];
  label: string;
}[] = [{
  keys: ['R'],
  label: 'Run this workflow'
}, {
  keys: ['G'],
  label: 'Definition: graph'
}, {
  keys: ['Y'],
  label: 'Definition: YAML'
}, {
  keys: ['E'],
  label: 'Edit (authoring)'
}, {
  keys: ['Up', 'Down'],
  label: 'Move through recent runs'
}, {
  keys: ['Enter'],
  label: 'Open the focused run'
}, {
  keys: ['Esc'],
  label: 'Back to workflows list'
}, {
  keys: ['?'],
  label: 'This cheatsheet'
}];
export function ShortcutsSheet({
  open,
  onClose
}: ShortcutsSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open, onClose);
  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    const t = setTimeout(() => window.addEventListener('mousedown', onClickOutside), 0);
    return () => {
      window.removeEventListener('mousedown', onClickOutside);
      clearTimeout(t);
    };
  }, [open, onClose]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center p-6">
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" className="w-[320px] rounded-md border border-cmd-line-strong bg-cmd-raised">
        <div className="flex items-center justify-between border-b border-cmd-line px-4 py-2.5">
          <span className="font-mono text-[12px] font-semibold text-cmd-fg">
            Keyboard shortcuts
          </span>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-0.5 text-cmd-fg-mute outline-none transition-colors hover:bg-cmd-hover hover:text-cmd-fg focus-visible:ring-2 focus-visible:ring-cmd-accent">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <ul className="flex flex-col px-4 py-3">
          {SHORTCUTS.map(({
          keys,
          label
        }) => <li key={label} className="flex items-center justify-between gap-4 py-1.5">
              <span className="font-mono text-[12px] text-cmd-fg-dim">
                {label}
              </span>
              <span className="flex shrink-0 items-center gap-1">
                {keys.map(k => <kbd key={k} className="rounded border border-cmd-line bg-cmd-bg px-1.5 py-0.5 font-mono text-[10px] text-cmd-fg-mute">
                    {k}
                  </kbd>)}
              </span>
            </li>)}
        </ul>
      </div>
    </div>;
}
