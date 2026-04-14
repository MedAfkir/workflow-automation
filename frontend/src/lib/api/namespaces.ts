import { useMemo } from 'react';
import type { NamespaceSummary, WorkflowSummary } from '@/lib/types';
import { useWorkflows } from './workflows';
export function aggregateNamespaces(workflows: WorkflowSummary[]): NamespaceSummary[] {
  const byName = new Map<string, WorkflowSummary[]>();
  for (const w of workflows) {
    const members = byName.get(w.namespace);
    if (members) members.push(w);else byName.set(w.namespace, [w]);
  }
  return Array.from(byName, ([name, members]) => {
    const recentFirst = [...members].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return {
      name,
      workflowCount: members.length,
      disabledCount: members.reduce((n, w) => n + (w.enabled ? 0 : 1), 0),
      triggerCount: members.reduce((n, w) => n + w.triggerCount, 0),
      workflowKeys: recentFirst.map(w => w.key),
      updatedAt: recentFirst[0]?.updatedAt ?? null
    };
  });
}
export function useNamespaces() {
  const {
    data,
    isLoading,
    isError
  } = useWorkflows();
  const namespaces = useMemo(() => data ? aggregateNamespaces(data) : undefined, [data]);
  return {
    data: namespaces,
    isLoading,
    isError
  };
}
