import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

// Typeset key/value view for a task run's resolved inputs or outputs.
// Keeps JSON's type encoding but sets it with real key/value hierarchy and
// copy controls. A raw toggle keeps the exact JSON one click away.

type JsonRecord = Record<string, unknown>;

interface InputsViewProps {
  data: JsonRecord | null;
  // Shown when there are no entries (null or empty object).
  emptyLabel: string;
}

// Objects or arrays nested deeper than this fall back to raw JSON.
const MAX_STRUCTURED_DEPTH = 2;
// Array items shown before "+N more".
const ARRAY_PREVIEW = 8;

export function InputsView({ data, emptyLabel }: InputsViewProps) {
  const [raw, setRaw] = useState(false);
  const entries = data ? Object.entries(data) : [];

  if (!data || entries.length === 0) {
    return (
      <p className="font-mono text-[12px] italic text-cmd-fg-mute">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-cmd-fg-mute">
          <span className="tabular-nums">{entries.length}</span>{' '}
          {entries.length === 1 ? 'key' : 'keys'}
        </span>
        <button
          type="button"
          onClick={() => setRaw((v) => !v)}
          aria-pressed={raw}
          className={cn(
            'rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] outline-none',
            'text-cmd-fg-mute transition-colors hover:text-cmd-fg-dim',
            'focus-visible:ring-2 focus-visible:ring-cmd-accent',
          )}
        >
          {raw ? 'structured' : 'raw'}
        </button>
      </div>

      {raw ? (
        <RawPanel data={data} />
      ) : (
        <dl className="flex flex-col">
          {entries.map(([key, value]) => (
            <Row key={key} label={key} value={value} depth={0} topLevel />
          ))}
        </dl>
      )}
    </div>
  );
}

// One name/value group. Scalars render inline; arrays and objects stack the
// value under a key line with a type and count tag. Top-level rows get a
// rule and a copy-on-hover gutter.
function Row({
  label,
  value,
  depth,
  topLevel = false,
}: {
  label: string;
  value: unknown;
  depth: number;
  topLevel?: boolean;
}) {
  const complex = isComplex(value);

  return (
    <div
      className={cn(
        'group/row relative',
        topLevel
          ? 'border-b border-cmd-line py-2 pr-6 last:border-b-0'
          : 'py-1',
        !complex && 'flex items-baseline gap-3',
      )}
    >
      <dt
        className={cn(
          'min-w-0 shrink-0 font-mono text-[12px] text-cmd-fg-mute',
          complex && 'flex items-center gap-1.5',
          !complex && 'max-w-[45%] truncate',
        )}
        title={label}
      >
        {label}
        {complex && <TypeTag value={value} />}
      </dt>
      <dd className={cn('min-w-0 font-mono text-[12px]', !complex && 'flex-1')}>
        {complex ? (
          <ValueBody value={value} depth={depth} />
        ) : (
          <Scalar value={value} />
        )}
        {topLevel && (
          <CopyButton
            text={toCopyText(value)}
            label={`Copy value of ${label}`}
          />
        )}
      </dd>
    </div>
  );
}

// Sends a complex value to its structured body or a raw fallback.
function ValueBody({ value, depth }: { value: unknown; depth: number }) {
  if (depth >= MAX_STRUCTURED_DEPTH) {
    return <RawJson data={value} nested />;
  }
  if (Array.isArray(value)) {
    return <ArrayBody arr={value} depth={depth} />;
  }
  return <ObjectBody obj={value as JsonRecord} depth={depth} />;
}

function ObjectBody({ obj, depth }: { obj: JsonRecord; depth: number }) {
  const entries = Object.entries(obj);
  if (entries.length === 0) {
    return <span className="font-mono text-[11px] text-cmd-fg-mute">{'{ }'}</span>;
  }
  return (
    <dl className="mt-1 flex flex-col border-l border-cmd-line pl-3">
      {entries.map(([key, value]) => (
        <Row key={key} label={key} value={value} depth={depth + 1} />
      ))}
    </dl>
  );
}

function ArrayBody({ arr, depth }: { arr: unknown[]; depth: number }) {
  const [expanded, setExpanded] = useState(false);
  if (arr.length === 0) {
    return <span className="font-mono text-[11px] text-cmd-fg-mute">[ ]</span>;
  }

  const shown = expanded ? arr : arr.slice(0, ARRAY_PREVIEW);
  const hidden = arr.length - shown.length;

  return (
    <ol className="mt-1 flex flex-col border-l border-cmd-line pl-3">
      {shown.map((item, i) => (
        <li
          key={i}
          className={cn(
            'flex gap-3',
            isComplex(item) ? 'flex-col py-1' : 'items-baseline py-0.5',
          )}
        >
          <span className="shrink-0 font-mono text-[11px] tabular-nums text-cmd-fg-mute">
            {i}
          </span>
          <div className="min-w-0 flex-1 font-mono text-[12px]">
            {isComplex(item) ? (
              <ValueBody value={item} depth={depth + 1} />
            ) : (
              <Scalar value={item} />
            )}
          </div>
        </li>
      ))}
      {(hidden > 0 || expanded) && arr.length > ARRAY_PREVIEW && (
        <li>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={cn(
              'mt-0.5 rounded font-mono text-[11px] text-cmd-fg-mute outline-none',
              'transition-colors hover:text-cmd-fg-dim',
              'focus-visible:ring-2 focus-visible:ring-cmd-accent',
            )}
          >
            {expanded ? 'show less' : `+${hidden} more`}
          </button>
        </li>
      )}
    </ol>
  );
}

// A scalar, typeset by type: strings keep dimmed quotes, numbers run bare
// with tabular figures, booleans and null read as literals.
function Scalar({ value }: { value: unknown }) {
  if (value === null) {
    return <span className="text-cmd-fg-mute">null</span>;
  }
  if (typeof value === 'string') {
    return (
      <span className="break-words text-cmd-fg">
        <span className="text-cmd-fg-mute">&quot;</span>
        {value}
        <span className="text-cmd-fg-mute">&quot;</span>
      </span>
    );
  }
  if (typeof value === 'number' || typeof value === 'bigint') {
    return <span className="tabular-nums text-cmd-fg">{String(value)}</span>;
  }
  if (typeof value === 'boolean') {
    return <span className="text-cmd-fg">{value ? 'true' : 'false'}</span>;
  }
  return <span className="break-words text-cmd-fg">{String(value)}</span>;
}

function TypeTag({ value }: { value: unknown }) {
  const isArr = Array.isArray(value);
  const count = isArr
    ? (value as unknown[]).length
    : Object.keys(value as JsonRecord).length;
  return (
    <span className="font-mono text-[10px] tracking-[0.04em] text-cmd-fg-mute">
      {isArr ? 'array' : 'object'} &middot;{' '}
      <span className="tabular-nums">{count}</span>
    </span>
  );
}

// Raw JSON block. `nested` tightens it for an inline subtree fallback.
function RawJson({ data, nested = false }: { data: unknown; nested?: boolean }) {
  return (
    <pre
      className={cn(
        'overflow-auto whitespace-pre-wrap break-words rounded-md',
        'border border-cmd-line bg-cmd-bg font-mono leading-relaxed text-cmd-fg-dim',
        nested ? 'mt-1 max-h-48 p-2 text-[11px]' : 'max-h-72 p-3 text-[11px]',
      )}
    >
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

// Raw mode for the whole panel: JSON with a copy-all control.
function RawPanel({ data }: { data: JsonRecord }) {
  return (
    <div className="relative">
      <div className="absolute right-1.5 top-1.5 z-10">
        <CopyButton
          text={JSON.stringify(data, null, 2)}
          label="Copy all as JSON"
          variant="inline"
        />
      </div>
      <RawJson data={data} />
    </div>
  );
}

function CopyButton({
  text,
  label,
  variant = 'gutter',
}: {
  text: string;
  label: string;
  variant?: 'gutter' | 'inline';
}) {
  const { copied, trigger } = useCopied();
  return (
    <button
      type="button"
      onClick={() => trigger(text)}
      aria-label={label}
      title={label}
      className={cn(
        'outline-none transition-colors',
        'text-cmd-fg-mute hover:text-cmd-fg-dim',
        'focus-visible:ring-2 focus-visible:ring-cmd-accent',
        variant === 'gutter' && [
          'absolute right-0 top-0.5 inline-flex h-5 w-5 items-center justify-center rounded',
          'bg-cmd-raised opacity-0',
          'before:absolute before:-inset-1.5 before:content-[""]',
          'group-hover/row:opacity-100 focus-visible:opacity-100',
        ],
        variant === 'inline' && [
          'inline-flex items-center gap-1 rounded bg-cmd-bg px-1.5 py-1',
          'hover:bg-cmd-hover',
        ],
      )}
    >
      {copied ? (
        <Check className="h-3 w-3 text-run-success" aria-hidden />
      ) : (
        <Copy className="h-3 w-3" aria-hidden />
      )}
      {variant === 'inline' && (
        <span className="font-mono text-[11px]">
          {copied ? 'copied' : 'copy'}
        </span>
      )}
    </button>
  );
}

// Clipboard write with a short "copied" flash and timer cleanup.
function useCopied() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  const trigger = useCallback((text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1500);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  return { copied, trigger };
}

function isComplex(value: unknown): boolean {
  return (
    Array.isArray(value) || (typeof value === 'object' && value !== null)
  );
}

function toCopyText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null || typeof value !== 'object') return String(value);
  return JSON.stringify(value, null, 2);
}
