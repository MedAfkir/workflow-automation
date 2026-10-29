import type { ShortcutGroup } from '@/shared/shortcuts/shortcuts';

export const executionsShortcuts: ShortcutGroup = {
  id: 'executions',
  title: 'Executions',
  shortcuts: [
    { keys: [['/']], label: 'Focus the filter' },
    { keys: [['up'], ['down']], label: 'Move between rows' },
    { keys: [['enter']], label: 'Open the focused execution' },
  ],
};
