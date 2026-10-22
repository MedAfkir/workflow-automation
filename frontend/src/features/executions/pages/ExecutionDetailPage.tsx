import { Navigate, useParams } from 'react-router-dom';

import { errorMessage, isNotFound } from '@/shared/api/client';
import { ErrorState, LoadingState } from '@/shared/ui/States';

import { ExecutionDetail } from '../components/ExecutionDetail';
import { useExecution } from '../queries';

export function ExecutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useExecution(id);

  if (isError) {
    if (isNotFound(error)) return <Navigate to="/executions" replace />;
    return (
      <ErrorState
        className="h-full w-full bg-cmd-bg"
        title="Couldn't load execution"
        message={errorMessage(error)}
      />
    );
  }
  if (isLoading || !data) return <LoadingState label="Loading execution..." />;
  return <ExecutionDetail execution={data} />;
}
