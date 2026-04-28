import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight, Copy, PauseCircle, Pencil, Play } from 'lucide-react';
import { cn, relativeTime } from '@/lib/utils';
import type { ExecutionSummary, WorkflowDetail } from '@/lib/types';
import { RunStatus } from '@/components/executions-list/RunStatus';
import { RunPanel } from './RunPanel';
interface WorkflowTopBarProps {
  workflow: WorkflowDetail;
  triggerCount: number;
  hashShort: string | null;
  lastRun: ExecutionSummary | null;
  demo: boolean;
  runOpen: boolean;
  runBusy: boolean;
  runError: string | null;
  onToggleRun: () => void;
  onCloseRun: () => void;
  onSubmitRun: (inputs: Record<string, unknown>) => void;
}
export function WorkflowTopBar({
  workflow,
  triggerCount,
  hashShort,
  lastRun,
  demo,
  runOpen,
  runBusy,
  runError,
  onToggleRun,
  onCloseRun,
  onSubmitRun
}: WorkflowTopBarProps) {
  const runBtnRef = useRef<HTMLButtonElement>(null);
  return <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-cmd-line bg-cmd-raised px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Link to="/workflows" className={cn('shrink-0 rounded font-mono text-[12px] text-cmd-fg-mute outline-none', 'transition-colors hover:text-cmd-fg-dim', 'focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
          workflows
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0 text-cmd-line-strong" aria-hidden />

        <h1 className="flex min-w-0 items-baseline gap-1.5">
          <span className="shrink-0 font-mono text-[13px] text-cmd-fg-mute">
            {workflow.namespace}
          </span>
          <span className="shrink-0 font-mono text-[13px] text-cmd-line-strong">
            /
          </span>
          <span className="truncate font-mono text-[15px] font-semibold text-cmd-fg">
            {workflow.key}
          </span>
        </h1>

        {}
        {!workflow.enabled && <span className="flex shrink-0 items-center gap-1.5 rounded-md border border-cmd-line bg-cmd-surface px-2 py-0.5 font-mono text-[11px] text-cmd-fg-dim">
            <PauseCircle className="h-3 w-3" aria-hidden />
            disabled
          </span>}

        <span className="text-[11px] text-cmd-line-strong">-</span>

        <span className="shrink-0 font-mono text-[11px] tabular-nums text-cmd-fg-mute">
          rev {workflow.currentRevision}
        </span>

        {hashShort && <HashCopy hash={hashShort} full={workflow.id} />}

        {triggerCount > 0 && <>
            <span className="text-[11px] text-cmd-line-strong">-</span>
            <span className="shrink-0 font-mono text-[11px] text-cmd-fg-mute">
              {triggerCount} trigger{triggerCount === 1 ? '' : 's'}
            </span>
          </>}

        {lastRun && <>
            <span className="text-[11px] text-cmd-line-strong">-</span>
            <Link to={`/executions/${lastRun.id}`} title="Open the most recent run" className={cn('flex shrink-0 items-center gap-1.5 rounded px-1 py-0.5 outline-none', 'transition-colors hover:bg-cmd-hover', 'focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
              <RunStatus state={lastRun.state} />
              <span className="font-mono text-[11px] text-cmd-fg-mute" title={lastRun.startedAt ?? lastRun.createdAt}>
                {relativeTime(lastRun.startedAt ?? lastRun.createdAt)}
              </span>
            </Link>
          </>}

        {demo && <span className="ml-1 shrink-0 rounded-md border border-cmd-line bg-cmd-surface px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-cmd-fg-mute" title="Backend unreachable; showing demo data">
            demo data
          </span>}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link to={`/workflows/${workflow.id}/edit`} className={cn('inline-flex h-8 items-center gap-1.5 rounded-md border border-cmd-line bg-cmd-raised px-3', 'font-mono text-[13px] text-cmd-fg-dim outline-none transition-colors', 'hover:bg-cmd-hover hover:text-cmd-fg', 'focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          Edit
          <kbd className="ml-0.5 rounded border border-cmd-line px-1 text-[10px] text-cmd-fg-mute">
            E
          </kbd>
        </Link>

        <div className="relative">
          <button ref={runBtnRef} type="button" onClick={onToggleRun} aria-haspopup="dialog" aria-expanded={runOpen} className={cn('inline-flex h-8 items-center gap-1.5 rounded-md px-3', 'bg-cmd-accent font-mono text-[13px] text-cmd-bg outline-none', 'transition-[filter] hover:brightness-110', 'focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
            <Play className="h-3.5 w-3.5" fill="currentColor" aria-hidden />
            Run
            <kbd className="ml-0.5 rounded bg-cmd-bg px-1 text-[10px] text-cmd-accent">
              R
            </kbd>
          </button>
          <RunPanel open={runOpen} busy={runBusy} error={runError} onClose={onCloseRun} onSubmit={onSubmitRun} triggerRef={runBtnRef} />
        </div>
      </div>
    </header>;
}
function HashCopy({
  hash,
  full
}: {
  hash: string;
  full: string;
}) {
  const [copied, setCopied] = useState(false);
  return <button type="button" title="Copy workflow id" aria-label="Copy workflow id" onClick={() => {
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }} className={cn('inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5', 'font-mono text-[11px] text-cmd-fg-dim outline-none transition-colors', 'hover:bg-cmd-hover hover:text-cmd-fg', 'focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
      {hash}
      {copied ? <Check className="h-3 w-3 text-run-success" aria-hidden /> : <Copy className="h-3 w-3" aria-hidden />}
    </button>;
}
