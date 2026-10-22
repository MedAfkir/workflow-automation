import { useQuery } from '@tanstack/react-query';

import { type ExecutionsQuery, fetchExecution, fetchExecutions } from './api';

export const executionKeys = {
  all: ['executions'] as const,
  list: (query: ExecutionsQuery) => [...executionKeys.all, 'list', query] as const,
  detail: (id: string) => [...executionKeys.all, 'detail', id] as const,
};

export function useExecutions(query: ExecutionsQuery = {}) {
  return useQuery({
    queryKey: executionKeys.list(query),
    queryFn: ({ signal }) => fetchExecutions(query, signal),
    refetchInterval: 5_000,
    refetchIntervalInBackground: false,
  });
}

export function useExecution(id: string | undefined) {
  return useQuery({
    queryKey: executionKeys.detail(id ?? ''),
    queryFn: ({ signal }) => fetchExecution(id!, signal),
    enabled: !!id,
  });
}
