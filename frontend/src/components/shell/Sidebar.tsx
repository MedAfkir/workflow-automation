import { NavLink } from 'react-router-dom';
import { Activity, GitBranch, KeyRound, Layers, Plug, Webhook, Workflow } from 'lucide-react';
import { cn } from '@/lib/utils';
const NAV_ITEMS = [{
  to: '/executions',
  label: 'Executions',
  icon: Activity
}, {
  to: '/workflows',
  label: 'Workflows',
  icon: GitBranch
}, {
  to: '/namespaces',
  label: 'Namespaces',
  icon: Layers
}, {
  to: '/plugins',
  label: 'Plugins',
  icon: Plug
}, {
  to: '/triggers',
  label: 'Triggers',
  icon: Webhook
}, {
  to: '/secrets',
  label: 'Secrets',
  icon: KeyRound
}] as const;
export function Sidebar() {
  return <aside className={cn('flex h-full w-[220px] shrink-0 flex-col', 'border-r border-cmd-line bg-cmd-raised')}>
      {}
      <div className="flex h-16 items-center gap-2 border-b border-cmd-line px-5">
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-md', 'bg-cmd-accent')}>
          <Workflow className="h-3.5 w-3.5 text-cmd-bg" />
        </div>
        <div>
          <div className="font-mono text-[13px] font-semibold text-cmd-fg">
            workflow
          </div>
          <div className="-mt-0.5 font-mono text-[10px] text-cmd-fg-mute">
            platform - v0.1
          </div>
        </div>
      </div>

      {}
      <nav className="flex-1 px-2 py-4">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({
          to,
          label,
          icon: Icon
        }) => <li key={to}>
              <NavLink to={to} className={({
            isActive
          }) => cn('flex items-center gap-2.5 px-3 py-1.5', 'font-mono text-[13px] outline-none', 'rounded-md transition-colors', 'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cmd-accent', isActive ? 'bg-cmd-sel text-cmd-accent' : 'text-cmd-fg-mute hover:bg-cmd-hover hover:text-cmd-fg')}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </NavLink>
            </li>)}
        </ul>
      </nav>

      {}
      <div className="border-t border-cmd-line px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-run-success motion-safe:animate-live-pulse" />
          <span className="font-mono text-[10px] text-cmd-fg-mute">
            backend connected
          </span>
        </div>
      </div>
    </aside>;
}
