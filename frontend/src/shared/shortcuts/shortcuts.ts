export type Combo = readonly string[];

export interface Shortcut {
  keys: readonly Combo[];
  label: string;
}

export interface ShortcutGroup {
  id: string;
  title: string;
  shortcuts: readonly Shortcut[];
}

export const IS_MAC =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);

const KEY_NAMES: Record<string, string> = {
  mod: IS_MAC ? 'Cmd' : 'Ctrl',
  shift: 'Shift',
  enter: 'Enter',
  esc: 'Esc',
  del: 'Del',
  backspace: 'Backspace',
  up: 'Up',
  down: 'Down',
};

export function keyName(key: string): string {
  return KEY_NAMES[key] ?? key.toUpperCase();
}

export function filterGroups(groups: readonly ShortcutGroup[], query: string): ShortcutGroup[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [...groups];
  return groups
    .map((group) => ({
      ...group,
      shortcuts: group.shortcuts.filter((s) => {
        const text = [group.title, s.label, ...s.keys.flat().map(keyName)].join(' ').toLowerCase();
        return terms.every((t) => text.includes(t));
      }),
    }))
    .filter((group) => group.shortcuts.length > 0);
}
