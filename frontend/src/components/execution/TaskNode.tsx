import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Check, Clock, Hourglass, Loader2, X, MinusCircle } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import type { TaskRun, TaskRunState } from '@/lib/types';
import { RetryBadge } from './StatusBadge';
export interface TaskNodeData {
  taskRun: TaskRun;
  isSelected: boolean;
  isHovered?: boolean;
  [key: string]: unknown;
}
const NODE_STYLE: Record<TaskRunState, {
  border: string;
  bg: string;
  icon: JSX.Element;
  text: string;
  pulse?: boolean;
}> = {
  PENDING: {
    border: 'border-cmd-line',
    bg: 'bg-cmd-surface',
    icon: <Clock className="h-3.5 w-3.5 text-run-pending" />,
    text: 'text-cmd-fg-dim'
  },
  RUNNING: {
    border: 'border-run-running',
    bg: 'bg-cmd-surface',
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin text-run-running motion-reduce:animate-none" />,
    text: 'text-cmd-fg',
    pulse: true
  },
  WAITING: {
    border: 'border-run-waiting',
    bg: 'bg-cmd-surface',
    icon: <Hourglass className="h-3.5 w-3.5 text-run-waiting" />,
    text: 'text-cmd-fg',
    pulse: true
  },
  SUCCESS: {
    border: 'border-run-success',
    bg: 'bg-cmd-surface',
    icon: <Check className="h-3.5 w-3.5 text-run-success" />,
    text: 'text-cmd-fg'
  },
  FAILED: {
    border: 'border-run-failed',
    bg: 'bg-cmd-fail-wash',
    icon: <X className="h-3.5 w-3.5 text-run-failed" />,
    text: 'text-cmd-fg'
  },
  SKIPPED: {
    border: 'border-dashed border-cmd-line',
    bg: 'bg-transparent',
    icon: <MinusCircle className="h-3.5 w-3.5 text-run-skipped" />,
    text: 'text-cmd-fg-mute line-through'
  }
};
function TaskNodeImpl({
  data
}: NodeProps) {
  const {
    taskRun,
    isSelected
  } = data as TaskNodeData;
  const style = NODE_STYLE[taskRun.state];
  const duration = computeDuration(taskRun);
  return <div className="relative">
      <Handle type="target" position={Position.Top} className="!bg-cmd-line-strong" />

      <div className={cn('group relative min-w-[180px] max-w-[240px]', 'rounded-md border', 'transition-all duration-150', style.border, style.bg, isSelected && 'ring-1 ring-cmd-accent ring-offset-2 ring-offset-cmd-bg', style.pulse && 'animate-node-pulse motion-reduce:animate-none', 'hover:brightness-110')}>
        <div className="flex items-center gap-2 px-3 py-2">
          {style.icon}
          <div className={cn('min-w-0 flex-1', style.text)}>
            <div className="truncate font-mono text-[13px] font-medium">
              {taskRun.taskId}
            </div>
            <div className="truncate font-mono text-[10px] text-cmd-fg-mute">
              {shortPluginName(taskRun.taskType)}
            </div>
          </div>
          <RetryBadge attempt={taskRun.attempt} maxAttempts={taskRun.maxAttempts} />
        </div>

        {duration && <div className="-mt-0.5 px-3 pb-1.5">
            <span className="font-mono text-[10px] tabular-nums text-cmd-fg-mute">
              {duration}
            </span>
          </div>}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-cmd-line-strong" />
    </div>;
}
export const TaskNode = memo(TaskNodeImpl);
function shortPluginName(type: string): string {
  const parts = type.split('.');
  return parts[parts.length - 1] ?? type;
}
function computeDuration(t: TaskRun): string | null {
  if (!t.startedAt) return null;
  const end = t.endedAt ? new Date(t.endedAt).getTime() : Date.now();
  return formatDuration(end - new Date(t.startedAt).getTime());
}
