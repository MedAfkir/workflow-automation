import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Clock, Hourglass, Loader2, Play, RotateCcw, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskRunState } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { CANVAS_H, CANVAS_W, DEMO_EDGES, DEMO_KEY, DEMO_NAMESPACE, DEMO_REVISION, DEMO_TASKS, DEMO_YAML, NODE_H, NODE_W, type TaskId } from './demoWorkflow';
import { useRunSimulation } from './useRunSimulation';
const NODE_STYLE: Record<TaskRunState, {
  border: string;
  bg: string;
  icon: LucideIcon;
  text: string;
  live?: boolean;
}> = {
  PENDING: {
    border: 'border-cmd-line',
    bg: 'bg-cmd-surface',
    icon: Clock,
    text: 'text-run-pending'
  },
  RUNNING: {
    border: 'border-run-running',
    bg: 'bg-cmd-surface',
    icon: Loader2,
    text: 'text-run-running',
    live: true
  },
  WAITING: {
    border: 'border-run-waiting',
    bg: 'bg-cmd-surface',
    icon: Hourglass,
    text: 'text-run-waiting',
    live: true
  },
  SUCCESS: {
    border: 'border-run-success',
    bg: 'bg-cmd-surface',
    icon: Check,
    text: 'text-run-success'
  },
  FAILED: {
    border: 'border-run-failed',
    bg: 'bg-cmd-fail-wash',
    icon: X,
    text: 'text-run-failed'
  },
  SKIPPED: {
    border: 'border-dashed border-cmd-line',
    bg: 'bg-transparent',
    icon: Clock,
    text: 'text-run-skipped'
  }
};
function edgeStroke(state: TaskRunState): string {
  if (state === 'SUCCESS') return 'stroke-run-success';
  if (state === 'RUNNING' || state === 'WAITING') return 'stroke-run-running';
  return 'stroke-cmd-line-strong';
}
export function WorkflowInstrument() {
  const {
    phase,
    states,
    logs,
    run,
    reset,
    reducedMotion
  } = useRunSimulation();
  const [selected, setSelected] = useState<TaskId>('hello');
  const panelRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const taskIds = useMemo(() => DEMO_TASKS.map(t => t.id), []);
  const moveSelection = useCallback((dir: 1 | -1) => {
    setSelected(cur => {
      const i = taskIds.indexOf(cur);
      const next = (i + dir + taskIds.length) % taskIds.length;
      return taskIds[next];
    });
  }, [taskIds]);
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
      case 'r':
      case 'R':
        e.preventDefault();
        run();
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        moveSelection(1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        moveSelection(-1);
        break;
      case 'Escape':
      case '0':
        e.preventDefault();
        reset();
        break;
    }
  }, [run, reset, moveSelection]);
  useEffect(() => {
    if (reducedMotion) return;
    logRef.current?.scrollTo({
      top: logRef.current.scrollHeight
    });
  }, [logs, reducedMotion]);
  return <figure className="m-0 w-full">
      <div ref={panelRef} role="group" aria-labelledby={labelId} tabIndex={0} onKeyDown={onKeyDown} className={cn('overflow-hidden rounded-panel border border-cmd-line bg-cmd-surface', 'shadow-elevated outline-none', 'focus-visible:ring-2 focus-visible:ring-cmd-accent focus-visible:ring-offset-2 focus-visible:ring-offset-cmd-bg')}>
        {}
        <div className="flex items-center gap-3 border-b border-cmd-line bg-cmd-raised px-4 py-2.5">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-run-success motion-safe:animate-live-pulse" aria-hidden />
          <div className="min-w-0 flex-1">
            <div id={labelId} className="truncate font-mono text-[12px] text-cmd-fg">
              {DEMO_NAMESPACE}/{DEMO_KEY}
              <span className="text-cmd-fg-mute">
                {' '}
                - rev {DEMO_REVISION}
              </span>
            </div>
          </div>
          <RunControl phase={phase} onRun={run} onReset={reset} />
        </div>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <YamlPane selected={selected} onSelect={setSelected} />
          <DagPane states={states} selected={selected} onSelect={setSelected} />
        </div>

        {}
        <div className="border-t border-cmd-line bg-cmd-bg">
          <div className="flex items-center justify-between px-4 pb-1.5 pt-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-cmd-fg-mute">
              trace
            </span>
            <RunPhase phase={phase} />
          </div>
          <div ref={logRef} className="max-h-[104px] overflow-y-auto px-4 pb-3 font-mono text-[11px] leading-relaxed">
            {logs.length === 0 ? <p className="text-cmd-fg-mute">
                idle. press{' '}
                <kbd className="rounded-micro border border-cmd-line bg-cmd-raised px-1 text-cmd-fg-dim">
                  Enter
                </kbd>{' '}
                to run.
              </p> : logs.map(l => <p key={l.id} className="motion-safe:animate-log-fade-in flex gap-2 whitespace-pre-wrap break-words">
                  <span className="shrink-0 tabular-nums text-cmd-fg-mute">
                    {l.ts}
                  </span>
                  <span className={cn('shrink-0 font-medium', l.level === 'WARN' ? 'text-run-waiting' : 'text-cmd-fg-mute')}>
                    {l.level}
                  </span>
                  <span className="shrink-0 text-cmd-fg-mute">[{l.taskId}]</span>
                  <span className="text-cmd-fg-dim">{l.message}</span>
                </p>)}
          </div>

          {phase === 'done' && <Link to="/executions" className={cn('group flex items-center gap-3 border-t border-cmd-line px-4 py-2.5', 'outline-none transition-colors hover:bg-cmd-hover', 'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cmd-accent')}>
              <Check className="h-3.5 w-3.5 shrink-0 text-run-success" aria-hidden />
              <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-cmd-fg-dim">
                <span className="text-cmd-fg">
                  {DEMO_NAMESPACE}/{DEMO_KEY}
                </span>{' '}
                succeeded - 3 tasks - 3.4s
              </span>
              <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] text-cmd-fg-mute transition-colors group-hover:text-cmd-fg">
                open in console
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
              </span>
            </Link>}
        </div>
      </div>

      {}
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[11px] text-cmd-fg-mute">
        <Hint k="Enter">run</Hint>
        <Hint k="Up Down">select task</Hint>
        <Hint k="esc">reset</Hint>
        <span className="text-cmd-fg-mute">
          scripted locally - no backend
        </span>
      </figcaption>
    </figure>;
}
function Hint({
  k,
  children
}: {
  k: string;
  children: string;
}) {
  return <span className="flex items-center gap-1.5">
      <kbd className="rounded-micro border border-cmd-line bg-cmd-raised px-1.5 py-0.5 text-[10px] text-cmd-fg-dim">
        {k}
      </kbd>
      {children}
    </span>;
}
function RunControl({
  phase,
  onRun,
  onReset
}: {
  phase: 'idle' | 'running' | 'done';
  onRun: () => void;
  onReset: () => void;
}) {
  if (phase === 'running') {
    return <span className="flex items-center gap-1.5 font-mono text-[12px] text-run-running">
        <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" aria-hidden />
        running
      </span>;
  }
  if (phase === 'done') {
    return <div className="flex items-center gap-1.5">
        <Button size="sm" variant="subtle" onClick={onReset} aria-label="Reset the run">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          reset
        </Button>
        <Button size="sm" variant="ghost" onClick={onRun}>
          <Play className="h-3.5 w-3.5" aria-hidden />
          replay
        </Button>
      </div>;
  }
  return <Button size="sm" variant="ghost" onClick={onRun}>
      <Play className="h-3.5 w-3.5" aria-hidden />
      run
    </Button>;
}
function RunPhase({
  phase
}: {
  phase: 'idle' | 'running' | 'done';
}) {
  const text = phase === 'done' ? 'execution SUCCESS' : phase === 'running' ? 'execution RUNNING' : 'execution idle';
  return <span aria-live="polite" className={cn('font-mono text-[10px] uppercase tracking-[0.14em]', phase === 'done' ? 'text-run-success' : phase === 'running' ? 'text-run-running' : 'text-cmd-fg-mute')}>
      {text}
    </span>;
}
function YamlPane({
  selected,
  onSelect
}: {
  selected: TaskId;
  onSelect: (id: TaskId) => void;
}) {
  return <div className="border-b border-cmd-line lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-2 px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-cmd-fg-mute">
          greet.yaml
        </span>
        <span className="font-mono text-[10px] text-cmd-fg-mute">
          canonical source
        </span>
      </div>
      <pre className="overflow-x-auto px-2 pb-4 font-mono text-[12px] leading-[1.7]">
        <code className="block">
          {DEMO_YAML.map((line, i) => {
          const isTask = line.taskId !== undefined;
          const isSel = isTask && line.taskId === selected;
          const Tag = isTask ? 'button' : 'div';
          return <Tag key={i} {...isTask ? {
            type: 'button' as const,
            onClick: () => onSelect(line.taskId as TaskId),
            'aria-pressed': isSel,
            'aria-label': `Select task ${line.taskId}`
          } : {}} className={cn('flex w-full gap-3 rounded-sm px-2 text-left', isTask && 'cursor-pointer outline-none transition-colors hover:bg-cmd-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cmd-accent', isSel && 'bg-cmd-sel hover:bg-cmd-sel')}>
                <span className="w-5 shrink-0 select-none text-right tabular-nums text-cmd-fg-mute/60" aria-hidden>
                  {i + 1}
                </span>
                <span className="whitespace-pre">
                  {line.toks.map((tok, j) => <span key={j} className={cn(tok.t === 'comment' && 'italic text-cmd-fg-mute', tok.t === 'key' && 'text-cmd-fg-dim', tok.t === 'str' && (isSel ? 'font-medium text-cmd-accent' : 'text-cmd-fg'), tok.t === 'punct' && 'text-cmd-fg-mute', tok.t === 'plain' && 'text-cmd-fg-dim')}>
                      {tok.v}
                    </span>)}
                </span>
              </Tag>;
        })}
        </code>
      </pre>
    </div>;
}
function DagPane({
  states,
  selected,
  onSelect
}: {
  states: Record<TaskId, TaskRunState>;
  selected: TaskId;
  onSelect: (id: TaskId) => void;
}) {
  return <div className="dot-grid bg-cmd-bg/40">
      <div className="flex items-center gap-2 px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-cmd-fg-mute">
          graph
        </span>
        <span className="font-mono text-[10px] text-cmd-fg-mute">
          compiled from source
        </span>
      </div>
      <div className="relative mx-auto w-full" style={{
      aspectRatio: `${CANVAS_W} / ${CANVAS_H}`
    }}>
        <svg viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
          {DEMO_EDGES.map((e, i) => {
          const from = DEMO_TASKS.find(t => t.id === e.from)!;
          const to = DEMO_TASKS.find(t => t.id === e.to)!;
          const sx = from.x + NODE_W / 2;
          const sy = from.y + NODE_H;
          const tx = to.x + NODE_W / 2;
          const ty = to.y;
          const my = sy + (ty - sy) / 2;
          const fromState = states[e.from];
          const pending = fromState === 'PENDING';
          return <path key={i} d={`M ${sx} ${sy} C ${sx} ${my}, ${tx} ${my}, ${tx} ${ty}`} fill="none" strokeWidth={1.5} strokeDasharray={pending ? '4 4' : undefined} className={cn(edgeStroke(fromState), 'transition-colors duration-300')} />;
        })}
        </svg>

        {DEMO_TASKS.map(t => {
        const state = states[t.id];
        const s = NODE_STYLE[state];
        const Icon = s.icon;
        const isSel = selected === t.id;
        return <button key={t.id} type="button" onClick={() => onSelect(t.id)} aria-pressed={isSel} aria-label={`${t.id}, ${t.typeShort}, ${state.toLowerCase()}`} style={{
          left: `${t.x / CANVAS_W * 100}%`,
          top: `${t.y / CANVAS_H * 100}%`,
          width: `${NODE_W / CANVAS_W * 100}%`
        }} className={cn('absolute flex items-center gap-2 rounded-md border px-2.5 py-2 text-left', 'outline-none transition-colors duration-300', s.border, s.bg, s.live && 'motion-safe:animate-node-pulse', 'hover:brightness-110 focus-visible:ring-2 focus-visible:ring-cmd-accent', isSel && 'ring-1 ring-cmd-accent ring-offset-2 ring-offset-cmd-bg')}>
              <Icon className={cn('h-3.5 w-3.5 shrink-0', s.text, state === 'RUNNING' && 'motion-safe:animate-spin')} aria-hidden />
              <span className="min-w-0">
                <span className="block truncate font-mono text-[12px] font-medium text-cmd-fg">
                  {t.id}
                </span>
                <span className="block truncate font-mono text-[10px] text-cmd-fg-mute">
                  {t.typeShort}
                </span>
              </span>
            </button>;
      })}
      </div>
    </div>;
}
