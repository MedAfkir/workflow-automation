import { Navigate, useParams } from 'react-router-dom';

import { errorMessage, isNotFound } from '@/shared/api/client';
import { ErrorState, LoadingState } from '@/shared/ui/States';

import { WorkflowDetail } from '../components/WorkflowDetail';
import { useWorkflow, useWorkflowRevisions, useWorkflowTriggers } from '../queries';

export function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const workflow = useWorkflow(id);
  const revisions = useWorkflowRevisions(id);
  const triggers = useWorkflowTriggers(id);

  if (!id) return <Navigate to="/workflows" replace />;
  if (workflow.isError) {
    if (isNotFound(workflow.error)) return <Navigate to="/workflows" replace />;
    return (
      <ErrorState
        className="h-full w-full bg-cmd-bg"
        title="Couldn't load workflow"
        message={errorMessage(workflow.error)}
      />
    );
  }
  if (workflow.isLoading || !workflow.data) return <LoadingState label="Loading workflow..." />;

  return (
    <WorkflowDetail
      workflow={workflow.data}
      revisions={revisions.data ?? []}
      triggers={triggers.data ?? []}
    />
  );
}
