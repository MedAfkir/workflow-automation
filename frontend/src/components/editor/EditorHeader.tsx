import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Check, ChevronRight, FileCode2, GitBranch, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFocusTrap } from '@/lib/useFocusTrap';
import type { Issue } from '@/lib/editor/validate';
import type { EditorView } from '@/lib/editor/types';
import { useEditorStore } from './store';
interface EditorHeaderProps {
  view: EditorView;
  onViewChange: (v: EditorView) => void;
  issues: Issue[];
  saving: boolean;
  onSave: () => void;
}
export function EditorHeader({
  view,
  onViewChange,
  issues,
  saving,
  onSave
}: EditorHeaderProps) {
  const namespace = useEditorStore(s => s.namespace);
  const wkey = useEditorStore(s => s.key);
  const setNamespace = useEditorStore(s => s.setNamespace);
  const setKey = useEditorStore(s => s.setKey);
  const errors = issues.filter(i => i.level === 'error');
  const canSave = errors.length === 0 && !saving;
  const nsError = errors.some(i => i.field === 'namespace');
  const keyError = errors.some(i => i.field === 'key');
  return <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-cmd-line bg-cmd-raised px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Link to="/workflows" className={cn('shrink-0 rounded font-mono text-[12px] text-cmd-fg-mute outline-none', 'transition-colors hover:text-cmd-fg-dim focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
          workflows
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0 text-cmd-line-strong" aria-hidden />

        <div className="flex min-w-0 items-center gap-1" role="group" aria-label="Workflow identity">
          <IdentityInput value={namespace} onChange={setNamespace} placeholder="namespace" ariaLabel="Namespace" invalid={nsError} className="w-[120px]" />
          <span className="shrink-0 font-mono text-[14px] text-cmd-line-strong">/</span>
          <IdentityInput value={wkey} onChange={setKey} placeholder="key" ariaLabel="Key" invalid={keyError} className="w-[176px] font-semibold text-cmd-fg" />
        </div>

        <span className="shrink-0 rounded-md border border-cmd-accent-dim bg-cmd-sel px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-cmd-accent">
          new
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <ViewToggle view={view} onViewChange={onViewChange} />
        <ValidityChip issues={errors} />
        <button type="button" onClick={onSave} disabled={!canSave} aria-keyshortcuts="s" className={cn('inline-flex h-8 items-center gap-1.5 rounded-md px-3', 'bg-cmd-accent font-mono text-[13px] text-cmd-bg outline-none', 'transition-[filter] hover:brightness-110', 'focus-visible:ring-2 focus-visible:ring-cmd-accent', 'disabled:pointer-events-none disabled:opacity-50')}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden /> : <Check className="h-3.5 w-3.5" aria-hidden />}
          {saving ? 'Creating...' : 'Create workflow'}
          {!saving && <kbd className="ml-0.5 rounded bg-cmd-bg px-1 text-[10px] text-cmd-accent">S</kbd>}
        </button>
      </div>
    </header>;
}
function IdentityInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  invalid,
  className
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  ariaLabel: string;
  invalid: boolean;
  className?: string;
}) {
  return <input type="text" value={value} spellCheck={false} onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label={ariaLabel} aria-invalid={invalid || undefined} className={cn('min-w-0 rounded-md border bg-transparent px-1.5 py-0.5 font-mono text-[14px] text-cmd-fg-dim outline-none', 'placeholder:text-cmd-fg-mute hover:border-cmd-line', invalid ? 'border-run-failed/70' : 'border-transparent focus:border-cmd-accent-dim', className)} />;
}
function ViewToggle({
  view,
  onViewChange
}: {
  view: EditorView;
  onViewChange: (v: EditorView) => void;
}) {
  const tabs: {
    value: EditorView;
    label: string;
    icon: typeof GitBranch;
    kbd: string;
  }[] = [{
    value: 'canvas',
    label: 'Canvas',
    icon: GitBranch,
    kbd: 'G'
  }, {
    value: 'yaml',
    label: 'YAML',
    icon: FileCode2,
    kbd: 'Y'
  }];
  return <div role="tablist" aria-label="Editor view" className="flex items-center gap-1">
      {tabs.map(({
      value,
      label,
      icon: Icon,
      kbd
    }) => {
      const active = view === value;
      return <button key={value} type="button" role="tab" aria-selected={active} onClick={() => onViewChange(value)} className={cn('inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1', 'font-mono text-[11px] outline-none transition-colors', 'focus-visible:ring-2 focus-visible:ring-cmd-accent', active ? 'border-cmd-accent-dim bg-cmd-sel text-cmd-accent' : 'border-cmd-line text-cmd-fg-mute hover:bg-cmd-hover hover:text-cmd-fg-dim')}>
            <Icon className="h-3 w-3" aria-hidden />
            {label}
            <kbd className="ml-0.5 rounded border border-cmd-line px-1 text-[10px] text-cmd-fg-mute" aria-hidden>
              {kbd}
            </kbd>
          </button>;
    })}
    </div>;
}
function ValidityChip({
  issues
}: {
  issues: Issue[];
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const select = useEditorStore(s => s.select);
  const setView = useEditorStore(s => s.setView);
  useFocusTrap(panelRef, open, () => setOpen(false), triggerRef);
  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target) && triggerRef.current && !triggerRef.current.contains(target)) {
        setOpen(false);
      }
    }
    const t = setTimeout(() => window.addEventListener('mousedown', onClickOutside), 0);
    return () => {
      window.removeEventListener('mousedown', onClickOutside);
      clearTimeout(t);
    };
  }, [open]);
  if (issues.length === 0) {
    return <span className="inline-flex items-center gap-1.5 rounded-md border border-cmd-line px-2 py-1 font-mono text-[11px] text-run-success">
        <Check className="h-3 w-3" aria-hidden />
        ready
      </span>;
  }
  return <div className="relative">
      <button ref={triggerRef} type="button" onClick={() => setOpen(o => !o)} aria-haspopup="dialog" aria-expanded={open} className={cn('inline-flex items-center gap-1.5 rounded-md border border-run-failed/50 bg-cmd-fail-wash px-2 py-1', 'font-mono text-[11px] text-run-failed outline-none transition-[filter] hover:brightness-125', 'focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
        <AlertTriangle className="h-3 w-3" aria-hidden />
        {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
      </button>

      {open && <div ref={panelRef} role="dialog" aria-label="Validation issues" className="absolute right-0 top-[calc(100%+8px)] z-50 w-[320px] rounded-md border border-cmd-line-strong bg-cmd-raised">
          <div className="border-b border-cmd-line px-4 py-2.5 font-mono text-[12px] font-semibold text-cmd-fg">
            Fix to create
          </div>
          <ul className="max-h-[320px] overflow-y-auto py-1">
            {issues.map((issue, i) => <li key={i}>
                <button type="button" onClick={() => {
            if (issue.taskId) {
              setView('canvas');
              select(issue.taskId);
            }
            setOpen(false);
          }} className={cn('flex w-full items-start gap-2 px-4 py-1.5 text-left outline-none', 'transition-colors hover:bg-cmd-hover focus-visible:bg-cmd-hover')}>
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-run-failed" aria-hidden />
                  <span className="font-mono text-[11px] leading-relaxed text-cmd-fg-dim">
                    {issue.message}
                  </span>
                </button>
              </li>)}
          </ul>
        </div>}
    </div>;
}
