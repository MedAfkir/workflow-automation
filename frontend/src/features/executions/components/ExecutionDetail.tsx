import { useMemo, useState } from 'react';

import { useExecutionLogs } from '@/features/executions/hooks/useExecutionLogs';
import { isExecutionLive } from '@/features/executions/lib/state';
import type { Execution } from '@/features/executions/types';

import { ExecutionDagCanvas } from './ExecutionDagCanvas';
import { ExecutionTopBar } from './ExecutionTopBar';
import { LogsDrawer } from './LogsDrawer';
import { TaskSidebar } from './TaskSidebar';

interface ExecutionDetailProps {
  execution: Execution;
}

export function ExecutionDetail({ execution }: ExecutionDetailProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>('fetch_users');
  const isLive = isExecutionLive(execution.state);
  const selectedTask = useMemo(
    () => execution.taskRuns.find((t) => t.taskId === selectedTaskId) ?? null,
    [execution.taskRuns, selectedTaskId],
  );
  const taskIdByRunId = useMemo(
    () => new Map(execution.taskRuns.map((t) => [t.id, t.taskId])),
    [execution.taskRuns],
  );
  const { logs } = useExecutionLogs(execution.id, {
    taskIdByRunId,
  });

  return (
    <div className="flex h-full w-full flex-col bg-cmd-bg font-mono text-cmd-fg">
      <ExecutionTopBar execution={execution} isLive={isLive} />

      <main className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-[65]">
          <ExecutionDagCanvas
            taskRuns={execution.taskRuns}
            selectedTaskId={selectedTaskId}
            onSelectTask={setSelectedTaskId}
          />
        </div>

        <div className="min-w-[320px] max-w-[480px] flex-[35]">
          <TaskSidebar taskRun={selectedTask} onFilterLogsToTask={() => {}} />
        </div>
      </main>

      <LogsDrawer
        logs={logs}
        selectedTaskRunId={selectedTask?.id ?? null}
        onSelectTask={setSelectedTaskId}
      />
    </div>
  );
}
