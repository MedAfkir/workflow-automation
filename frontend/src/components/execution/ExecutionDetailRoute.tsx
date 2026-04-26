import { Navigate, useParams } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { ExecutionDetailPage } from './ExecutionDetailPage';
import { useExecution } from '@/lib/api/executions';
import { ApiError } from '@/lib/api/client';
export function ExecutionDetailRoute() {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const {
    data,
    isLoading,
    isError,
    error
  } = useExecution(id);
  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return <Navigate to="/executions" replace />;
    }
    return <DetailError message={(error as Error | null)?.message ?? 'Unknown error'} />;
  }
  if (isLoading || !data) {
    return <DetailLoading />;
  }
  return <ExecutionDetailPage execution={data} />;
}
function DetailLoading() {
  return <div className="flex h-full w-full items-center justify-center gap-2 bg-cmd-bg font-mono text-cmd-fg-dim">
      <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
      <span className="text-[12px]">Loading execution...</span>
    </div>;
}
function DetailError({
  message
}: {
  message: string;
}) {
  return <div className="flex h-full w-full items-center justify-center bg-cmd-bg p-8 font-mono">
      <div className="max-w-md text-center">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md border border-cmd-line bg-cmd-fail-wash">
          <AlertTriangle className="h-4 w-4 text-run-failed" aria-hidden />
        </div>
        <div className="text-[13px] text-cmd-fg">Couldn't load execution</div>
        <p className="mt-2 break-all text-[11px] text-cmd-fg-mute">{message}</p>
      </div>
    </div>;
}
