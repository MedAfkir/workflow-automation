import { useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MutableRefObject, type RefObject } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { activeTokenAt, applySuggestion, buildSuggestions, type FilterSchema, type Suggestion } from '@/lib/filterQuery';
interface FilterInputProps<T> {
  value: string;
  onChange: (value: string) => void;
  schema: FilterSchema<T>;
  items: T[];
  placeholder?: string;
  ariaLabel?: string;
  inputRef?: RefObject<HTMLInputElement>;
  className?: string;
}
export function FilterInput<T>({
  value,
  onChange,
  schema,
  items,
  placeholder,
  ariaLabel,
  inputRef,
  className
}: FilterInputProps<T>) {
  const innerRef = useRef<HTMLInputElement | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const pendingCaret = useRef<number | null>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [caret, setCaret] = useState(0);
  const knownKeys = useMemo(() => new Set(schema.fields.map(f => f.key)), [schema]);
  const active = useMemo(() => activeTokenAt(value, caret, knownKeys), [value, caret, knownKeys]);
  const suggestions = useMemo(() => buildSuggestions(active, schema, items), [active, schema, items]);
  const showDropdown = open && suggestions.length > 0;
  const headerField = active.mode === 'value' ? schema.fields.find(f => f.key === active.key) : undefined;
  const setRefs = (el: HTMLInputElement | null) => {
    innerRef.current = el;
    if (inputRef) {
      (inputRef as MutableRefObject<HTMLInputElement | null>).current = el;
    }
  };
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    if (pendingCaret.current != null) {
      const pos = pendingCaret.current;
      pendingCaret.current = null;
      el.focus();
      el.setSelectionRange(pos, pos);
    }
    if (backdropRef.current) backdropRef.current.scrollLeft = el.scrollLeft;
  }, [value]);
  const syncCaret = () => {
    const el = innerRef.current;
    if (el) setCaret(el.selectionStart ?? el.value.length);
  };
  const accept = (s: Suggestion) => {
    const next = applySuggestion(value, active, s);
    pendingCaret.current = next.caret;
    setCaret(next.caret);
    setActiveIndex(0);
    setOpen(s.kind === 'key');
    onChange(next.text);
  };
  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (showDropdown) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex(i => (i + 1) % suggestions.length);
          return;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex(i => (i - 1 + suggestions.length) % suggestions.length);
          return;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          accept(suggestions[activeIndex] ?? suggestions[0]);
          return;
        case 'Escape':
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
          return;
        default:
          return;
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      if (value) onChange('');
      innerRef.current?.blur();
    }
  };
  return <div className={cn('relative', className)}>
      <div className={cn('relative flex items-center overflow-hidden rounded-md border', 'border-cmd-line bg-cmd-bg focus-within:border-cmd-accent-dim')}>
        <Search className="pointer-events-none absolute left-2 h-3 w-3 text-cmd-fg-mute" aria-hidden />

        <div ref={backdropRef} aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden whitespace-pre', 'py-1.5 pl-7 pr-8 font-mono text-[12px] leading-5')}>
          {renderTokens(value, knownKeys)}
        </div>

        <input ref={setRefs} type="text" role="combobox" aria-expanded={showDropdown} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={showDropdown ? `${listId}-opt-${activeIndex}` : undefined} aria-label={ariaLabel} spellCheck={false} autoCorrect="off" autoCapitalize="off" value={value} placeholder={placeholder} onChange={e => {
        onChange(e.target.value);
        setCaret(e.target.selectionStart ?? e.target.value.length);
        setActiveIndex(0);
        setOpen(true);
      }} onKeyDown={onKeyDown} onSelect={syncCaret} onFocus={() => {
        syncCaret();
        setOpen(true);
      }} onBlur={() => setOpen(false)} onScroll={() => {
        const el = innerRef.current;
        if (el && backdropRef.current) {
          backdropRef.current.scrollLeft = el.scrollLeft;
        }
      }} className={cn('relative w-full bg-transparent py-1.5 pl-7 pr-8', 'font-mono text-[12px] leading-5 text-transparent caret-cmd-fg', 'outline-none placeholder:text-cmd-fg-mute')} />

        {value ? <button type="button" onClick={() => {
        onChange('');
        innerRef.current?.focus();
      }} aria-label="Clear filter" className="absolute right-2 text-cmd-fg-mute outline-none hover:text-cmd-fg-dim focus-visible:text-cmd-fg">
            <X className="h-3 w-3" />
          </button> : <kbd className="pointer-events-none absolute right-2 rounded border border-cmd-line px-1 font-mono text-[10px] text-cmd-fg-mute" aria-hidden>
            /
          </kbd>}
      </div>

      {showDropdown && <ul id={listId} role="listbox" className={cn('absolute left-0 top-full z-20 mt-1 max-h-64 w-full min-w-[15rem] overflow-auto', 'rounded-md border border-cmd-line bg-cmd-raised py-1 shadow-lg shadow-black/40')}>
          <li className="px-2.5 pb-1 pt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-cmd-fg-mute">
            {active.mode === 'value' ? headerField?.label ?? active.key : 'Filter by'}
          </li>
          {suggestions.map((s, i) => <li key={`${s.kind}:${s.value}`} id={`${listId}-opt-${i}`} role="option" aria-selected={i === activeIndex} onMouseDown={e => e.preventDefault()} onMouseEnter={() => setActiveIndex(i)} onClick={() => accept(s)} className={cn('flex cursor-pointer items-baseline justify-between gap-3 px-2.5 py-1', 'font-mono text-[12px]', i === activeIndex ? 'bg-cmd-hover text-cmd-fg' : 'text-cmd-fg-dim')}>
              <span className={s.kind === 'key' ? 'text-cmd-accent' : undefined}>
                {s.kind === 'key' ? `${s.value}:` : s.value}
              </span>
              {s.hint && <span className="truncate text-[11px] text-cmd-fg-mute">
                  {s.hint}
                </span>}
            </li>)}
        </ul>}
    </div>;
}
function renderTokens(text: string, knownKeys: Set<string>) {
  if (!text) return null;
  return text.split(/(\s+)/).map((part, i) => {
    if (i % 2 === 1) return <span key={i}>{part}</span>;
    if (!part) return null;
    const colon = part.indexOf(':');
    if (colon > 0 && knownKeys.has(part.slice(0, colon).toLowerCase())) {
      return <span key={i} className="rounded-[3px] bg-cmd-sel">
          <span className="text-cmd-accent">{part.slice(0, colon + 1)}</span>
          <span className="text-cmd-fg">{part.slice(colon + 1)}</span>
        </span>;
    }
    return <span key={i} className="text-cmd-fg">
        {part}
      </span>;
  });
}
