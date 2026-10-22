import { useQuery } from '@tanstack/react-query';

import { fetchPlugins } from './api';

export const pluginKeys = {
  all: ['plugins'] as const,
};

export function usePlugins() {
  return useQuery({
    queryKey: pluginKeys.all,
    queryFn: ({ signal }) => fetchPlugins(signal),
    staleTime: 5 * 60_000,
    retry: 1,
    networkMode: 'always',
  });
}

export function usePlugin(id: string | undefined) {
  const { data, isLoading, isError, error } = usePlugins();
  const plugin = id ? data?.find((p) => p.id === id) : undefined;
  return { data: plugin, isLoading, isError, error };
}
