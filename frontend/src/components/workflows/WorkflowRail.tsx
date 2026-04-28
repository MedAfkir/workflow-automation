import { useState, type ReactNode } from 'react';
import { AlertTriangle, Check, Clock, Copy, MousePointerClick, Webhook } from 'lucide-react';
import { cn, relativeTime, shortId } from '@/lib/utils';
import type { Trigger, TriggerKind, WorkflowDetail, WorkflowRevision } from '@/lib/types';
interface WorkflowRailProps {
  workflow: WorkflowDetail;
  triggers: Trigger[];
  revisions: WorkflowRevision[];
}
export function WorkflowRail({
  workflow,
  triggers,
  revisions
}: WorkflowRailProps) {
  return <aside className="flex w-[340px] shrink-0 flex-col overflow-y-auto border-l border-cmd-line bg-cmd-raised" aria-label="Workflow details">
      <Section title="Triggers" count={triggers.length}>
        {triggers.length === 0 ? <Hint>No triggers. This workflow runs manually only.</Hint> : <ul className="flex flex-col">
            {triggers.map(t => <TriggerRow key={t.id} trigger={t} />)}
          </ul>}
      </Section>

      <Section title="Revisions" count={revisions.length}>
        {revisions.length === 0 ? <Hint>Revision history unavailable.</Hint> : <ul className="flex flex-col">
            {revisions.map(r => <RevisionRow key={r.id} revision={r} isCurrent={r.revision === workflow.currentRevision} />)}
          </ul>}
      </Section>

      <Section title="Properties" last>
        <dl className="flex flex-col gap-2.5 px-5 py-3">
          <Prop label="Workflow id" value={workflow.id} copy mono />
          <Prop label="Created" value={relativeTime(workflow.createdAt)} title={workflow.createdAt} />
          <Prop label="Updated" value={relativeTime(workflow.updatedAt)} title={workflow.updatedAt} />
        </dl>
      </Section>
    </aside>;
}
function Section({
  title,
  count,
  last,
  children
}: {
  title: string;
  count?: number;
  last?: boolean;
  children: ReactNode;
}) {
  return <section className={cn(!last && 'border-b border-cmd-line')}>
      <div className="flex items-center gap-2 px-5 pb-2 pt-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.12em] text-cmd-fg-mute">
          {title}
        </h2>
        {count != null && count > 0 && <span className="font-mono text-[10px] tabular-nums text-cmd-fg-mute">
            {count}
          </span>}
      </div>
      <div className="pb-2">{children}</div>
    </section>;
}
function Hint({
  children
}: {
  children: ReactNode;
}) {
  return <p className="px-5 py-2 font-mono text-[11px] leading-relaxed text-cmd-fg-mute">
      {children}
    </p>;
}
function untilLabel(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'due now';
  const m = Math.round(diff / 60_000);
  if (m < 60) return `in ${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `in ${h}h`;
  return `in ${Math.round(h / 24)}d`;
}
const TRIGGER_GLYPH: Record<TriggerKind, typeof Clock> = {
  SCHEDULE: Clock,
  WEBHOOK: Webhook,
  MANUAL: MousePointerClick
};
function TriggerRow({
  trigger
}: {
  trigger: Trigger;
}) {
  const Glyph = TRIGGER_GLYPH[trigger.kind];
  const hasError = !!trigger.errorMessage;
  return <li className={cn('flex flex-col gap-1.5 px-5 py-2.5', 'border-t border-cmd-line first:border-t-0', !trigger.enabled && 'opacity-55')}>
      <div className="flex items-center gap-2">
        <Glyph className={cn('h-3.5 w-3.5 shrink-0', hasError ? 'text-run-failed' : 'text-cmd-fg-mute')} aria-hidden />
        <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-cmd-fg">
          {trigger.triggerId}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-cmd-fg-mute">
          {trigger.enabled ? trigger.kind.toLowerCase() : 'disabled'}
        </span>
      </div>

      {trigger.kind === 'WEBHOOK' && trigger.webhookUrl ? <CopyLine value={trigger.webhookUrl} /> : trigger.nextEvaluationAt ? <div className="pl-5 font-mono text-[11px] text-cmd-fg-mute">
          {trigger.summary ? `${trigger.summary} - ` : ''}next{' '}
          <span className="text-cmd-fg-dim" title={trigger.nextEvaluationAt}>
            {untilLabel(trigger.nextEvaluationAt)}
          </span>
        </div> : trigger.summary ? <div className="pl-5 font-mono text-[11px] text-cmd-fg-mute">
          {trigger.summary}
        </div> : null}

      {hasError && <div className="flex items-start gap-1.5 pl-5">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-run-failed" aria-hidden />
          <span className="font-mono text-[11px] leading-relaxed text-run-failed">
            {trigger.errorMessage}
          </span>
        </div>}
    </li>;
}
function RevisionRow({
  revision,
  isCurrent
}: {
  revision: WorkflowRevision;
  isCurrent: boolean;
}) {
  return <li className="flex items-center gap-3 border-t border-cmd-line px-5 py-2 first:border-t-0">
      <span className={cn('inline-flex items-center font-mono text-[12px] tabular-nums', isCurrent ? 'text-cmd-fg' : 'text-cmd-fg-dim')}>
        rev {revision.revision}
      </span>
      {isCurrent && <span className="rounded border border-cmd-accent-dim px-1 font-mono text-[10px] uppercase tracking-[0.08em] text-cmd-accent">
          current
        </span>}
      <span className="ml-auto font-mono text-[11px] text-cmd-fg-mute" title={revision.createdAt}>
        {relativeTime(revision.createdAt)}
      </span>
      <CopyButton value={revision.hash} label="Copy revision hash" text={revision.hash.slice(0, 7)} />
    </li>;
}
function Prop({
  label,
  value,
  title,
  copy,
  mono
}: {
  label: string;
  value: string;
  title?: string;
  copy?: boolean;
  mono?: boolean;
}) {
  return <div className="flex items-center justify-between gap-3">
      <dt className="font-mono text-[11px] text-cmd-fg-mute">{label}</dt>
      <dd className={cn('flex min-w-0 items-center gap-1.5 text-[11px] text-cmd-fg-dim', mono && 'font-mono')} title={title}>
        <span className="truncate">{copy ? shortId(value) : value}</span>
        {copy && <CopyButton value={value} label={`Copy ${label}`} />}
      </dd>
    </div>;
}
function CopyButton({
  value,
  label,
  text
}: {
  value: string;
  label: string;
  text?: string;
}) {
  const [copied, setCopied] = useState(false);
  return <button type="button" aria-label={label} title={label} onClick={() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }} className={cn('inline-flex items-center gap-1 rounded px-1 py-0.5', 'font-mono text-[10px] text-cmd-fg-mute outline-none transition-colors', 'hover:bg-cmd-hover hover:text-cmd-fg', 'focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
      {text && <span className="text-cmd-fg-dim">{text}</span>}
      {copied ? <Check className="h-3 w-3 text-run-success" aria-hidden /> : <Copy className="h-3 w-3" aria-hidden />}
    </button>;
}
function CopyLine({
  value
}: {
  value: string;
}) {
  const [copied, setCopied] = useState(false);
  return <button type="button" onClick={() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }} aria-label="Copy webhook URL" title={value} className={cn('group ml-5 flex items-center gap-1.5 rounded-md border border-cmd-line bg-cmd-bg px-2 py-1', 'outline-none transition-colors hover:bg-cmd-hover', 'focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
      <span className="min-w-0 flex-1 truncate text-left font-mono text-[10px] text-cmd-fg-dim">
        {value}
      </span>
      {copied ? <Check className="h-3 w-3 shrink-0 text-run-success" aria-hidden /> : <Copy className="h-3 w-3 shrink-0 text-cmd-fg-mute group-hover:text-cmd-fg" aria-hidden />}
    </button>;
}
