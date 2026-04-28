import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Braces, Clock, GitFork, Globe, Hourglass, Repeat, ScrollText, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowTask } from '@/lib/types';
export interface WorkflowNodeData {
  task: WorkflowTask;
  isSelected: boolean;
  [key: string]: unknown;
}
function glyphFor(type: string): LucideIcon {
  const leaf = (type.split('.').pop() ?? type).toLowerCase();
  if (leaf.includes('foreach')) return Repeat;
  if (leaf === 'if' || leaf.includes('branch')) return GitFork;
  if (leaf.includes('wait')) return Hourglass;
  if (leaf.includes('http')) return Globe;
  if (leaf.includes('log')) return ScrollText;
  if (leaf.includes('cron') || leaf.includes('schedule')) return Clock;
  return Braces;
}
function shortPluginName(type: string): string {
  const parts = type.split('.');
  return parts[parts.length - 1] ?? type;
}
function WorkflowDagNodeImpl({
  data
}: NodeProps) {
  const {
    task,
    isSelected
  } = data as WorkflowNodeData;
  const Icon = glyphFor(task.type);
  return <div className="relative">
      <Handle type="target" position={Position.Top} className="!bg-cmd-line-strong" />

      <div className={cn('group min-w-[180px] max-w-[240px] rounded-md border', 'border-cmd-line bg-cmd-surface', 'transition-[border-color,filter] duration-150', isSelected ? 'ring-1 ring-cmd-accent ring-offset-2 ring-offset-cmd-bg' : 'hover:border-cmd-line-strong hover:brightness-110')}>
        <div className="flex items-center gap-2 px-3 py-2">
          <Icon className="h-3.5 w-3.5 shrink-0 text-cmd-fg-mute" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="truncate font-mono text-[13px] font-medium text-cmd-fg">
              {task.id}
            </div>
            <div className="truncate font-mono text-[10px] text-cmd-fg-mute">
              {shortPluginName(task.type)}
            </div>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-cmd-line-strong" />
    </div>;
}
export const WorkflowDagNode = memo(WorkflowDagNodeImpl);
