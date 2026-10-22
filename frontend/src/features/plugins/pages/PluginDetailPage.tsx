import { Navigate, useParams } from 'react-router-dom';

import { errorMessage, isNotFound } from '@/shared/api/client';
import { ErrorState, LoadingState } from '@/shared/ui/States';

import { PluginDetail } from '../components/PluginDetail';
import { usePlugin } from '../queries';

export function PluginDetailPage() {
  const { id } = useParams<{ id: string }>();
  const plugin = usePlugin(id);

  if (!id) return <Navigate to="/plugins" replace />;
  if (plugin.isError) {
    if (isNotFound(plugin.error)) return <Navigate to="/plugins" replace />;
    return (
      <ErrorState
        className="h-full w-full bg-cmd-bg"
        title="Couldn't load plugin"
        message={errorMessage(plugin.error)}
      />
    );
  }
  if (plugin.isLoading) return <LoadingState label="Loading plugin..." />;
  if (!plugin.data) return <Navigate to="/plugins" replace />;
  return <PluginDetail plugin={plugin.data} />;
}
