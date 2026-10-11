import { useState } from 'react';
import { ChevronRight, FileText } from 'lucide-react';
import { StatusBadge, RetryBadge } from './StatusBadge';
import { InputsView } from './InputsView';
import { cn, formatDuration } from '@/lib/utils';
import type { TaskRun } from '@/lib/types';
interface TaskSidebarProps {
  taskRun: TaskRun | null;
  onFilterLogsToTask: (taskRunId: string) => void;
}
export function TaskSidebar({
  taskRun,
  onFilterLogsToTask
}: TaskSidebarProps) {
  if (!taskRun) {
    return <EmptySidebar />;
  }
  const duration = computeDuration(taskRun);
  return <aside className={cn('flex h-full flex-col', 'border-l border-cmd-line bg-cmd-raised', 'overflow-y-auto')}>
      {}
      <div className="border-b border-cmd-line px-5 py-4">
        <h2 className="font-mono text-[15px] font-semibold text-cmd-fg">
          {taskRun.taskId}
        </h2>
        <p className="mt-0.5 font-mono text-[11px] text-cmd-fg-mute">
          {taskRun.taskType}
        </p>
      </div>

      {}
      <div className="flex items-center gap-2 border-b border-cmd-line px-5 py-3">
        <StatusBadge state={taskRun.state} size="md" />
        <span className="text-[11px] text-cmd-fg-mute">-</span>
        <span className="font-mono text-[11px] tabular-nums text-cmd-fg-dim">
          attempt {taskRun.attempt}/{taskRun.maxAttempts}
        </span>
        <RetryBadge attempt={taskRun.attempt} maxAttempts={taskRun.maxAttempts} />
        {duration && <>
            <span className="text-[11px] text-cmd-fg-mute">-</span>
            <span className="font-mono text-[11px] tabular-nums text-cmd-fg-dim">
              {duration}
            </span>
          </>}
      </div>

      {}
      {taskRun.state === 'FAILED' && taskRun.errorMessage && <Section title="Error" defaultOpen tone="danger">
          {taskRun.errorCode && <div className="mb-2">
              <span className="font-mono text-[10px] text-run-failed">
                {taskRun.errorCode}
              </span>
            </div>}
          <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-cmd-fg-dim">
            {taskRun.errorMessage}
          </pre>
        </Section>}

      {}
      <Section title="Inputs" defaultOpen>
        <InputsView data={taskRun.inputs} emptyLabel="No inputs" />
      </Section>

      {}
      <Section title="Outputs" defaultOpen={false}>
        <InputsView data={taskRun.outputs} emptyLabel={taskRun.state === 'PENDING' || taskRun.state === 'RUNNING' ? 'Pending' : 'No outputs'} />
      </Section>

      {}
      <div className="mt-auto border-t border-cmd-line px-5 py-3">
        <button type="button" onClick={() => onFilterLogsToTask(taskRun.id)} className={cn('inline-flex items-center gap-1.5 rounded-md px-1 py-0.5', 'font-mono text-[12px] text-cmd-accent outline-none', 'hover:brightness-110', 'focus-visible:ring-2 focus-visible:ring-cmd-accent', 'transition-[filter]')}>
          <FileText className="h-3 w-3" />
          Show only this task's logs
        </button>
      </div>
    </aside>;
}
function EmptySidebar() {
  return <aside className={cn('flex h-full flex-col items-center justify-center', 'border-l border-cmd-line bg-cmd-raised p-8 text-center')}>
      <div className="font-mono text-[13px] text-cmd-fg-dim">
        No task selected
      </div>
      <p className="mt-1 font-mono text-[12px] text-cmd-fg-mute">
        Click a node in the graph to inspect it.
      </p>
    </aside>;
}
function Section({
  title,
  defaultOpen = true,
  tone = 'default',
  children
}: {
  title: string;
  defaultOpen?: boolean;
  tone?: 'default' | 'danger';
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return <div className="border-b border-cmd-line">
      <button type="button" onClick={() => setOpen(v => !v)} className={cn('flex w-full items-center justify-between px-5 py-2.5 outline-none', 'transition-colors hover:bg-cmd-hover', 'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cmd-accent')}>
        <span className={cn('font-mono text-[12px] uppercase tracking-[0.12em]', tone === 'danger' ? 'text-run-failed' : 'text-cmd-fg-mute')}>
          {title}
        </span>
        <ChevronRight className={cn('h-3 w-3 text-cmd-fg-mute transition-transform', open && 'rotate-90')} />
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>;
}
function computeDuration(t: TaskRun): string | null {
  if (!t.startedAt) return null;
  const end = t.endedAt ? new Date(t.endedAt).getTime() : Date.now();
  return formatDuration(end - new Date(t.startedAt).getTime());
}
