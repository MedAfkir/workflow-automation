import { Outlet } from 'react-router-dom';

import { Sidebar } from './Sidebar';

export function AppShell() {
  return (
    <div className="flex h-screen w-screen bg-cmd-bg font-mono text-cmd-fg">
      <Sidebar />
      <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
