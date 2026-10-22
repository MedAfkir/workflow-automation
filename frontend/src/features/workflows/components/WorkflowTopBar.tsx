import { Check, ChevronRight, Copy, PauseCircle, Pencil, Play } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { type ExecutionSummary, StatusBadge } from '@/features/executions';
import { cn } from '@/shared/lib/cn';
import { relativeTime } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import { Kbd } from '@/shared/ui/Kbd';

import type { WorkflowDetail } from '../types';
import { RunPanel } from './RunPanel';

interface WorkflowTopBarProps {
  workflow: WorkflowDetail;
  triggerCount: number;
  hashShort: string | null;
  lastRun: ExecutionSummary | null;
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
  runOpen,
  runBusy,
  runError,
  onToggleRun,
  onCloseRun,
  onSubmitRun,
}: WorkflowTopBarProps) {
  const runBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-cmd-line bg-cmd-raised px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          to="/workflows"
          className={cn(
            'shrink-0 rounded font-mono text-sm text-cmd-fg-mute outline-none',
            'transition-colors hover:text-cmd-fg-dim',
            'focus-visible:ring-2 focus-visible:ring-cmd-accent',
          )}
        >
          workflows
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0 text-cmd-line-strong" aria-hidden />

        <h1 className="flex min-w-0 items-baseline gap-1.5">
          <span className="shrink-0 font-mono text-base text-cmd-fg-mute">
            {workflow.namespace}
          </span>
          <span className="shrink-0 font-mono text-base text-cmd-line-strong">/</span>
          <span className="truncate font-mono text-lg font-semibold text-cmd-fg">
            {workflow.key}
          </span>
        </h1>

        {!workflow.enabled && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-md border border-cmd-line bg-cmd-surface px-2 py-0.5 font-mono text-xs text-cmd-fg-dim">
            <PauseCircle className="h-3 w-3" aria-hidden />
            disabled
          </span>
        )}

        <span className="text-xs text-cmd-line-strong">-</span>

        <span className="shrink-0 font-mono text-xs tabular-nums text-cmd-fg-mute">
          rev {workflow.currentRevision}
        </span>

        {hashShort && <HashCopy hash={hashShort} full={workflow.id} />}

        {triggerCount > 0 && (
          <>
            <span className="text-xs text-cmd-line-strong">-</span>
            <span className="shrink-0 font-mono text-xs text-cmd-fg-mute">
              {triggerCount} trigger{triggerCount === 1 ? '' : 's'}
            </span>
          </>
        )}

        {lastRun && (
          <>
            <span className="text-xs text-cmd-line-strong">-</span>
            <Link
              to={`/executions/${lastRun.id}`}
              title="Open the most recent run"
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded px-1 py-0.5 outline-none',
                'transition-colors hover:bg-cmd-hover',
                'focus-visible:ring-2 focus-visible:ring-cmd-accent',
              )}
            >
              <StatusBadge state={lastRun.state} />
              <span
                className="font-mono text-xs text-cmd-fg-mute"
                title={lastRun.startedAt ?? lastRun.createdAt}
              >
                {relativeTime(lastRun.startedAt ?? lastRun.createdAt)}
              </span>
            </Link>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button asChild variant="ghost">
          <Link to={`/workflows/${workflow.id}/edit`}>
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Edit
            <Kbd className="ml-0.5">E</Kbd>
          </Link>
        </Button>

        <div className="relative">
          <Button
            ref={runBtnRef}
            variant="primary"
            onClick={onToggleRun}
            aria-haspopup="dialog"
            aria-expanded={runOpen}
          >
            <Play className="h-3.5 w-3.5" fill="currentColor" aria-hidden />
            Run
            <Kbd variant="accent" className="ml-0.5">
              R
            </Kbd>
          </Button>
          <RunPanel
            open={runOpen}
            busy={runBusy}
            error={runError}
            onClose={onCloseRun}
            onSubmit={onSubmitRun}
            triggerRef={runBtnRef}
          />
        </div>
      </div>
    </header>
  );
}

function HashCopy({ hash, full }: { hash: string; full: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      title="Copy workflow id"
      aria-label="Copy workflow id"
      onClick={() => {
        void navigator.clipboard.writeText(full);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5',
        'font-mono text-xs text-cmd-fg-dim outline-none transition-colors',
        'hover:bg-cmd-hover hover:text-cmd-fg',
        'focus-visible:ring-2 focus-visible:ring-cmd-accent',
      )}
    >
      {hash}
      {copied ? (
        <Check className="h-3 w-3 text-run-success" aria-hidden />
      ) : (
        <Copy className="h-3 w-3" aria-hidden />
      )}
    </button>
  );
}
