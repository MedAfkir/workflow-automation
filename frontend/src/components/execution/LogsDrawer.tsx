import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronUp, ChevronDown, Search, X } from 'lucide-react';
import { cn, formatLogTimestamp } from '@/lib/utils';
import type { LogLevel, LogLine } from '@/lib/types';
interface LogsDrawerProps {
  logs: LogLine[];
  selectedTaskRunId: string | null;
  onSelectTask: (taskId: string | null) => void;
}
type LevelFilter = 'ALL' | LogLevel;
const LEVEL_STYLES: Record<LogLevel, string> = {
  DEBUG: 'text-cmd-fg-mute border-cmd-line bg-cmd-raised',
  INFO: 'text-cmd-fg-dim border-cmd-line bg-cmd-raised',
  WARN: 'text-run-waiting border-cmd-line bg-cmd-raised',
  ERROR: 'text-run-failed border-cmd-line bg-cmd-fail-wash'
};
export function LogsDrawer({
  logs,
  selectedTaskRunId,
  onSelectTask
}: LogsDrawerProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [filterToTask, setFilterToTask] = useState(false);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('ALL');
  const [search, setSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!selectedTaskRunId) setFilterToTask(false);
  }, [selectedTaskRunId]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter(l => {
      if (filterToTask && selectedTaskRunId && l.taskRunId !== selectedTaskRunId) return false;
      if (levelFilter !== 'ALL' && l.level !== levelFilter) return false;
      if (q && !l.message.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [logs, filterToTask, selectedTaskRunId, levelFilter, search]);
  useEffect(() => {
    if (!autoScroll || collapsed) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [filtered.length, autoScroll, collapsed]);
  return <section className={cn('flex flex-col', 'border-t border-cmd-line bg-cmd-raised', collapsed ? 'h-10' : 'h-[30vh] min-h-[200px]', 'transition-[height] duration-200')}>
      {}
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-cmd-line px-4">
        <button type="button" onClick={() => setCollapsed(v => !v)} className={cn('inline-flex items-center gap-1.5', 'font-mono text-[12px] text-cmd-fg-dim', 'rounded-md px-2 py-1 outline-none', 'hover:bg-cmd-hover hover:text-cmd-fg', 'focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
          {collapsed ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          Logs
          <span className="ml-1 font-mono text-[10px] tabular-nums text-cmd-fg-mute">
            {filtered.length}
            {filtered.length !== logs.length ? `/${logs.length}` : ''}
          </span>
        </button>

        {!collapsed && <>
            {}
            <FilterChip active={!filterToTask} onClick={() => setFilterToTask(false)}>
              All
            </FilterChip>
            {selectedTaskRunId && <FilterChip active={filterToTask} onClick={() => setFilterToTask(true)}>
                Selected task
              </FilterChip>}

            <span className="h-4 w-px bg-cmd-line" />

            {(['ALL', 'INFO', 'WARN', 'ERROR'] as const).map(lvl => <FilterChip key={lvl} active={levelFilter === lvl} onClick={() => setLevelFilter(lvl)}>
                {lvl === 'ALL' ? 'Any level' : lvl}
              </FilterChip>)}

            {}
            <div className="ml-auto flex items-center gap-2">
              <div className={cn('flex items-center gap-1.5 px-2 py-1', 'rounded-md border border-cmd-line bg-cmd-bg', 'focus-within:border-cmd-accent-dim')}>
                <Search className="h-3 w-3 text-cmd-fg-mute" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" aria-label="Search logs" className={cn('w-32 bg-transparent outline-none', 'font-mono text-[12px] text-cmd-fg', 'placeholder:text-cmd-fg-mute')} />
                {search && <button onClick={() => setSearch('')} aria-label="Clear log search" className="text-cmd-fg-mute outline-none hover:text-cmd-fg-dim focus-visible:text-cmd-fg">
                    <X className="h-3 w-3" />
                  </button>}
              </div>

              <button type="button" onClick={() => setAutoScroll(v => !v)} aria-pressed={autoScroll} className={cn('inline-flex items-center gap-1 px-2 py-1', 'rounded-md border font-mono text-[11px]', 'outline-none transition-colors', 'focus-visible:ring-2 focus-visible:ring-cmd-accent', autoScroll ? 'border-cmd-accent-dim bg-cmd-sel text-cmd-accent' : 'border-cmd-line text-cmd-fg-mute hover:bg-cmd-hover hover:text-cmd-fg-dim')}>
                Auto-scroll
              </button>
            </div>
          </>}
      </div>

      {}
      {!collapsed && <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2" onScroll={e => {
      const el = e.currentTarget;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
      if (!atBottom && autoScroll) setAutoScroll(false);
    }}>
          {filtered.length === 0 ? <div className="flex h-full items-center justify-center font-mono text-[12px] text-cmd-fg-mute">
              No log lines match the current filter.
            </div> : <div className="space-y-0.5">
              {filtered.map((l, i) => <LogRow key={l.id} log={l} isLast={i === filtered.length - 1} onClickTask={onSelectTask} />)}
            </div>}
        </div>}
    </section>;
}
function FilterChip({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={cn('rounded-md border px-2.5 py-0.5', 'font-mono text-[11px] whitespace-nowrap outline-none transition-colors', 'focus-visible:ring-2 focus-visible:ring-cmd-accent', active ? 'border-cmd-accent-dim bg-cmd-sel text-cmd-accent' : 'border-cmd-line text-cmd-fg-mute hover:bg-cmd-hover hover:text-cmd-fg-dim')}>
      {children}
    </button>;
}
function LogRow({
  log,
  isLast,
  onClickTask
}: {
  log: LogLine;
  isLast: boolean;
  onClickTask: (taskId: string) => void;
}) {
  return <div className={cn('group flex items-baseline gap-3 rounded-md px-1 py-0.5', 'hover:bg-cmd-hover', isLast && 'animate-log-fade-in motion-reduce:animate-none')}>
      <span className="shrink-0 font-mono text-[11px] tabular-nums text-cmd-fg-mute">
        {formatLogTimestamp(new Date(log.timestamp))}
      </span>
      <span className={cn('shrink-0 font-mono text-[9px] uppercase tracking-[0.1em]', 'rounded border px-1.5 py-0.5', LEVEL_STYLES[log.level])}>
        {log.level}
      </span>
      {log.taskId && <button type="button" onClick={() => onClickTask(log.taskId!)} className={cn('shrink-0 font-mono text-[11px] outline-none', 'text-cmd-accent hover:brightness-110', 'focus-visible:ring-2 focus-visible:ring-cmd-accent', 'transition-[filter]')}>
          {log.taskId}
        </button>}
      <span className="break-all font-mono text-[12px] text-cmd-fg-dim">
        {log.message}
      </span>
    </div>;
}
