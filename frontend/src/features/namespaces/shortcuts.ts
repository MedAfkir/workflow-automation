import type { ShortcutGroup } from '@/shared/shortcuts/shortcuts';

export const namespacesShortcuts: ShortcutGroup = {
  id: 'namespaces',
  title: 'Namespaces',
  shortcuts: [
    { keys: [['/']], label: 'Focus the filter' },
    { keys: [['up'], ['down']], label: 'Move between rows' },
    { keys: [['enter']], label: 'Open the focused namespace' },
  ],
};
