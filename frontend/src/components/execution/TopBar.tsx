import { useEffect, useState } from 'react';
import { Copy, Share2, Square } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import { cn, formatDuration, shortId } from '@/lib/utils';
import type { Execution } from '@/lib/types';
interface TopBarProps {
  execution: Execution;
  isLive: boolean;
}
export function TopBar({
  execution,
  isLive
}: TopBarProps) {
  const elapsed = useElapsed(execution.startedAt, execution.endedAt);
  return <header className={cn('flex h-16 items-center justify-between gap-4', 'border-b border-cmd-line bg-cmd-raised px-5')}>
      {}
      <div className="flex min-w-0 items-center gap-3">
        {isLive && <LiveIndicator />}

        <div className="flex min-w-0 items-baseline gap-2">
          <h1 className="font-mono text-[15px] font-semibold text-cmd-fg">
            {execution.workflowKey}
          </h1>
          <span className="font-mono text-[11px] text-cmd-fg-mute">
            - rev {execution.workflowRevision}
          </span>
        </div>

        <StatusBadge state={execution.state} size="lg" />

        <span className="text-[11px] text-cmd-fg-mute">-</span>

        <button type="button" className={cn('inline-flex items-center gap-1.5', 'font-mono text-[11px] text-cmd-fg-dim', 'rounded-md px-1.5 py-0.5 outline-none', 'hover:bg-cmd-hover hover:text-cmd-fg', 'focus-visible:ring-2 focus-visible:ring-cmd-accent', 'transition-colors')} title="Copy execution id" onClick={() => navigator.clipboard.writeText(execution.id)}>
          {shortId(execution.id)}
          <Copy className="h-3 w-3" />
        </button>

        <Badge variant="neutral">{execution.triggerType.toLowerCase()}</Badge>

        <span className="font-mono text-[11px] tabular-nums text-cmd-fg-dim">
          {elapsed}
        </span>
      </div>

      {}
      <div className="flex items-center gap-2">
        {(execution.state === 'CREATED' || execution.state === 'RUNNING') && <Button variant="destructive" size="md">
            <Square className="h-3.5 w-3.5" fill="currentColor" />
            Kill
          </Button>}
        <Button variant="icon" size="icon" aria-label="Share">
          <Share2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </header>;
}
function LiveIndicator() {
  return <div className={cn('flex items-center gap-1.5', 'rounded-md px-2 py-1', 'border border-cmd-accent-dim bg-cmd-sel')} aria-label="Live streaming">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-live-pulse rounded-full bg-cmd-accent opacity-60 motion-reduce:animate-none" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cmd-accent" />
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-cmd-accent">
        Live
      </span>
    </div>;
}
function useElapsed(startedAt: string | null, endedAt: string | null): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (endedAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [endedAt]);
  if (!startedAt) return '-';
  const end = endedAt ? new Date(endedAt).getTime() : now;
  return formatDuration(end - new Date(startedAt).getTime());
}
