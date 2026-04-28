import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { runWorkflow } from '@/lib/api/workflows';
import { useExecutions } from '@/lib/api/executions';
import { ApiError } from '@/lib/api/client';
import { mockExecutions } from '@/lib/mockData';
import type { ExecutionSummary, Trigger, WorkflowDetail, WorkflowRevision } from '@/lib/types';
import { WorkflowTopBar } from './WorkflowTopBar';
import { DefinitionPanel, type DefinitionView } from './DefinitionPanel';
import { RecentRuns } from './RecentRuns';
import { WorkflowRail } from './WorkflowRail';
import { ShortcutsSheet } from './ShortcutsSheet';
interface WorkflowDetailPageProps {
  workflow: WorkflowDetail;
  revisions: WorkflowRevision[];
  triggers: Trigger[];
  demo: boolean;
}
export function WorkflowDetailPage({
  workflow,
  revisions,
  triggers,
  demo
}: WorkflowDetailPageProps) {
  const navigate = useNavigate();
  const [view, setView] = useState<DefinitionView>('graph');
  const [runOpen, setRunOpen] = useState(false);
  const [runBusy, setRunBusy] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const hashShort = useMemo(() => {
    const current = revisions.find(r => r.revision === workflow.currentRevision);
    return current ? current.hash.slice(0, 7) : null;
  }, [revisions, workflow.currentRevision]);
  const {
    data: execData,
    isError: execError
  } = useExecutions({
    limit: 50
  });
  const lastRun = useMemo<ExecutionSummary | null>(() => {
    const source = execError ? mockExecutions : execData ?? [];
    const mine = source.filter(e => e.workflowKey === workflow.key && e.workflowNamespace === workflow.namespace);
    if (mine.length === 0) return null;
    return mine.reduce((latest, e) => (e.createdAt ?? '') > (latest.createdAt ?? '') ? e : latest);
  }, [execData, execError, workflow.key, workflow.namespace]);
  const submitRun = useCallback(async (inputs: Record<string, unknown>) => {
    setRunBusy(true);
    setRunError(null);
    try {
      const res = await runWorkflow(workflow.id, inputs);
      navigate(`/executions/${res.id}`);
    } catch (err) {
      const msg = err instanceof ApiError ? `Couldn't start the run (${err.status}). ${err.message}` : "Couldn't reach the backend to start this run.";
      setRunError(msg);
      setRunBusy(false);
    }
  }, [workflow.id, navigate]);
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = document.activeElement;
      const typing = el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (typing) return;
      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault();
          setRunOpen(true);
          break;
        case 'g':
          e.preventDefault();
          setView('graph');
          break;
        case 'y':
          e.preventDefault();
          setView('yaml');
          break;
        case 'e':
          e.preventDefault();
          navigate(`/workflows/${workflow.id}/edit`);
          break;
        case '?':
          e.preventDefault();
          setShortcutsOpen(o => !o);
          break;
        case 'escape':
          if (runOpen || shortcutsOpen) break;
          e.preventDefault();
          navigate('/workflows');
          break;
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate, workflow.id, runOpen, shortcutsOpen]);
  return <div className="flex h-full w-full flex-col bg-cmd-bg font-mono text-cmd-fg">
      <WorkflowTopBar workflow={workflow} triggerCount={triggers.length} hashShort={hashShort} lastRun={lastRun} demo={demo} runOpen={runOpen} runBusy={runBusy} runError={runError} onToggleRun={() => setRunOpen(o => !o)} onCloseRun={() => setRunOpen(false)} onSubmitRun={submitRun} />

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <DefinitionPanel tasks={workflow.tasks} sourceYaml={workflow.sourceYaml} view={view} onViewChange={setView} />
          <RecentRuns workflow={workflow} onRun={() => setRunOpen(true)} />
        </div>

        <WorkflowRail workflow={workflow} triggers={triggers} revisions={revisions} />
      </div>

      <ShortcutsSheet open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>;
}
