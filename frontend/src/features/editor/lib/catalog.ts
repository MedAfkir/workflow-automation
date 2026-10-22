import { useEffect } from 'react';

import type { PluginDetail } from '@/features/plugins';
import { usePlugins } from '@/features/plugins';

let liveCatalog: ReadonlyMap<string, PluginDetail> | null = null;

export function useHydratePluginCatalog(): void {
  const { data } = usePlugins();
  useEffect(() => {
    liveCatalog = data && data.length > 0 ? new Map(data.map((p) => [p.id, p])) : null;
  }, [data]);
}

export function pluginSchema(type: string): PluginDetail | null {
  return liveCatalog?.get(type) ?? null;
}
