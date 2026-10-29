import type { ShortcutGroup } from '@/shared/shortcuts/shortcuts';

export const workflowsShortcuts: ShortcutGroup = {
  id: 'workflows',
  title: 'Workflows',
  shortcuts: [
    { keys: [['/']], label: 'Focus the filter' },
    { keys: [['n']], label: 'New workflow' },
    { keys: [['up'], ['down']], label: 'Move between rows' },
    { keys: [['enter']], label: 'Open the focused workflow' },
  ],
};

export const workflowDetailShortcuts: ShortcutGroup = {
  id: 'workflow-detail',
  title: 'Workflow detail',
  shortcuts: [
    { keys: [['r']], label: 'Run this workflow' },
    { keys: [['g']], label: 'Graph view' },
    { keys: [['y']], label: 'YAML view' },
    { keys: [['e']], label: 'Open in the editor' },
    { keys: [['up'], ['down']], label: 'Move through recent runs' },
    { keys: [['enter']], label: 'Open the focused run' },
    { keys: [['esc']], label: 'Back to workflows' },
  ],
};
