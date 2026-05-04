import { useEffect, useId, useRef, useState } from 'react';
import { Check, Copy, CornerDownLeft, Loader2, RefreshCw, Trash2, X } from 'lucide-react';
import { cn, relativeTime } from '@/lib/utils';
import { useFocusTrap } from '@/lib/useFocusTrap';
import { ApiError } from '@/lib/api/client';
import { deleteSecret, rotateSecret } from '@/lib/api/secrets';
import type { SecretSummary } from '@/lib/types';
import { SecretValueField } from './SecretValueField';
import { valueError } from './constraints';
type Mode = 'actions' | 'rotate' | 'delete';
interface SecretRowPanelProps {
  secret: SecretSummary;
  onClose: () => void;
  onChanged: () => void;
}
export function SecretRowPanel({
  secret,
  onClose,
  onChanged
}: SecretRowPanelProps) {
  const [mode, setMode] = useState<Mode>('actions');
  const [value, setValue] = useState('');
  const [showError, setShowError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const valId = useId();
  const reference = `${secret.namespace}/${secret.key}`;
  useFocusTrap(panelRef, true, onClose);
  useEffect(() => {
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
  }, [onClose]);
  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  const vErr = valueError(value);
  const rotate = async () => {
    if (vErr) {
      setShowError(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await rotateSecret(secret.namespace, secret.key, value);
      onChanged();
      onClose();
    } catch (err) {
      setError(rwError(err, 'rotate'));
      setBusy(false);
    }
  };
  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteSecret(secret.namespace, secret.key);
      onChanged();
      onClose();
    } catch (err) {
      setError(rwError(err, 'delete'));
      setBusy(false);
    }
  };
  return <div ref={panelRef} role="dialog" aria-modal="true" aria-label={`Secret ${reference}`} onClick={e => e.stopPropagation()} className={cn('absolute right-3 top-[calc(100%-2px)] z-50 w-[340px] text-left', 'rounded-md border border-cmd-line-strong bg-cmd-raised')}>
      <div className="flex items-center justify-between gap-2 border-b border-cmd-line px-4 py-2.5">
        <button type="button" onClick={() => void copyReference()} aria-label={`Copy reference ${reference}`} className="group flex min-w-0 items-center gap-1.5 rounded font-mono text-[12px] text-cmd-fg outline-none focus-visible:ring-2 focus-visible:ring-cmd-accent">
          <span className="truncate">{reference}</span>
          {copied ? <Check className="h-3 w-3 shrink-0 text-run-success" aria-hidden /> : <Copy className="h-3 w-3 shrink-0 text-cmd-fg-mute group-hover:text-cmd-fg-dim" aria-hidden />}
        </button>
        <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 rounded p-0.5 text-cmd-fg-mute outline-none transition-colors hover:bg-cmd-hover hover:text-cmd-fg focus-visible:ring-2 focus-visible:ring-cmd-accent">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {mode === 'actions' && <>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 px-4 py-3 font-mono text-[11px]">
            <dt className="text-cmd-fg-mute">version</dt>
            <dd className="tabular-nums text-cmd-fg-dim">v{secret.version}</dd>
            <dt className="text-cmd-fg-mute">updated</dt>
            <dd className="tabular-nums text-cmd-fg-dim" title={secret.updatedAt}>
              {relativeTime(secret.updatedAt)}
            </dd>
            <dt className="text-cmd-fg-mute">created</dt>
            <dd className="tabular-nums text-cmd-fg-dim" title={secret.createdAt}>
              {relativeTime(secret.createdAt)}
            </dd>
          </dl>
          <div className="flex items-center justify-end gap-2 border-t border-cmd-line px-4 py-2.5">
            <button type="button" onClick={() => {
          setMode('delete');
          setError(null);
        }} className="inline-flex items-center gap-1.5 rounded-md border border-cmd-line bg-cmd-fail-wash px-3 py-1.5 font-mono text-[12px] text-run-failed outline-none transition-[filter] hover:brightness-125 focus-visible:ring-2 focus-visible:ring-cmd-accent">
              <Trash2 className="h-3 w-3" aria-hidden />
              Delete
            </button>
            <button type="button" onClick={() => {
          setMode('rotate');
          setValue('');
          setError(null);
          setShowError(false);
        }} className="inline-flex items-center gap-1.5 rounded-md border border-cmd-line bg-cmd-raised px-3 py-1.5 font-mono text-[12px] text-cmd-fg-dim outline-none transition-colors hover:bg-cmd-hover hover:text-cmd-fg focus-visible:ring-2 focus-visible:ring-cmd-accent">
              <RefreshCw className="h-3 w-3" aria-hidden />
              Rotate
            </button>
          </div>
        </>}

      {mode === 'rotate' && <>
          <div className="flex flex-col gap-2 px-4 py-3">
            <label htmlFor={valId} className="font-mono text-[11px] text-cmd-fg-mute">
              New value{' '}
              <span className="text-cmd-fg-mute">
                (bumps to v{secret.version + 1})
              </span>
            </label>
            <SecretValueField id={valId} value={value} onChange={setValue} onEnter={() => void rotate()} invalid={showError && !!vErr} autoFocus placeholder="new value, write-only" />
            {showError && vErr && <span className="font-mono text-[10px] text-run-failed">
                {vErr}
              </span>}
            {error && <p className="font-mono text-[11px] leading-relaxed text-run-failed">
                {error}
              </p>}
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-cmd-line px-4 py-2.5">
            <button type="button" onClick={() => {
          setMode('actions');
          setError(null);
        }} className="font-mono text-[11px] text-cmd-fg-mute outline-none hover:text-cmd-fg-dim focus-visible:text-cmd-fg">
              back
            </button>
            <button type="button" onClick={() => void rotate()} disabled={busy} className={cn('inline-flex items-center gap-1.5 rounded-md px-3 py-1.5', 'bg-cmd-accent font-mono text-[12px] text-cmd-bg outline-none', 'transition-[filter] hover:brightness-110', 'focus-visible:ring-2 focus-visible:ring-cmd-accent', 'disabled:pointer-events-none disabled:opacity-60')}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" /> : <RefreshCw className="h-3 w-3" aria-hidden />}
              {busy ? 'Rotating...' : 'Rotate'}
              {!busy && <CornerDownLeft className="h-3 w-3 opacity-70" aria-hidden />}
            </button>
          </div>
        </>}

      {mode === 'delete' && <>
          <div className="px-4 py-3">
            <p className="font-mono text-[12px] leading-relaxed text-cmd-fg-dim">
              Delete <span className="text-cmd-fg">{reference}</span>? Workflows
              that reference it will fail at run time. This can't be undone.
            </p>
            {error && <p className="mt-2 font-mono text-[11px] leading-relaxed text-run-failed">
                {error}
              </p>}
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-cmd-line px-4 py-2.5">
            <button type="button" onClick={() => {
          setMode('actions');
          setError(null);
        }} className="font-mono text-[11px] text-cmd-fg-mute outline-none hover:text-cmd-fg-dim focus-visible:text-cmd-fg">
              back
            </button>
            <button type="button" autoFocus onClick={() => void remove()} disabled={busy} className={cn('inline-flex items-center gap-1.5 rounded-md border border-cmd-line px-3 py-1.5', 'bg-cmd-fail-wash font-mono text-[12px] text-run-failed outline-none', 'transition-[filter] hover:brightness-125', 'focus-visible:ring-2 focus-visible:ring-cmd-accent', 'disabled:pointer-events-none disabled:opacity-60')}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" /> : <Trash2 className="h-3 w-3" aria-hidden />}
              {busy ? 'Deleting...' : 'Delete secret'}
            </button>
          </div>
        </>}
    </div>;
}
function rwError(err: unknown, action: 'rotate' | 'delete'): string {
  if (err instanceof ApiError) {
    if (err.code === 'SECRET_NOT_FOUND') {
      return action === 'delete' ? 'Already gone. Refresh the list.' : 'That secret no longer exists. Refresh the list.';
    }
    return err.message;
  }
  return "Couldn't reach the backend. Try again.";
}
