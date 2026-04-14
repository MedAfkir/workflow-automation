import { mockPluginDetailById } from '@/lib/mockData';
import type { PluginDetail } from '@/lib/types';
export function pluginSchema(type: string): PluginDetail | null {
  return mockPluginDetailById(type);
}
