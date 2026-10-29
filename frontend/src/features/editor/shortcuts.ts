import type { ShortcutGroup } from '@/shared/shortcuts/shortcuts';

export const editorShortcuts: ShortcutGroup = {
  id: 'editor',
  title: 'Editor',
  shortcuts: [
    { keys: [['s'], ['mod', 's']], label: 'Create the workflow' },
    { keys: [['g']], label: 'Canvas view' },
    { keys: [['y']], label: 'YAML view' },
    { keys: [['/']], label: 'Filter the plugins' },
    { keys: [['del'], ['backspace']], label: 'Remove the selected task' },
    { keys: [['esc']], label: 'Back to workflows' },
  ],
};
