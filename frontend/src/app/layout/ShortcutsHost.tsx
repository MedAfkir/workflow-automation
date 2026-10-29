import { useCallback, useEffect } from 'react';
import { matchPath, useLocation } from 'react-router-dom';

import { editorShortcuts } from '@/features/editor';
import { executionsShortcuts } from '@/features/executions';
import { namespacesShortcuts } from '@/features/namespaces';
import { pluginDetailShortcuts, pluginsShortcuts } from '@/features/plugins';
import { secretsShortcuts } from '@/features/secrets';
import { workflowDetailShortcuts, workflowsShortcuts } from '@/features/workflows';
import { isTypingTarget } from '@/shared/hooks/useHotkeys';
import type { ShortcutGroup } from '@/shared/shortcuts/shortcuts';
import { ShortcutsDialog } from '@/shared/shortcuts/ShortcutsDialog';

const COMMON: ShortcutGroup = {
  id: 'everywhere',
  title: 'Everywhere',
  shortcuts: [
    { keys: [['?'], ['mod', '/']], label: 'Keyboard shortcuts' },
    { keys: [['esc']], label: 'Close the open panel' },
  ],
};

const PAGES: { path: string; group: ShortcutGroup }[] = [
  { path: '/executions', group: executionsShortcuts },
  { path: '/workflows', group: workflowsShortcuts },
  { path: '/workflows/new', group: editorShortcuts },
  { path: '/workflows/:id', group: workflowDetailShortcuts },
  { path: '/namespaces', group: namespacesShortcuts },
  { path: '/plugins', group: pluginsShortcuts },
  { path: '/plugins/:id', group: pluginDetailShortcuts },
  { path: '/secrets', group: secretsShortcuts },
  { path: '/secrets/:namespace', group: secretsShortcuts },
];

const GROUPS = [...new Set(PAGES.map((p) => p.group))];

interface ShortcutsHostProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutsHost({ open, onOpenChange }: ShortcutsHostProps) {
  const { pathname } = useLocation();
  const current = PAGES.find((p) => matchPath(p.path, pathname))?.group ?? null;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented || e.altKey) return;
      const mod = e.metaKey || e.ctrlKey;
      const wanted =
        (mod && e.key === '/') ||
        (!mod && e.key === '?' && !isTypingTarget(document.activeElement));
      if (!wanted || document.querySelector('[aria-modal="true"]')) return;
      e.preventDefault();
      onOpenChange(true);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onOpenChange]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  if (!open) return null;

  return (
    <ShortcutsDialog
      current={current}
      common={COMMON}
      others={GROUPS.filter((g) => g !== current)}
      onClose={close}
    />
  );
}
