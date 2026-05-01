import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { glyphForType } from './glyphs';
import type { DraftTask } from '@/lib/authoring/types';
export interface AuthoringNodeData {
  task: DraftTask;
  selected: boolean;
  invalid: boolean;
  branchCount: number;
  onDelete: (id: string) => void;
  [key: string]: unknown;
}
function shortPluginName(type: string): string {
  return type.split('.').pop() ?? type;
}
function AuthoringNodeImpl({
  data
}: NodeProps) {
  const {
    task,
    selected,
    invalid,
    branchCount,
    onDelete
  } = data as AuthoringNodeData;
  const Icon = glyphForType(task.type);
  return <div className="group/node relative">
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !bg-cmd-line-strong hover:!bg-cmd-accent" />

      <div className={cn('min-w-[184px] max-w-[240px] rounded-md border bg-cmd-surface', 'transition-[border-color,filter] duration-150', selected ? 'border-cmd-accent ring-1 ring-cmd-accent ring-offset-2 ring-offset-cmd-bg' : invalid ? 'border-run-failed/60 hover:border-run-failed' : 'border-cmd-line hover:border-cmd-line-strong hover:brightness-110')}>
        <div className="flex items-center gap-2 px-3 py-2">
          <Icon className="h-3.5 w-3.5 shrink-0 text-cmd-fg-mute" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-mono text-[13px] font-medium text-cmd-fg">
                {task.id || <span className="italic text-cmd-fg-mute">unnamed</span>}
              </span>
              {invalid && <AlertTriangle className="h-3 w-3 shrink-0 text-run-failed" aria-label="Incomplete" />}
            </div>
            <div className="truncate font-mono text-[10px] text-cmd-fg-mute">
              {shortPluginName(task.type)}
            </div>
          </div>
          {branchCount > 0 && <span className="shrink-0 rounded border border-cmd-line px-1 font-mono text-[10px] tabular-nums text-cmd-fg-mute" title={`${branchCount} nested task${branchCount === 1 ? '' : 's'}`}>
              {branchCount}
            </span>}
        </div>
      </div>

      {}
      <button type="button" onClick={e => {
      e.stopPropagation();
      onDelete(task.id);
    }} aria-label={`Remove task ${task.id}`} className={cn('absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full', 'border border-cmd-line bg-cmd-raised text-cmd-fg-mute', 'opacity-0 outline-none transition-opacity', 'hover:bg-cmd-hover hover:text-run-failed focus-visible:opacity-100', 'group-hover/node:opacity-100', 'focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
        <X className="h-3 w-3" aria-hidden />
      </button>

      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !bg-cmd-line-strong hover:!bg-cmd-accent" />
    </div>;
}
export const AuthoringNode = memo(AuthoringNodeImpl);
