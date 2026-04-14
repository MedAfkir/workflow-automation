export const FLOWABLE_BRANCHES: Record<string, readonly string[]> = {
  'io.workflowplatform.builtin.ForEach': ['tasks'],
  'io.workflowplatform.builtin.If': ['then', 'else'],
  'io.workflowplatform.builtin.Wait': []
};
export function branchesFor(type: string): readonly string[] {
  return FLOWABLE_BRANCHES[type] ?? [];
}
export function hasBranches(type: string): boolean {
  return branchesFor(type).length > 0;
}
