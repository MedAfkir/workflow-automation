export interface NamespaceSummary {
  name: string;
  workflowCount: number;
  disabledCount: number;
  triggerCount: number;
  workflowKeys: string[];
  updatedAt: string | null;
}
