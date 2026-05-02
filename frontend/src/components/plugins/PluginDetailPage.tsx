import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Box, Check, ChevronRight, Copy, Lock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PluginDetail, PluginProperty } from '@/lib/types';
interface PluginDetailPageProps {
  plugin: PluginDetail;
  demo: boolean;
}
const SCHEMA_GRID = 'grid-cols-[minmax(140px,1fr)_minmax(104px,0.7fr)_84px_minmax(88px,0.6fr)_minmax(220px,2fr)]';
export function PluginDetailPage({
  plugin,
  demo
}: PluginDetailPageProps) {
  const navigate = useNavigate();
  const [idCopied, setIdCopied] = useState(false);
  const idTimer = useRef<number | null>(null);
  const copyId = useCallback(() => {
    navigator.clipboard?.writeText(plugin.id);
    setIdCopied(true);
    if (idTimer.current) window.clearTimeout(idTimer.current);
    idTimer.current = window.setTimeout(() => setIdCopied(false), 1500);
  }, [plugin.id]);
  useEffect(() => () => {
    if (idTimer.current) window.clearTimeout(idTimer.current);
  }, []);
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = document.activeElement;
      const typing = el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (typing) return;
      if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copyId();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        navigate('/plugins');
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [copyId, navigate]);
  const isTask = plugin.kind === 'TASK';
  const KindIcon = isTask ? Box : Zap;
  const required = plugin.properties.filter(p => p.required);
  return <div className="flex h-full w-full flex-col bg-cmd-bg font-mono text-cmd-fg">
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-cmd-line bg-cmd-raised px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/plugins" className={cn('shrink-0 rounded font-mono text-[12px] text-cmd-fg-mute outline-none', 'transition-colors hover:text-cmd-fg-dim', 'focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
            plugins
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-cmd-line-strong" aria-hidden />

          <h1 className="flex min-w-0 items-baseline gap-2">
            <span className="truncate font-mono text-[15px] font-semibold text-cmd-fg">
              {plugin.name}
            </span>
          </h1>

          <span className="flex shrink-0 items-center gap-1.5 font-mono text-[11px] tracking-[0.04em] text-cmd-fg-dim">
            <KindIcon className="h-3 w-3" aria-hidden />
            {isTask ? 'task' : 'trigger'}
          </span>

          <span className="text-[11px] text-cmd-line-strong">-</span>
          <span className="shrink-0 font-mono text-[11px] tabular-nums text-cmd-fg-mute">
            v{plugin.version}
          </span>

          {plugin.categories.length > 0 && <>
              <span className="text-[11px] text-cmd-line-strong">-</span>
              <div className="flex min-w-0 items-center gap-1">
                {plugin.categories.map(c => <span key={c} className="rounded-md border border-cmd-line px-1.5 py-0.5 font-mono text-[10px] text-cmd-fg-mute">
                    {c}
                  </span>)}
              </div>
            </>}

          {plugin.deprecated && <span className="flex shrink-0 items-center gap-1.5 rounded-md border border-cmd-line bg-cmd-fail-wash px-2 py-0.5 font-mono text-[11px] text-run-failed" title={plugin.replacedBy ? `Deprecated - use ${plugin.replacedBy}` : 'Deprecated'}>
              <AlertTriangle className="h-3 w-3" aria-hidden />
              deprecated
            </span>}

          {demo && <span className="ml-1 shrink-0 rounded-md border border-cmd-line bg-cmd-surface px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-cmd-fg-mute" title="Backend unreachable; showing demo data">
              demo data
            </span>}
        </div>

        <button type="button" onClick={copyId} aria-label="Copy plugin id" className={cn('inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-cmd-line bg-cmd-raised px-3', 'font-mono text-[13px] text-cmd-fg-dim outline-none transition-colors', 'hover:bg-cmd-hover hover:text-cmd-fg', 'focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
          {idCopied ? <Check className="h-3.5 w-3.5 text-run-success" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
          {idCopied ? 'Copied' : 'Copy id'}
          <kbd className="ml-0.5 rounded border border-cmd-line px-1 text-[10px] text-cmd-fg-mute">
            C
          </kbd>
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <section>
            <div className="select-text font-mono text-[12px] text-cmd-fg-dim">
              {plugin.id}
            </div>
            <p className="mt-2 max-w-[70ch] font-mono text-[13px] leading-relaxed text-cmd-fg">
              {plugin.description || <span className="text-cmd-fg-mute">
                  No description provided.
                </span>}
            </p>
          </section>

          <section className="mt-8">
            <div className="flex items-baseline gap-2">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.12em] text-cmd-fg-mute">
                Config schema
              </h2>
              <span className="font-mono text-[10px] tabular-nums text-cmd-fg-mute">
                {plugin.properties.length === 0 ? '-' : `${plugin.properties.length} ${plugin.properties.length === 1 ? 'property' : 'properties'}`}
              </span>
            </div>

            {plugin.properties.length === 0 ? <div className="mt-3 border-t border-cmd-line py-6 font-mono text-[12px] text-cmd-fg-mute">
                This plugin takes no configuration.
              </div> : <div className="mt-3 border-t border-cmd-line-strong">
                <div className={cn('grid gap-4 px-1 py-2', SCHEMA_GRID, 'font-mono text-[10px] uppercase tracking-[0.12em] text-cmd-fg-mute')}>
                  <div>Property</div>
                  <div>Type</div>
                  <div>Required</div>
                  <div>Default</div>
                  <div>Notes</div>
                </div>
                {plugin.properties.map(prop => <PropertyRow key={prop.name} prop={prop} />)}
              </div>}
          </section>

          <section className="mt-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.12em] text-cmd-fg-mute">
              Reference in a workflow
            </h2>
            <UsageSnippet kind={plugin.kind} id={plugin.id} name={plugin.name} required={required} />
          </section>
        </div>
      </div>
    </div>;
}
function PropertyRow({
  prop
}: {
  prop: PluginProperty;
}) {
  return <div className={cn('grid items-start gap-4 border-b border-cmd-line px-1 py-3', SCHEMA_GRID)}>
      <div className="min-w-0">
        <span className="font-mono text-[13px] font-medium text-cmd-fg">
          {prop.name}
        </span>
        {prop.sensitive && <span className="mt-1 flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-cmd-fg-mute" title="Scrubbed from logs and persisted output">
            <Lock className="h-3 w-3" aria-hidden />
            sensitive
          </span>}
      </div>

      <div className="min-w-0 font-mono text-[12px] text-cmd-fg-dim">
        {prop.type}
        {prop.enumValues && <div className="mt-1 break-words font-mono text-[10px] leading-relaxed text-cmd-fg-mute">
            {prop.enumValues.join(' - ')}
          </div>}
      </div>

      <div className={cn('font-mono text-[12px]', prop.required ? 'text-cmd-fg' : 'text-cmd-fg-mute')}>
        {prop.required ? 'required' : 'optional'}
      </div>

      <div className="min-w-0 break-words font-mono text-[12px] tabular-nums text-cmd-fg-dim">
        {prop.defaultValue ?? <span className="text-cmd-fg-mute">-</span>}
      </div>

      <div className="min-w-0 font-mono text-[12px] leading-relaxed text-cmd-fg-dim">
        {prop.description || <span className="text-cmd-fg-mute">-</span>}
        {prop.format && <span className="ml-2 inline-block rounded-md border border-cmd-line px-1.5 py-0.5 font-mono text-[10px] text-cmd-fg-mute">
            format: {prop.format}
          </span>}
      </div>
    </div>;
}
function placeholderFor(prop: PluginProperty): string {
  if (prop.name === 'cron') return '"*/15 * * * *"';
  if (prop.format === 'url') return 'https://example.com';
  switch (prop.type) {
    case 'duration':
      return 'PT30S';
    case 'integer':
      return '1';
    case 'boolean':
      return 'false';
    case 'list':
    case 'task[]':
      return '[]';
    case 'map':
      return '{}';
    case 'enum':
      return prop.enumValues?.[0] ?? '"..."';
    default:
      return '"..."';
  }
}
function UsageSnippet({
  kind,
  id,
  name,
  required
}: {
  kind: PluginDetail['kind'];
  id: string;
  name: string;
  required: PluginProperty[];
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);
  const isTrigger = kind === 'TRIGGER';
  const stepId = isTrigger ? `on_${name.toLowerCase()}` : name.toLowerCase();
  const lines = [`${isTrigger ? 'triggers' : 'tasks'}:`, `  - id: ${stepId}`, `    type: ${id}`];
  if (required.length > 0) {
    lines.push('    config:');
    for (const p of required) {
      lines.push(`      ${p.name}: ${placeholderFor(p)}`);
    }
  } else {
    lines.push('    # no required config');
  }
  const yaml = lines.join('\n');
  const copy = () => {
    navigator.clipboard?.writeText(yaml);
    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1500);
  };
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);
  return <div className="relative mt-3">
      <button type="button" onClick={copy} aria-label="Copy usage snippet" className={cn('absolute right-2 top-2 inline-flex items-center gap-1 rounded-md px-1.5 py-1', 'font-mono text-[11px] text-cmd-fg-mute outline-none transition-colors', 'hover:bg-cmd-hover hover:text-cmd-fg-dim', 'focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
        {copied ? <Check className="h-3 w-3 text-run-success" aria-hidden /> : <Copy className="h-3 w-3" aria-hidden />}
        {copied ? 'copied' : 'copy'}
      </button>
      <pre className="overflow-auto rounded-md border border-cmd-line bg-cmd-bg p-4 font-mono text-[12px] leading-relaxed text-cmd-fg-dim">
        {yaml}
      </pre>
    </div>;
}
