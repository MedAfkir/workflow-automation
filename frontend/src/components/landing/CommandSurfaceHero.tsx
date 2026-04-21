import { Link } from 'react-router-dom';
import { ArrowRight, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkflowInstrument } from './WorkflowInstrument';
export function CommandSurfaceHero() {
  return <section className="border-b border-cmd-line">
      <div className="mx-auto max-w-[1180px] px-6 py-16 sm:py-20 lg:py-24">
        <div className="max-w-[680px]">
          {}
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-cmd-accent">
              <Workflow className="h-[18px] w-[18px] text-cmd-bg" aria-hidden />
            </span>
            <span className="font-mono leading-tight">
              <span className="block text-[15px] font-semibold text-cmd-fg">
                workflow
              </span>
              <span className="-mt-0.5 block text-[11px] text-cmd-fg-mute">
                platform - v0.1
              </span>
            </span>
          </div>

          <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.16em] text-cmd-fg-mute">
            workflow-automation engine
          </p>
          <h1 className="mt-4 text-balance font-sans text-[clamp(2.5rem,1.6rem+3vw,3.75rem)] font-[510] leading-[1.04] tracking-[-0.03em] text-cmd-fg">
            Workflows in YAML.
            <br />
            Runs you can watch.
          </h1>
          <p className="mt-6 max-w-[60ch] font-mono text-[13px] leading-relaxed text-cmd-fg-dim">
            Compose a DAG of typed tasks, save it as an immutable revision, run
            it, and watch every state. The YAML stays canonical. You never curl
            the API or guess what happened.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Button asChild variant="primary" size="lg" className="h-11 px-5 sm:h-9 sm:px-4">
              <Link to="/executions">
                Open console
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <span className="font-mono text-[12px] text-cmd-fg-mute">
              no signup. opens straight onto live executions.
            </span>
          </div>
        </div>

        <div className="mt-14 lg:mt-16">
          <WorkflowInstrument />
        </div>
      </div>
    </section>;
}
