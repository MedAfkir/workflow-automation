import { Navigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { useWorkflow, useWorkflowRevisions, useWorkflowTriggers } from '@/lib/api/workflows';
import { mockRevisionsFor, mockTriggersFor, mockWorkflowDetailById } from '@/lib/mockData';
import { WorkflowDetailPage } from './WorkflowDetailPage';
export function WorkflowDetailRoute() {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const workflow = useWorkflow(id);
  const revisions = useWorkflowRevisions(id);
  const triggers = useWorkflowTriggers(id);
  if (!id) return <Navigate to="/workflows" replace />;
  if (workflow.isError && workflow.error instanceof ApiError && workflow.error.status === 404) {
    return <Navigate to="/workflows" replace />;
  }
  if (workflow.isLoading) return <DetailLoading />;
  const demo = workflow.isError || !workflow.data;
  const data = demo ? mockWorkflowDetailById(id) : workflow.data!;
  const revisionList = revisions.data ?? (demo || revisions.isError ? mockRevisionsFor(id) : []);
  const triggerList = triggers.data ?? (demo || triggers.isError ? mockTriggersFor(id) : []);
  return <WorkflowDetailPage workflow={data} revisions={revisionList} triggers={triggerList} demo={demo} />;
}
function DetailLoading() {
  return <div className="flex h-full w-full items-center justify-center gap-2 bg-cmd-bg font-mono text-cmd-fg-dim">
      <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
      <span className="text-[12px]">Loading workflow...</span>
    </div>;
}
