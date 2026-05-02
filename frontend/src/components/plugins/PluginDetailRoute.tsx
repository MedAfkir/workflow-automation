import { Navigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { usePlugin } from '@/lib/api/plugins';
import { mockPluginDetailById } from '@/lib/mockData';
import { PluginDetailPage } from './PluginDetailPage';
export function PluginDetailRoute() {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const plugin = usePlugin(id);
  if (!id) return <Navigate to="/plugins" replace />;
  if (plugin.isError && plugin.error instanceof ApiError && plugin.error.status === 404) {
    return <Navigate to="/plugins" replace />;
  }
  if (plugin.isLoading) return <DetailLoading />;
  const demo = plugin.isError || !plugin.data;
  const data = demo ? mockPluginDetailById(id) : plugin.data!;
  if (!data) return <Navigate to="/plugins" replace />;
  return <PluginDetailPage plugin={data} demo={demo} />;
}
function DetailLoading() {
  return <div className="flex h-full w-full items-center justify-center gap-2 bg-cmd-bg font-mono text-cmd-fg-dim">
      <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
      <span className="text-[12px]">Loading plugin...</span>
    </div>;
}
