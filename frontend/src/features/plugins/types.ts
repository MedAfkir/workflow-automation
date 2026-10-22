export type PluginKind = 'TASK' | 'TRIGGER';

export interface PluginProperty {
  name: string;
  type: string;
  enumValues: string[] | null;
  required: boolean;
  defaultValue: string | null;
  description: string;
  format: string | null;
  sensitive: boolean;
}

export interface PluginSummary {
  id: string;
  name: string;
  kind: PluginKind;
  version: string;
  description: string;
  categories: string[];
  deprecated: boolean;
  replacedBy: string | null;
}

export interface PluginDetail extends PluginSummary {
  properties: PluginProperty[];
}
