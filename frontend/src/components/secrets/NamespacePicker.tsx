import { useMemo, useState } from 'react';
import { CornerDownLeft, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkflows } from '@/lib/api/workflows';
import { readRecentNamespaces } from './recents';
import { namespaceError } from './constraints';
interface NamespacePickerProps {
  current?: string;
  onSelect: (namespace: string) => void;
  autoFocus?: boolean;
}
export function NamespacePicker({
  current,
  onSelect,
  autoFocus
}: NamespacePickerProps) {
  const [query, setQuery] = useState('');
  const {
    data: workflows
  } = useWorkflows();
  const all = useMemo(() => {
    const seen = new Set<string>();
    const out: {
      ns: string;
      recent: boolean;
    }[] = [];
    for (const ns of readRecentNamespaces()) {
      if (ns !== current && !seen.has(ns)) {
        seen.add(ns);
        out.push({
          ns,
          recent: true
        });
      }
    }
    for (const ns of (workflows ?? []).map(w => w.namespace).sort()) {
      if (ns !== current && !seen.has(ns)) {
        seen.add(ns);
        out.push({
          ns,
          recent: false
        });
      }
    }
    return out;
  }, [workflows, current]);
  const q = query.trim().toLowerCase();
  const filtered = q ? all.filter(x => x.ns.toLowerCase().includes(q)) : all;
  const typed = query.trim();
  const typedValid = !!typed && !namespaceError(typed);
  const enterTarget = filtered[0]?.ns ?? (typedValid ? typed : null);
  const noMatch = filtered.length === 0;
  return <div className="flex flex-col">
      <div className="flex items-center gap-1.5 border-b border-cmd-line px-3 py-2 focus-within:border-cmd-accent-dim">
        <Search className="h-3.5 w-3.5 shrink-0 text-cmd-fg-mute" aria-hidden />
        <input autoFocus={autoFocus} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => {
        if (e.key === 'Enter' && enterTarget) {
          e.preventDefault();
          onSelect(enterTarget);
        }
      }} placeholder="Go to namespace..." aria-label="Namespace" spellCheck={false} className="min-w-0 flex-1 bg-transparent font-mono text-[13px] text-cmd-fg outline-none placeholder:text-cmd-fg-mute" />
        {enterTarget && <CornerDownLeft className="h-3 w-3 shrink-0 text-cmd-fg-mute" aria-hidden />}
      </div>

      <ul className="max-h-64 overflow-auto py-1" role="listbox" aria-label="Namespaces">
        {filtered.map((x, i) => <li key={x.ns}>
            <button type="button" onClick={() => onSelect(x.ns)} className={cn('flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left', 'outline-none transition-colors', 'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cmd-accent', i === 0 ? 'bg-cmd-sel' : 'hover:bg-cmd-hover')}>
              <span className={cn('truncate font-mono text-[13px]', i === 0 ? 'text-cmd-accent' : 'text-cmd-fg-dim')}>
                {x.ns}
              </span>
              {x.recent && <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-cmd-fg-mute">
                  recent
                </span>}
            </button>
          </li>)}

        {noMatch && typedValid && <li className="px-3 py-2 font-mono text-[11px] text-cmd-fg-mute">
            Press Enter to open <span className="text-cmd-fg-dim">{typed}</span>
          </li>}
        {noMatch && !!typed && !typedValid && <li className="px-3 py-2 font-mono text-[11px] text-run-failed">
            Invalid namespace. Lowercase, starts alphanumeric, at most 64 chars.
          </li>}
        {noMatch && !typed && <li className="px-3 py-2 font-mono text-[11px] text-cmd-fg-mute">
            Type a namespace and press Enter.
          </li>}
      </ul>
    </div>;
}
