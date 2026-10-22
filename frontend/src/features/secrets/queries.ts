import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createSecret, deleteSecret, fetchSecrets, rotateSecret } from './api';

export const secretKeys = {
  all: ['secrets'] as const,
  list: (namespace: string) => [...secretKeys.all, namespace] as const,
};

interface SecretRef {
  namespace: string;
  key: string;
}

export function useSecrets(namespace: string | undefined) {
  return useQuery({
    queryKey: secretKeys.list(namespace ?? ''),
    queryFn: ({ signal }) => fetchSecrets(namespace!, signal),
    enabled: !!namespace,
    retry: 1,
  });
}

function useInvalidateNamespace() {
  const queryClient = useQueryClient();
  return (namespace: string) =>
    queryClient.invalidateQueries({ queryKey: secretKeys.list(namespace) });
}

export function useCreateSecret() {
  const invalidate = useInvalidateNamespace();
  return useMutation({
    mutationFn: createSecret,
    onSuccess: (secret) => invalidate(secret.namespace),
  });
}

export function useRotateSecret() {
  const invalidate = useInvalidateNamespace();
  return useMutation({
    mutationFn: ({ namespace, key, value }: SecretRef & { value: string }) =>
      rotateSecret(namespace, key, value),
    onSuccess: (secret) => invalidate(secret.namespace),
  });
}

export function useDeleteSecret() {
  const invalidate = useInvalidateNamespace();
  return useMutation({
    mutationFn: ({ namespace, key }: SecretRef) => deleteSecret(namespace, key),
    onSuccess: (_, { namespace }) => invalidate(namespace),
  });
}
