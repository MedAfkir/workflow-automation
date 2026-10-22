import { CornerDownLeft, Loader2, Plus, X } from 'lucide-react';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import { ApiError } from '@/shared/api/client';
import { useFocusTrap } from '@/shared/hooks/useFocusTrap';
import { cn } from '@/shared/lib/cn';

import { KEY_MAX, keyError, namespaceError, valueError } from '../lib/constraints';
import { useCreateSecret } from '../queries';
import type { SecretSummary } from '../types';
import { SecretValueField } from './SecretValueField';

interface SecretFormPanelProps {
  open: boolean;
  defaultNamespace: string;
  onClose: () => void;
  onCreated: (secret: SecretSummary) => void;
  triggerRef: RefObject<HTMLElement | null>;
}

export function SecretFormPanel({
  open,
  defaultNamespace,
  onClose,
  onCreated,
  triggerRef,
}: SecretFormPanelProps) {
  const [namespace, setNamespace] = useState(defaultNamespace);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const create = useCreateSecret();
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const nsId = useId();
  const keyId = useId();
  const valId = useId();
  useEffect(() => {
    if (open) {
      setNamespace(defaultNamespace);
      setKey('');
      setValue('');
      setError(null);
      setShowErrors(false);
      setBusy(false);
    }
  }, [open, defaultNamespace]);
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
  const ns = namespace.trim();
  const k = key.trim();
  const nsErr = namespaceError(ns);
  const kErr = keyError(k);
  const vErr = valueError(value);
  const submit = async () => {
    if (nsErr || kErr || vErr) {
      setShowErrors(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await create.mutateAsync({
        namespace: ns,
        key: k,
        value,
      });
      onCreated(created);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'SECRET_ALREADY_EXISTS') {
        setError(`"${k}" already exists in ${ns}. Rotate it instead.`);
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Couldn't reach the backend. Try again.");
      }
      setBusy(false);
    }
  };
  const submitOnEnter = (e: ReactKeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="New secret"
      className={cn(
        'absolute right-0 top-[calc(100%+8px)] z-50 w-[360px]',
        'rounded-md border border-cmd-line-strong bg-cmd-raised',
      )}
    >
      <div className="flex items-center justify-between border-b border-cmd-line px-4 py-2.5">
        <span className="font-mono text-sm font-semibold text-cmd-fg">New secret</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded p-0.5 text-cmd-fg-mute outline-none transition-colors hover:bg-cmd-hover hover:text-cmd-fg focus-visible:ring-2 focus-visible:ring-cmd-accent"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-3 px-4 py-3">
        <Field label="Namespace" htmlFor={nsId} error={showErrors ? nsErr : null}>
          <input
            id={nsId}
            value={namespace}
            onChange={(e) => setNamespace(e.target.value)}
            onKeyDown={submitOnEnter}
            spellCheck={false}
            className={fieldCls(showErrors && !!nsErr)}
          />
        </Field>

        <Field
          label="Key"
          htmlFor={keyId}
          error={showErrors ? kErr : null}
          hint={`${k.length}/${KEY_MAX}`}
        >
          <input
            id={keyId}
            autoFocus
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={submitOnEnter}
            spellCheck={false}
            placeholder="api-token"
            className={fieldCls(showErrors && !!kErr)}
          />
        </Field>

        <Field label="Value" htmlFor={valId} error={showErrors ? vErr : null}>
          <SecretValueField
            id={valId}
            value={value}
            onChange={setValue}
            onEnter={() => void submit()}
            invalid={showErrors && !!vErr}
            placeholder="write-only, stored encrypted"
          />
        </Field>

        {error && <p className="font-mono text-xs leading-relaxed text-run-failed">{error}</p>}
        <p className="font-mono text-2xs leading-relaxed text-cmd-fg-mute">
          Reference it in a plugin as{' '}
          <span className="text-cmd-fg-dim">
            {ns || 'namespace'}/{k || 'key'}
          </span>
          . The value is never shown again.
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-cmd-line px-4 py-2.5">
        <span className="font-mono text-2xs text-cmd-fg-mute">Enter to create - esc to cancel</span>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5',
            'bg-cmd-accent font-mono text-sm text-cmd-bg outline-none',
            'transition-[filter] hover:brightness-110',
            'focus-visible:ring-2 focus-visible:ring-cmd-accent',
            'disabled:pointer-events-none disabled:opacity-60',
          )}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
          ) : (
            <Plus className="h-3 w-3" aria-hidden />
          )}
          {busy ? 'Creating...' : 'Create secret'}
          {!busy && <CornerDownLeft className="h-3 w-3 opacity-70" aria-hidden />}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label htmlFor={htmlFor} className="font-mono text-xs text-cmd-fg-mute">
          {label}
        </label>
        {hint && <span className="font-mono text-2xs tabular-nums text-cmd-fg-mute">{hint}</span>}
      </div>
      {children}
      {error && <span className="font-mono text-2xs text-run-failed">{error}</span>}
    </div>
  );
}

function fieldCls(invalid: boolean) {
  return cn(
    'w-full rounded-md border bg-cmd-bg px-2.5 py-1.5',
    'font-mono text-sm text-cmd-fg outline-none placeholder:text-cmd-fg-mute',
    invalid ? 'border-run-failed' : 'border-cmd-line focus:border-cmd-accent-dim',
  );
}
