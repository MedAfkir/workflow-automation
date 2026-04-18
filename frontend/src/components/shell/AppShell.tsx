import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
export function AppShell() {
  return <div className="flex h-screen w-screen bg-cmd-bg font-mono text-cmd-fg">
      <Sidebar />
      <main className="flex-1 min-w-0 min-h-0 overflow-hidden">
        <Outlet />
      </main>
    </div>;
}
