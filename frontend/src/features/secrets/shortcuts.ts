import type { ShortcutGroup } from '@/shared/shortcuts/shortcuts';

export const secretsShortcuts: ShortcutGroup = {
  id: 'secrets',
  title: 'Secrets',
  shortcuts: [
    { keys: [['/']], label: 'Focus the filter' },
    { keys: [['n']], label: 'New secret' },
    { keys: [['up'], ['down']], label: 'Move between rows' },
    { keys: [['enter']], label: 'Open the focused secret' },
  ],
};
