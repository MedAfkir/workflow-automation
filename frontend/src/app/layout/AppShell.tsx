import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { ShortcutsHost } from './ShortcutsHost';
import { Sidebar } from './Sidebar';

export function AppShell() {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen bg-cmd-bg font-mono text-cmd-fg">
      <Sidebar shortcutsOpen={shortcutsOpen} onOpenShortcuts={() => setShortcutsOpen(true)} />
      <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
      <ShortcutsHost open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}
