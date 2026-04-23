import { Ban, CheckCircle2, CircleDashed, Loader2, XCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExecutionState } from '@/lib/types';
const STATUS: Record<ExecutionState, {
  label: string;
  icon: LucideIcon;
  color: string;
  spin?: boolean;
}> = {
  CREATED: {
    label: 'CREATED',
    icon: CircleDashed,
    color: 'text-run-created'
  },
  RUNNING: {
    label: 'RUNNING',
    icon: Loader2,
    color: 'text-run-running',
    spin: true
  },
  SUCCESS: {
    label: 'SUCCESS',
    icon: CheckCircle2,
    color: 'text-run-success'
  },
  FAILED: {
    label: 'FAILED',
    icon: XCircle,
    color: 'text-run-failed'
  },
  KILLED: {
    label: 'KILLED',
    icon: Ban,
    color: 'text-run-killed'
  }
};
interface RunStatusProps {
  state: ExecutionState;
  className?: string;
}
export function RunStatus({
  state,
  className
}: RunStatusProps) {
  const {
    label,
    icon: Icon,
    color,
    spin
  } = STATUS[state];
  return <span className={cn('inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.04em]', color, className)}>
      <Icon className={cn('h-[13px] w-[13px] shrink-0', spin && 'animate-spin motion-reduce:animate-none')} aria-hidden />
      {label}
    </span>;
}
