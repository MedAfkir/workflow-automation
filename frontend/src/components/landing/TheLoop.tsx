import { Activity, FileCode2, GitBranch, PencilLine, Play, type LucideIcon } from 'lucide-react';
interface Stage {
  n: string;
  label: string;
  icon: LucideIcon;
  body: string;
}
const STAGES: Stage[] = [{
  n: '01',
  label: 'intent',
  icon: PencilLine,
  body: 'Inputs, typed tasks, and the dependencies between them.'
}, {
  n: '02',
  label: 'yaml',
  icon: FileCode2,
  body: 'The canonical source. Round-tripped, never hand-edited blind.'
}, {
  n: '03',
  label: 'dag',
  icon: GitBranch,
  body: 'Compiled to a graph. Cycles and bad refs rejected before save.'
}, {
  n: '04',
  label: 'run',
  icon: Play,
  body: 'Event-driven on a Postgres-backed queue. Manual, schedule, webhook.'
}, {
  n: '05',
  label: 'observe',
  icon: Activity,
  body: 'Every state, retry, and log line. Kill a run from the console.'
}];
export function TheLoop() {
  return <section className="border-b border-cmd-line">
      <div className="mx-auto max-w-[1180px] px-6 py-16 sm:py-20">
        <h2 className="font-mono text-[15px] font-semibold tracking-tight text-cmd-fg">
          From intent to observed execution
        </h2>
        <p className="mt-2 max-w-[62ch] font-mono text-[12px] leading-relaxed text-cmd-fg-mute">
          One loop. The author never leaves it, and never drops to a text
          editor or the raw API to get through it.
        </p>

        <ol className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-card border border-cmd-line bg-cmd-line sm:grid-cols-2 lg:grid-cols-5">
          {STAGES.map(({
          n,
          label,
          icon: Icon,
          body
        }) => <li key={n} className="flex flex-col gap-3 bg-cmd-surface p-5">
              <div className="flex items-center justify-between">
                <Icon className="h-4 w-4 text-cmd-fg-dim" aria-hidden strokeWidth={1.75} />
                <span className="font-mono text-[11px] tabular-nums text-cmd-fg-mute">
                  {n}
                </span>
              </div>
              <div>
                <h3 className="font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-cmd-fg">
                  {label}
                </h3>
                <p className="mt-1.5 font-mono text-[12px] leading-relaxed text-cmd-fg-dim">
                  {body}
                </p>
              </div>
            </li>)}
        </ol>
      </div>
    </section>;
}
