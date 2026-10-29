import type { ShortcutGroup } from '@/shared/shortcuts/shortcuts';

export const pluginsShortcuts: ShortcutGroup = {
  id: 'plugins',
  title: 'Plugins',
  shortcuts: [
    { keys: [['/']], label: 'Focus the filter' },
    { keys: [['up'], ['down']], label: 'Move between rows' },
    { keys: [['enter']], label: 'Open the focused plugin' },
  ],
};

export const pluginDetailShortcuts: ShortcutGroup = {
  id: 'plugin-detail',
  title: 'Plugin detail',
  shortcuts: [
    { keys: [['c']], label: 'Copy the plugin id' },
    { keys: [['esc']], label: 'Back to plugins' },
  ],
};
