import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import { CornerDownLeft, Loader2, Play, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFocusTrap } from '@/lib/useFocusTrap';
interface RunPanelProps {
  open: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (inputs: Record<string, unknown>) => void;
  triggerRef: RefObject<HTMLElement | null>;
}
export function RunPanel({
  open,
  busy,
  error,
  onClose,
  onSubmit,
  triggerRef
}: RunPanelProps) {
  const [raw, setRaw] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const fieldId = useId();
  useEffect(() => {
    if (!open) {
      setRaw('');
      setParseError(null);
    }
  }, [open]);
  useFocusTrap(panelRef, open, onClose, triggerRef);
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
  const submit = () => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setParseError(null);
      onSubmit({});
      return;
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setParseError('Inputs must be a JSON object, e.g. { "name": "Mehdi" }');
        return;
      }
      setParseError(null);
      onSubmit(parsed as Record<string, unknown>);
    } catch {
      setParseError("That isn't valid JSON. Check quotes and commas.");
    }
  };
  return <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Run workflow" className={cn('absolute right-0 top-[calc(100%+8px)] z-50 w-[340px]', 'rounded-md border border-cmd-line-strong bg-cmd-raised')}>
      <div className="flex items-center justify-between border-b border-cmd-line px-4 py-2.5">
        <span className="font-mono text-[12px] font-semibold text-cmd-fg">
          Run workflow
        </span>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded p-0.5 text-cmd-fg-mute outline-none transition-colors hover:bg-cmd-hover hover:text-cmd-fg focus-visible:ring-2 focus-visible:ring-cmd-accent">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-2 px-4 py-3">
        <label htmlFor={fieldId} className="font-mono text-[11px] text-cmd-fg-mute">
          Inputs{' '}
          <span className="text-cmd-fg-mute">(optional JSON)</span>
        </label>
        <textarea id={fieldId} autoFocus spellCheck={false} value={raw} onChange={e => setRaw(e.target.value)} onKeyDown={e => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) || e.key === 'Enter' && raw.trim() === '') {
          e.preventDefault();
          submit();
        }
      }} placeholder={'{\n  "name": "Mehdi"\n}'} rows={4} className={cn('resize-none rounded-md border bg-cmd-bg px-2.5 py-2', 'font-mono text-[12px] text-cmd-fg outline-none', 'placeholder:text-cmd-fg-mute', parseError ? 'border-run-failed' : 'border-cmd-line focus:border-cmd-accent-dim')} />
        {(parseError || error) && <p className="font-mono text-[11px] leading-relaxed text-run-failed">
            {parseError ?? error}
          </p>}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-cmd-line px-4 py-2.5">
        <span className="font-mono text-[10px] text-cmd-fg-mute">
          Enter to run - esc to cancel
        </span>
        <button type="button" onClick={submit} disabled={busy} className={cn('inline-flex items-center gap-1.5 rounded-md px-3 py-1.5', 'bg-cmd-accent font-mono text-[12px] text-cmd-bg outline-none', 'transition-[filter] hover:brightness-110', 'focus-visible:ring-2 focus-visible:ring-cmd-accent', 'disabled:pointer-events-none disabled:opacity-60')}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" /> : <Play className="h-3 w-3" fill="currentColor" aria-hidden />}
          {busy ? 'Starting...' : 'Run workflow'}
          {!busy && <CornerDownLeft className="h-3 w-3 opacity-70" aria-hidden />}
        </button>
      </div>
    </div>;
}
