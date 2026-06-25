import { useMemo, useState } from 'react';
import { TopBar } from './TopBar';
import { DAGCanvas } from './DAGCanvas';
import { TaskSidebar } from './TaskSidebar';
import { LogsDrawer } from './LogsDrawer';
import { useExecutionLogs } from '@/lib/api/logs';
import type { Execution } from '@/lib/types';
interface ExecutionDetailPageProps {
  execution: Execution;
}
export function ExecutionDetailPage({
  execution
}: ExecutionDetailPageProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>('fetch_users');
  const isLive = execution.state === 'CREATED' || execution.state === 'RUNNING';
  const selectedTask = useMemo(() => execution.taskRuns.find(t => t.taskId === selectedTaskId) ?? null, [execution.taskRuns, selectedTaskId]);
  const taskIdByRunId = useMemo(() => new Map(execution.taskRuns.map(t => [t.id, t.taskId])), [execution.taskRuns]);
  const {
    logs
  } = useExecutionLogs(execution.id, {
    taskIdByRunId
  });
  return <div className="flex h-full w-full flex-col bg-cmd-bg font-mono text-cmd-fg">
      <TopBar execution={execution} isLive={isLive} />

      <main className="flex flex-1 min-h-0">
        {}
        <div className="flex-[65] min-w-0">
          <DAGCanvas taskRuns={execution.taskRuns} selectedTaskId={selectedTaskId} onSelectTask={setSelectedTaskId} />
        </div>

        {}
        <div className="flex-[35] min-w-[320px] max-w-[480px]">
          <TaskSidebar taskRun={selectedTask} onFilterLogsToTask={() => {}} />
        </div>
      </main>

      <LogsDrawer logs={logs} selectedTaskRunId={selectedTask?.id ?? null} onSelectTask={setSelectedTaskId} />
    </div>;
}
