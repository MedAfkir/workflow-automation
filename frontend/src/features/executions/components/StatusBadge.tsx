import {
  Ban,
  CheckCircle2,
  CircleDashed,
  Clock,
  Hourglass,
  Loader2,
  type LucideIcon,
  MinusCircle,
  XCircle,
} from 'lucide-react';

import { cn } from '@/shared/lib/cn';

import type { ExecutionState, TaskRunState } from '../types';

type StatusKind = ExecutionState | TaskRunState;

const STATUS: Record<
  StatusKind,
  {
    label: string;
    icon: LucideIcon;
    color: string;
    spin?: boolean;
  }
> = {
  CREATED: {
    label: 'CREATED',
    icon: CircleDashed,
    color: 'text-run-created',
  },
  PENDING: {
    label: 'PENDING',
    icon: Clock,
    color: 'text-run-pending',
  },
  RUNNING: {
    label: 'RUNNING',
    icon: Loader2,
    color: 'text-run-running',
    spin: true,
  },
  WAITING: {
    label: 'WAITING',
    icon: Hourglass,
    color: 'text-run-waiting',
  },
  SUCCESS: {
    label: 'SUCCESS',
    icon: CheckCircle2,
    color: 'text-run-success',
  },
  FAILED: {
    label: 'FAILED',
    icon: XCircle,
    color: 'text-run-failed',
  },
  KILLED: {
    label: 'KILLED',
    icon: Ban,
    color: 'text-run-killed',
  },
  SKIPPED: {
    label: 'SKIPPED',
    icon: MinusCircle,
    color: 'text-run-skipped',
  },
};

interface StatusBadgeProps {
  state: StatusKind;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusBadge({ state, size = 'md', className }: StatusBadgeProps) {
  const { label, icon: Icon, color, spin } = STATUS[state];
  const text = {
    sm: 'text-2xs',
    md: 'text-xs',
    lg: 'text-sm',
  }[size];
  const glyph = {
    sm: 'h-3 w-3',
    md: 'h-[13px] w-[13px]',
    lg: 'h-3.5 w-3.5',
  }[size];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono tracking-[0.04em]',
        text,
        color,
        className,
      )}
    >
      <Icon
        className={cn('shrink-0', glyph, spin && 'animate-spin motion-reduce:animate-none')}
        aria-hidden
      />
      {label}
    </span>
  );
}

export function RetryBadge({ attempt, maxAttempts }: { attempt: number; maxAttempts: number }) {
  if (attempt <= 1) return null;
  const isExhausted = attempt >= maxAttempts;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5',
        'font-mono text-2xs tracking-[0.04em]',
        isExhausted
          ? 'border-cmd-line bg-cmd-fail-wash text-run-failed'
          : 'border-cmd-line bg-cmd-raised text-run-waiting',
      )}
      title={isExhausted ? 'All retries exhausted' : 'Retrying'}
    >
      <span aria-hidden>RETRY</span>
      {attempt}/{maxAttempts}
    </span>
  );
}
