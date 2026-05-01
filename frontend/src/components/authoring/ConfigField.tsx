import { useId, useState } from 'react';
import { Lock, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PluginProperty } from '@/lib/types';
interface ConfigFieldProps {
  prop: PluginProperty;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  error?: string;
}
const TEXTAREA_NAMES = new Set(['message', 'body', 'condition', 'expression']);
export function ConfigField({
  prop,
  value,
  onChange,
  onBlur,
  error
}: ConfigFieldProps) {
  const id = useId();
  const descId = `${id}-desc`;
  const errId = `${id}-err`;
  const describedBy = [prop.description ? descId : null, error ? errId : null].filter(Boolean).join(' ') || undefined;
  return <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5 font-mono text-[11px] text-cmd-fg-dim">
        <span>{prop.name}</span>
        {prop.required && <span className="text-run-failed" title="required" aria-hidden>
            *
          </span>}
        {prop.sensitive && <Lock className="h-3 w-3 text-cmd-fg-mute" aria-label="sensitive - scrubbed from logs" />}
        <span className="ml-auto font-mono text-[10px] text-cmd-fg-mute">
          {prop.type}
        </span>
      </label>

      <Control id={id} prop={prop} value={value} onChange={onChange} onBlur={onBlur} invalid={!!error} describedBy={describedBy} />

      {prop.description && !error && <p id={descId} className="font-mono text-[10px] leading-relaxed text-cmd-fg-mute">
          {prop.description}
        </p>}
      {error && <p id={errId} className="font-mono text-[10px] leading-relaxed text-run-failed">
          {error}
        </p>}
    </div>;
}
interface ControlProps {
  id: string;
  prop: PluginProperty;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  invalid: boolean;
  describedBy?: string;
}
function fieldClass(invalid: boolean): string {
  return cn('w-full rounded-md border bg-cmd-bg px-2.5 py-1.5', 'font-mono text-[12px] text-cmd-fg outline-none placeholder:text-cmd-fg-mute', invalid ? 'border-run-failed' : 'border-cmd-line focus:border-cmd-accent-dim');
}
function asString(v: unknown): string {
  if (v == null) return '';
  return typeof v === 'string' ? v : String(v);
}
function Control({
  id,
  prop,
  value,
  onChange,
  onBlur,
  invalid,
  describedBy
}: ControlProps) {
  const enumValues = prop.enumValues;
  const isEnum = prop.type === 'enum' || enumValues != null && enumValues.length > 0;
  if (prop.type === 'boolean') {
    return <Toggle id={id} checked={value === true} onChange={v => onChange(v)} describedBy={describedBy} />;
  }
  if (isEnum && enumValues) {
    return <select id={id} value={asString(value)} onChange={e => onChange(e.target.value || undefined)} onBlur={onBlur} aria-describedby={describedBy} aria-invalid={invalid || undefined} className={cn(fieldClass(invalid), 'cursor-pointer appearance-none pr-7')} style={{
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a9499' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 8px center'
    }}>
        <option value="">{prop.required ? 'Select...' : '(none)'}</option>
        {enumValues.map(v => <option key={v} value={v}>
            {v}
          </option>)}
      </select>;
  }
  if (prop.type === 'integer' || prop.type === 'number') {
    return <input id={id} type="number" inputMode="numeric" value={value == null || value === '' ? '' : String(value)} onChange={e => {
      const raw = e.target.value;
      if (raw === '') return onChange(undefined);
      const n = Number(raw);
      onChange(Number.isFinite(n) ? n : raw);
    }} onBlur={onBlur} placeholder={prop.defaultValue ?? '0'} aria-describedby={describedBy} aria-invalid={invalid || undefined} className={cn(fieldClass(invalid), 'tabular-nums')} />;
  }
  if (prop.type === 'list') {
    return <TagEditor id={id} values={Array.isArray(value) ? value.map(String) : []} onChange={vals => onChange(vals)} describedBy={describedBy} />;
  }
  if (prop.type === 'map') {
    return <KeyValueEditor value={isPlainObject(value) ? value as Record<string, unknown> : {}} onChange={obj => onChange(obj)} />;
  }
  const isUrl = prop.format === 'url';
  const isDuration = prop.type === 'duration' || prop.format === 'duration';
  const isTextarea = prop.type === 'any' || TEXTAREA_NAMES.has(prop.name) || prop.format === 'code';
  if (isTextarea) {
    return <textarea id={id} rows={prop.type === 'any' ? 3 : 2} spellCheck={false} value={asString(value)} onChange={e => onChange(e.target.value)} onBlur={onBlur} placeholder={prop.type === 'any' ? '{ }' : ''} aria-describedby={describedBy} aria-invalid={invalid || undefined} className={cn(fieldClass(invalid), 'resize-y leading-relaxed')} />;
  }
  return <input id={id} type={prop.sensitive ? 'password' : isUrl ? 'url' : 'text'} autoComplete={prop.sensitive ? 'new-password' : 'off'} spellCheck={false} value={asString(value)} onChange={e => onChange(e.target.value)} onBlur={onBlur} placeholder={isUrl ? 'https://example.com' : isDuration ? prop.defaultValue ?? 'PT30S' : prop.defaultValue ?? ''} aria-describedby={describedBy} aria-invalid={invalid || undefined} className={fieldClass(invalid)} />;
}
function Toggle({
  id,
  checked,
  onChange,
  describedBy
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  describedBy?: string;
}) {
  return <button id={id} type="button" role="switch" aria-checked={checked} aria-describedby={describedBy} onClick={() => onChange(!checked)} className={cn('relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border outline-none transition-colors', 'focus-visible:ring-2 focus-visible:ring-cmd-accent', checked ? 'border-cmd-accent-dim bg-cmd-sel' : 'border-cmd-line bg-cmd-bg')}>
      <span className={cn('mx-0.5 h-3.5 w-3.5 rounded-full transition-transform', checked ? 'translate-x-4 bg-cmd-accent' : 'translate-x-0 bg-cmd-fg-mute')} />
    </button>;
}
function TagEditor({
  id,
  values,
  onChange,
  describedBy
}: {
  id: string;
  values: string[];
  onChange: (values: string[]) => void;
  describedBy?: string;
}) {
  const [draft, setDraft] = useState('');
  const commit = () => {
    const v = draft.trim().replace(/,$/, '').trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft('');
  };
  return <div className={cn('flex flex-wrap items-center gap-1.5 rounded-md border border-cmd-line bg-cmd-bg px-2 py-1.5', 'focus-within:border-cmd-accent-dim')}>
      {values.map((v, i) => <span key={`${v}-${i}`} className="inline-flex items-center gap-1 rounded border border-cmd-line bg-cmd-surface px-1.5 py-0.5 font-mono text-[11px] text-cmd-fg-dim">
          {v}
          <button type="button" onClick={() => onChange(values.filter((_, j) => j !== i))} aria-label={`Remove ${v}`} className="text-cmd-fg-mute outline-none hover:text-run-failed focus-visible:text-run-failed">
            <X className="h-2.5 w-2.5" />
          </button>
        </span>)}
      <input id={id} type="text" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        commit();
      } else if (e.key === 'Backspace' && draft === '' && values.length > 0) {
        onChange(values.slice(0, -1));
      }
    }} onBlur={commit} placeholder={values.length === 0 ? 'Type a value, Enter to add' : ''} aria-describedby={describedBy} className="min-w-[80px] flex-1 bg-transparent font-mono text-[12px] text-cmd-fg outline-none placeholder:text-cmd-fg-mute" />
    </div>;
}
function KeyValueEditor({
  value,
  onChange
}: {
  value: Record<string, unknown>;
  onChange: (obj: Record<string, unknown>) => void;
}) {
  const [rows, setRows] = useState<[string, string][]>(() => Object.entries(value).map(([k, v]) => [k, asString(v)]));
  const push = (next: [string, string][]) => {
    setRows(next);
    const obj: Record<string, unknown> = {};
    for (const [k, v] of next) if (k.trim() !== '') obj[k.trim()] = v;
    onChange(obj);
  };
  return <div className="flex flex-col gap-1.5">
      {rows.map(([k, v], i) => <div key={i} className="flex items-center gap-1.5">
          <input type="text" value={k} onChange={e => {
        const next = [...rows];
        next[i] = [e.target.value, v];
        push(next);
      }} placeholder="key" aria-label={`Key ${i + 1}`} className={cn(fieldClass(false), 'flex-1')} />
          <span className="font-mono text-[11px] text-cmd-fg-mute">:</span>
          <input type="text" value={v} onChange={e => {
        const next = [...rows];
        next[i] = [k, e.target.value];
        push(next);
      }} placeholder="value" aria-label={`Value ${i + 1}`} className={cn(fieldClass(false), 'flex-1')} />
          <button type="button" onClick={() => push(rows.filter((_, j) => j !== i))} aria-label={`Remove row ${i + 1}`} className="rounded p-1 text-cmd-fg-mute outline-none hover:text-run-failed focus-visible:ring-2 focus-visible:ring-cmd-accent">
            <X className="h-3 w-3" />
          </button>
        </div>)}
      <button type="button" onClick={() => push([...rows, ['', '']])} className={cn('inline-flex w-fit items-center gap-1 rounded-md border border-cmd-line px-2 py-1', 'font-mono text-[11px] text-cmd-fg-mute outline-none transition-colors', 'hover:bg-cmd-hover hover:text-cmd-fg-dim focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
        <Plus className="h-3 w-3" aria-hidden /> Add entry
      </button>
    </div>;
}
function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
