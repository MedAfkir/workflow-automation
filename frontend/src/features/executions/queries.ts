import { useQuery } from '@tanstack/react-query';

import { isExecutionLive } from '@/features/executions/lib/state';

import { type ExecutionsQuery, fetchExecution, fetchExecutions } from './api';

// TODO: unify with the backend dispatcher poll interval through a single config value.
const LIVE_DETAIL_REFETCH_MS = 2_000;

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
    // Poll while live, stop on terminal state.
    refetchInterval: (query) => {
      const state = query.state.data?.state;
      return state && isExecutionLive(state) ? LIVE_DETAIL_REFETCH_MS : false;
    },
    refetchIntervalInBackground: false,
  });
}
