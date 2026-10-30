import type { ExecutionState } from '@/features/executions/types';

/** Not terminal yet: still waiting for a dispatcher or running. */
export function isExecutionLive(state: ExecutionState): boolean {
  return state === 'CREATED' || state === 'RUNNING';
}
