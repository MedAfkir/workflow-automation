import { useQuery } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPost, apiPut } from './client';
import type { SecretSummary } from '@/lib/types';
interface SecretSummaryWire {
  id: string;
  namespace: string;
  key: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}
function adaptSummary(w: SecretSummaryWire): SecretSummary {
  return {
    id: w.id,
    namespace: w.namespace,
    key: w.key,
    version: w.version,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt
  };
}
const seg = encodeURIComponent;
export async function fetchSecrets(namespace: string, signal?: AbortSignal): Promise<SecretSummary[]> {
  const wire = await apiGet<SecretSummaryWire[]>(`/api/v1/secrets/${seg(namespace)}`, {
    signal
  });
  return (wire ?? []).map(adaptSummary);
}
export interface CreateSecretInput {
  namespace: string;
  key: string;
  value: string;
}
export async function createSecret(input: CreateSecretInput): Promise<SecretSummary> {
  const wire = await apiPost<SecretSummaryWire, CreateSecretInput>('/api/v1/secrets', input);
  return adaptSummary(wire);
}
export async function rotateSecret(namespace: string, key: string, value: string): Promise<SecretSummary> {
  const wire = await apiPut<SecretSummaryWire, {
    value: string;
  }>(`/api/v1/secrets/${seg(namespace)}/${seg(key)}`, {
    value
  });
  return adaptSummary(wire);
}
export async function deleteSecret(namespace: string, key: string): Promise<void> {
  await apiDelete(`/api/v1/secrets/${seg(namespace)}/${seg(key)}`);
}
export function useSecrets(namespace: string | undefined) {
  return useQuery({
    queryKey: ['secrets', namespace],
    queryFn: ({
      signal
    }) => fetchSecrets(namespace!, signal),
    enabled: !!namespace,
    retry: 1
  });
}
