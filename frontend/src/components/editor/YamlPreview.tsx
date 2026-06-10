import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { serializeWorkflow } from '@/lib/editor/serialize';
import { useEditorStore } from './store';
export function YamlPreview() {
  const namespace = useEditorStore(s => s.namespace);
  const key = useEditorStore(s => s.key);
  const tasks = useEditorStore(s => s.tasks);
  const yaml = useMemo(() => serializeWorkflow({
    namespace,
    key,
    tasks
  }), [namespace, key, tasks]);
  const lines = useMemo(() => yaml.replace(/\n$/, '').split('\n'), [yaml]);
  return <section className="flex min-h-0 flex-1 flex-col" aria-label="YAML source">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-cmd-line bg-cmd-raised px-4">
        <span className="font-mono text-[11px] text-cmd-fg-mute">
          Generated from the canvas
        </span>
        <div className="flex items-center gap-3">
          <CopyYaml yaml={yaml} />
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-cmd-fg-mute" title="Editing YAML by hand lands with the Monaco editor (fast follow)">
            read-only
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-cmd-bg">
        <pre className="py-4 font-mono text-[12px] leading-relaxed">
          <code className="grid grid-cols-[auto_1fr]">
            {lines.map((line, i) => <span key={i} className="contents">
                <span className="select-none border-r border-cmd-line px-3 text-right tabular-nums text-cmd-fg-mute" aria-hidden>
                  {i + 1}
                </span>
                <span className="whitespace-pre px-4 text-cmd-fg-dim">
                  {line || ' '}
                </span>
              </span>)}
          </code>
        </pre>
      </div>
    </section>;
}
function CopyYaml({
  yaml
}: {
  yaml: string;
}) {
  const [copied, setCopied] = useState(false);
  return <button type="button" onClick={async () => {
    await navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }} className={cn('inline-flex items-center gap-1.5 rounded-md border border-cmd-line px-2 py-0.5', 'font-mono text-[11px] text-cmd-fg-mute outline-none transition-colors', 'hover:bg-cmd-hover hover:text-cmd-fg focus-visible:ring-2 focus-visible:ring-cmd-accent')} aria-label="Copy YAML source">
      {copied ? <Check className="h-3 w-3 text-run-success" aria-hidden /> : <Copy className="h-3 w-3" aria-hidden />}
      {copied ? 'Copied' : 'Copy'}
    </button>;
}
