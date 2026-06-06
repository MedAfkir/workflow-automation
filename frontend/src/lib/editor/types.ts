export interface DraftTask {
  id: string;
  type: string;
  dependsOn: string[];
  config: Record<string, unknown>;
  children: Record<string, DraftTask[]>;
}
export interface DraftSnapshot {
  namespace: string;
  key: string;
  tasks: DraftTask[];
}
export type EditorView = 'canvas' | 'yaml';
