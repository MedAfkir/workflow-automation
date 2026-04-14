import { useQuery } from '@tanstack/react-query';
import { apiGet } from './client';
import type { PluginDetail, PluginKind, PluginProperty, PluginSummary } from '@/lib/types';
interface PluginSummaryWire {
  id: string;
  name?: string;
  kind: PluginKind;
  version: string;
  description?: string;
  categories?: string[];
  deprecated?: boolean;
  replacedBy?: string | null;
}
interface PluginPropertyWire {
  name: string;
  type: string;
  enumValues?: string[] | null;
  required?: boolean;
  defaultValue?: string | null;
  description?: string;
  format?: string | null;
  sensitive?: boolean;
}
interface PluginDetailWire extends PluginSummaryWire {
  properties?: PluginPropertyWire[];
}
function shortName(id: string): string {
  const parts = id.split('.');
  return parts[parts.length - 1] || id;
}
function adaptSummary(w: PluginSummaryWire): PluginSummary {
  return {
    id: w.id,
    name: w.name?.trim() ? w.name : shortName(w.id),
    kind: w.kind,
    version: w.version,
    description: w.description ?? '',
    categories: w.categories ?? [],
    deprecated: w.deprecated ?? false,
    replacedBy: w.replacedBy ?? null
  };
}
function adaptProperty(w: PluginPropertyWire): PluginProperty {
  return {
    name: w.name,
    type: w.type,
    enumValues: w.enumValues ?? null,
    required: w.required ?? false,
    defaultValue: w.defaultValue ?? null,
    description: w.description ?? '',
    format: w.format ?? null,
    sensitive: w.sensitive ?? false
  };
}
function adaptDetail(w: PluginDetailWire): PluginDetail {
  return {
    ...adaptSummary(w),
    properties: (w.properties ?? []).map(adaptProperty)
  };
}
export async function fetchPlugins(signal?: AbortSignal): Promise<PluginSummary[]> {
  const wire = await apiGet<PluginSummaryWire[]>('/api/v1/plugins', {
    signal
  });
  return (wire ?? []).map(adaptSummary);
}
export async function fetchPlugin(id: string, signal?: AbortSignal): Promise<PluginDetail> {
  const wire = await apiGet<PluginDetailWire>(`/api/v1/plugins/${id}`, {
    signal
  });
  if (!wire) throw new Error(`Plugin ${id} not found`);
  return adaptDetail(wire);
}
export function usePlugins() {
  return useQuery<PluginSummary[]>({
    queryKey: ['plugins'],
    queryFn: ({
      signal
    }) => fetchPlugins(signal),
    staleTime: 5 * 60_000,
    retry: 1,
    networkMode: 'always'
  });
}
export function usePlugin(id: string | undefined) {
  return useQuery<PluginDetail>({
    queryKey: ['plugin', id],
    queryFn: ({
      signal
    }) => fetchPlugin(id!, signal),
    enabled: !!id,
    staleTime: 5 * 60_000,
    retry: 1,
    networkMode: 'always'
  });
}
