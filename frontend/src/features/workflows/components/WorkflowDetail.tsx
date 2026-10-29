import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { type ExecutionSummary, useExecutions } from '@/features/executions';
import { ApiError } from '@/shared/api/client';
import { useHotkeys } from '@/shared/hooks/useHotkeys';

import { useRunWorkflow } from '../queries';
import type { Trigger, WorkflowDetail as Workflow, WorkflowRevision } from '../types';
import { DefinitionPanel, type DefinitionView } from './DefinitionPanel';
import { RecentRuns } from './RecentRuns';
import { WorkflowRail } from './WorkflowRail';
import { WorkflowTopBar } from './WorkflowTopBar';

interface WorkflowDetailProps {
  workflow: Workflow;
  revisions: WorkflowRevision[];
  triggers: Trigger[];
}

function runErrorMessage(error: unknown): string {
  return error instanceof ApiError
    ? `Couldn't start the run (${error.status}). ${error.message}`
    : "Couldn't reach the backend to start this run.";
}

export function WorkflowDetail({ workflow, revisions, triggers }: WorkflowDetailProps) {
  const navigate = useNavigate();
  const [view, setView] = useState<DefinitionView>('graph');
  const [runOpen, setRunOpen] = useState(false);
  const run = useRunWorkflow(workflow.id);
  const { data: executions } = useExecutions({ limit: 50 });

  const hashShort = useMemo(() => {
    const current = revisions.find((r) => r.revision === workflow.currentRevision);
    return current ? current.hash.slice(0, 7) : null;
  }, [revisions, workflow.currentRevision]);

  const lastRun = useMemo<ExecutionSummary | null>(() => {
    const mine = (executions ?? []).filter(
      (e) => e.workflowKey === workflow.key && e.workflowNamespace === workflow.namespace,
    );
    if (mine.length === 0) return null;
    return mine.reduce((latest, e) => (e.createdAt > latest.createdAt ? e : latest));
  }, [executions, workflow.key, workflow.namespace]);

  const submitRun = (inputs: Record<string, unknown>) =>
    run.mutate(inputs, { onSuccess: (res) => navigate(`/executions/${res.id}`) });

  useHotkeys({
    r: () => setRunOpen(true),
    g: () => setView('graph'),
    y: () => setView('yaml'),
    e: () => navigate(`/workflows/${workflow.id}/edit`),
    escape: !runOpen && (() => navigate('/workflows')),
  });

  return (
    <div className="flex h-full w-full flex-col bg-cmd-bg font-mono text-cmd-fg">
      <WorkflowTopBar
        workflow={workflow}
        triggerCount={triggers.length}
        hashShort={hashShort}
        lastRun={lastRun}
        runOpen={runOpen}
        runBusy={run.isPending}
        runError={run.isError ? runErrorMessage(run.error) : null}
        onToggleRun={() => setRunOpen((o) => !o)}
        onCloseRun={() => setRunOpen(false)}
        onSubmitRun={submitRun}
      />

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <DefinitionPanel
            tasks={workflow.tasks}
            sourceYaml={workflow.sourceYaml}
            view={view}
            onViewChange={setView}
          />
          <RecentRuns workflow={workflow} onRun={() => setRunOpen(true)} />
        </div>

        <WorkflowRail workflow={workflow} triggers={triggers} revisions={revisions} />
      </div>
    </div>
  );
}
