import { Workflow } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import type { PluginSummary } from '@/features/plugins';
import { usePlugins } from '@/features/plugins';
import { useHotkeys } from '@/shared/hooks/useHotkeys';
import { cn } from '@/shared/lib/cn';
import { SearchField } from '@/shared/ui/SearchField';

import { PLUGIN_DND_MIME } from '../lib/dnd';
import { hasBranches } from '../lib/flowables';
import { glyphForType } from '../lib/glyphs';
import { useEditorStore } from '../store';

export function PluginPalette() {
  const { data } = usePlugins();
  const all = useMemo(() => data ?? [], [data]);
  const addTask = useEditorStore((s) => s.addTask);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useHotkeys({ '/': () => inputRef.current?.focus() });
  const groups = useMemo(() => groupTasks(all, query), [all, query]);
  const total = useMemo(() => all.filter((p) => p.kind === 'TASK').length, [all]);
  const shown = groups.reduce((n, g) => n + g.plugins.length, 0);

  return (
    <aside
      className="flex w-[256px] shrink-0 flex-col border-r border-cmd-line bg-cmd-raised"
      aria-label="Plugin palette"
    >
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-cmd-line px-4">
        <h2 className="font-mono text-2xs uppercase tracking-[0.12em] text-cmd-fg-mute">Plugins</h2>
        <span className="font-mono text-2xs tabular-nums text-cmd-fg-mute">
          {query ? `${shown} / ${total}` : total}
        </span>
      </div>

      <div className="shrink-0 border-b border-cmd-line px-3 py-2.5">
        <SearchField
          className="w-full"
          value={query}
          onChange={setQuery}
          inputRef={inputRef}
          placeholder="Filter plugins"
          ariaLabel="Filter plugins"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {shown === 0 ? (
          <p className="px-4 py-6 font-mono text-xs leading-relaxed text-cmd-fg-mute">
            No plugins match "{query}".
          </p>
        ) : (
          groups.map((g) => (
            <section key={g.category} className="py-1">
              <h3 className="px-4 pb-1 pt-2 font-mono text-2xs uppercase tracking-[0.12em] text-cmd-fg-mute">
                {g.category}
              </h3>
              <ul>
                {g.plugins.map((p) => (
                  <PaletteItem key={p.id} plugin={p} onAdd={() => addTask(p.id)} />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      <p className="shrink-0 border-t border-cmd-line px-4 py-2.5 font-mono text-2xs leading-relaxed text-cmd-fg-mute">
        Triggers are added after the workflow is created.
      </p>
    </aside>
  );
}

function PaletteItem({ plugin, onAdd }: { plugin: PluginSummary; onAdd: () => void }) {
  const Icon = glyphForType(plugin.id);
  const flow = hasBranches(plugin.id);

  return (
    <li>
      <button
        type="button"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData(PLUGIN_DND_MIME, plugin.id);
          e.dataTransfer.effectAllowed = 'copy';
        }}
        onClick={onAdd}
        title={plugin.description || plugin.id}
        className={cn(
          'flex w-full cursor-grab items-start gap-2.5 px-4 py-1.5 text-left outline-none',
          'transition-colors hover:bg-cmd-hover active:cursor-grabbing',
          'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cmd-accent',
          plugin.deprecated && 'opacity-50',
        )}
      >
        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cmd-fg-mute" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate font-mono text-base text-cmd-fg-dim">{plugin.name}</span>
            {flow && (
              <span
                className="shrink-0 rounded border border-cmd-line px-1 font-mono text-3xs uppercase tracking-[0.08em] text-cmd-fg-mute"
                title="Flowable: holds nested tasks"
              >
                <Workflow className="inline h-2.5 w-2.5" aria-hidden /> flow
              </span>
            )}
          </span>
          {plugin.description && (
            <span className="mt-0.5 line-clamp-2 block font-mono text-2xs leading-relaxed text-cmd-fg-mute">
              {plugin.description}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

interface Group {
  category: string;
  plugins: PluginSummary[];
}

function groupTasks(all: PluginSummary[], query: string): Group[] {
  const q = query.trim().toLowerCase();
  const tasks = all.filter((p) => {
    if (p.kind !== 'TASK') return false;
    if (!q) return true;

    return (
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.categories.some((c) => c.toLowerCase().includes(q))
    );
  });
  const byCategory = new Map<string, PluginSummary[]>();
  for (const p of tasks) {
    const cat = p.categories[0] ?? 'other';
    const list = byCategory.get(cat) ?? [];
    list.push(p);
    byCategory.set(cat, list);
  }

  return [...byCategory.entries()]
    .map(([category, plugins]) => ({
      category,
      plugins: plugins.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => {
      if (a.category === 'other') return 1;
      if (b.category === 'other') return -1;
      return a.category.localeCompare(b.category);
    });
}
