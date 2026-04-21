import { Link } from 'react-router-dom';
import { ArrowRight, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
const ROUTES = [{
  to: '/executions',
  label: 'Executions'
}, {
  to: '/workflows',
  label: 'Workflows'
}, {
  to: '/triggers',
  label: 'Triggers'
}, {
  to: '/secrets',
  label: 'Secrets'
}] as const;
export function ClosingCta() {
  return <>
      <section className="border-b border-cmd-line">
        <div className="mx-auto flex max-w-[1180px] flex-col items-start gap-7 px-6 py-20 sm:py-24">
          <h2 className="max-w-[20ch] text-balance font-sans text-[clamp(1.75rem,1.2rem+2vw,2.75rem)] font-[510] leading-[1.08] tracking-[-0.025em] text-cmd-fg">
            Open it and run something.
          </h2>
          <p className="max-w-[58ch] font-mono text-[13px] leading-relaxed text-cmd-fg-dim">
            The console renders live executions the moment it loads. No signup,
            no setup, no API keys to mint first.
          </p>
          <Button asChild variant="primary" size="lg" className="h-11 px-5 sm:h-9 sm:px-4">
            <Link to="/executions">
              Open console
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="mx-auto max-w-[1180px] px-6 py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-cmd-accent">
              <Workflow className="h-3.5 w-3.5 text-cmd-bg" aria-hidden />
            </span>
            <span className="font-mono leading-tight">
              <span className="block text-[13px] font-semibold text-cmd-fg">
                workflow
              </span>
              <span className="-mt-0.5 block text-[10px] text-cmd-fg-mute">
                platform - v0.1
              </span>
            </span>
          </div>

          <nav aria-label="Console" className="flex flex-wrap gap-x-6 gap-y-2">
            {ROUTES.map(({
            to,
            label
          }) => <Link key={to} to={to} className="rounded-sm font-mono text-[12px] text-cmd-fg-mute outline-none transition-colors hover:text-cmd-fg focus-visible:ring-2 focus-visible:ring-cmd-accent">
                {label}
              </Link>)}
          </nav>
        </div>

        <p className="mt-8 font-mono text-[11px] text-cmd-fg-mute">
          Java - Spring - Postgres-as-queue - React console - the wf CLI on the
          same engine.
        </p>
      </footer>
    </>;
}
