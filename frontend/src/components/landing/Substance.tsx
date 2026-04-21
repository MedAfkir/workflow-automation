interface Fact {
  term: string;
  def: string;
}
const FACTS: Fact[] = [{
  term: 'Source of truth',
  def: 'Canonical YAML. Round-tripped on every edit; the engine never diverges from it.'
}, {
  term: 'Execution',
  def: 'Event-driven. Postgres is the queue, so there is no extra broker to run.'
}, {
  term: 'Revisions',
  def: 'Immutable and numbered. A run pins the exact revision it executed.'
}, {
  term: 'Tasks',
  def: 'Typed plugins, addressed by FQN: Log, Http, ForEach, and more.'
}, {
  term: 'Triggers',
  def: 'Manual, cron schedule, or webhook with HMAC verification.'
}, {
  term: 'Secrets',
  def: 'Namespace-scoped. Set once, referenced by name, never read back.'
}, {
  term: 'Interface',
  def: 'This console and the wf CLI drive the same engine over one API.'
}, {
  term: 'Stack',
  def: 'Java and Spring on Postgres. A React console, keyboard-first.'
}];
export function Substance() {
  return <section className="border-b border-cmd-line">
      <div className="mx-auto max-w-[1180px] px-6 py-16 sm:py-20">
        <h2 className="font-mono text-[15px] font-semibold tracking-tight text-cmd-fg">
          What the engine actually is
        </h2>
        <p className="mt-2 max-w-[62ch] font-mono text-[12px] leading-relaxed text-cmd-fg-mute">
          No metrics theatre, no logo wall. The substance, as plainly as it
          would read in a spec.
        </p>

        <dl className="mt-12 max-w-[860px] border-t border-cmd-line font-mono">
          {FACTS.map(({
          term,
          def
        }) => <div key={term} className="grid grid-cols-1 gap-1 border-b border-cmd-line py-4 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-8">
              <dt className="text-[12px] uppercase tracking-[0.1em] text-cmd-fg-mute">
                {term}
              </dt>
              <dd className="text-[13px] leading-relaxed text-cmd-fg-dim">
                {def}
              </dd>
            </div>)}
        </dl>
      </div>
    </section>;
}
