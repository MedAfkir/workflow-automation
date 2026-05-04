import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFocusTrap } from '@/lib/useFocusTrap';
import { NamespacePicker } from './NamespacePicker';
interface NamespaceSwitcherProps {
  namespace: string;
}
export function NamespaceSwitcher({
  namespace
}: NamespaceSwitcherProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open, () => setOpen(false), btnRef);
  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(t) && btnRef.current && !btnRef.current.contains(t)) {
        setOpen(false);
      }
    }
    const timer = setTimeout(() => window.addEventListener('mousedown', onClickOutside), 0);
    return () => {
      window.removeEventListener('mousedown', onClickOutside);
      clearTimeout(timer);
    };
  }, [open]);
  const go = (ns: string) => {
    setOpen(false);
    if (ns !== namespace) navigate(`/secrets/${ns}`);
  };
  return <div className="relative">
      <button ref={btnRef} type="button" onClick={() => setOpen(o => !o)} aria-haspopup="dialog" aria-expanded={open} className={cn('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5', 'font-mono text-[11px] outline-none transition-colors', 'focus-visible:ring-2 focus-visible:ring-cmd-accent', open ? 'border-cmd-accent-dim bg-cmd-sel text-cmd-accent' : 'border-cmd-line text-cmd-fg-dim hover:bg-cmd-hover hover:text-cmd-fg')}>
        <span className="text-cmd-fg-mute">ns</span>
        <span className="font-medium">{namespace}</span>
        <ChevronDown className="h-3 w-3 opacity-70" aria-hidden />
      </button>
      {open && <div ref={panelRef} role="dialog" aria-label="Switch namespace" className="absolute left-0 top-[calc(100%+6px)] z-50 w-[300px] overflow-hidden rounded-md border border-cmd-line-strong bg-cmd-raised">
          <NamespacePicker current={namespace} onSelect={go} autoFocus />
        </div>}
    </div>;
}
