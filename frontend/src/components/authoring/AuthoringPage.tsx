import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/api/client';
import { createWorkflow } from '@/lib/api/workflows';
import { serializeWorkflow } from '@/lib/authoring/serialize';
import { invalidTaskIds, validate } from '@/lib/authoring/validate';
import { clearDraft, readDraft, writeDraft, type StoredDraft } from '@/lib/authoring/draft';
import { useAuthoringStore } from './store';
import { AuthoringHeader } from './AuthoringHeader';
import { PluginPalette } from './PluginPalette';
import { AuthoringCanvas } from './AuthoringCanvas';
import { ConfigPanel } from './ConfigPanel';
import { YamlPreview } from './YamlPreview';
import { DraftBanner } from './DraftBanner';
import { AuthoringShortcuts } from './AuthoringShortcuts';
export function AuthoringPage() {
  const navigate = useNavigate();
  const namespace = useAuthoringStore(s => s.namespace);
  const wkey = useAuthoringStore(s => s.key);
  const tasks = useAuthoringStore(s => s.tasks);
  const selectedId = useAuthoringStore(s => s.selectedId);
  const view = useAuthoringStore(s => s.view);
  const dirty = useAuthoringStore(s => s.dirty);
  const setView = useAuthoringStore(s => s.setView);
  const removeTask = useAuthoringStore(s => s.removeTask);
  const hydrate = useAuthoringStore(s => s.hydrate);
  const reset = useAuthoringStore(s => s.reset);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [draftFound, setDraftFound] = useState<StoredDraft | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const issues = useMemo(() => validate({
    namespace,
    key: wkey,
    tasks
  }), [namespace, wkey, tasks]);
  const invalidIds = useMemo(() => invalidTaskIds(issues), [issues]);
  const blockingCount = issues.filter(i => i.level === 'error').length;
  useEffect(() => {
    setDraftFound(readDraft());
  }, []);
  useEffect(() => {
    if (!dirty) return;
    writeDraft({
      namespace,
      key: wkey,
      tasks
    });
    setDraftFound(d => d ? null : d);
  }, [dirty, namespace, wkey, tasks]);
  const handleSave = useCallback(async () => {
    const snapshot = {
      namespace: useAuthoringStore.getState().namespace,
      key: useAuthoringStore.getState().key,
      tasks: useAuthoringStore.getState().tasks
    };
    const errs = validate(snapshot).filter(i => i.level === 'error');
    if (errs.length > 0) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const detail = await createWorkflow(serializeWorkflow(snapshot));
      clearDraft();
      reset();
      navigate(`/workflows/${detail.id}`);
    } catch (err) {
      const msg = err instanceof ApiError ? `Couldn't create the workflow (${err.status}). ${err.message}` : "Couldn't reach the backend to save. Your draft is kept locally - try again.";
      setSaveError(msg);
      setSaving(false);
    }
  }, [navigate, reset]);
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const el = document.activeElement;
      const typing = el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void handleSave();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      switch (e.key.toLowerCase()) {
        case 's':
          if (typing) break;
          e.preventDefault();
          void handleSave();
          break;
        case 'g':
          if (typing) break;
          e.preventDefault();
          setView('canvas');
          break;
        case 'y':
          if (typing) break;
          e.preventDefault();
          setView('yaml');
          break;
        case '?':
          if (typing) break;
          e.preventDefault();
          setShortcutsOpen(o => !o);
          break;
        case 'delete':
        case 'backspace':
          if (typing || !selectedId) break;
          e.preventDefault();
          removeTask(selectedId);
          break;
        case 'escape':
          if (shortcutsOpen) break;
          if (typing) {
            (el as HTMLElement).blur();
            break;
          }
          e.preventDefault();
          navigate('/workflows');
          break;
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSave, selectedId, shortcutsOpen, setView, removeTask, navigate]);
  return <div className="flex h-full w-full flex-col bg-cmd-bg font-mono text-cmd-fg">
      <AuthoringHeader view={view} onViewChange={setView} issues={issues} saving={saving} onSave={() => void handleSave()} />

      {draftFound && <DraftBanner savedAt={draftFound.savedAt} onResume={() => {
      hydrate(draftFound.snapshot);
      setDraftFound(null);
    }} onDiscard={() => {
      clearDraft();
      reset();
      setDraftFound(null);
    }} />}

      {saveError && <div className="flex shrink-0 items-start gap-2.5 border-b border-run-failed/40 bg-cmd-fail-wash px-6 py-2.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-run-failed" aria-hidden />
          <p className="min-w-0 flex-1 font-mono text-[12px] leading-relaxed text-run-failed">
            {saveError}
          </p>
          <button type="button" onClick={() => setSaveError(null)} aria-label="Dismiss" className="rounded p-0.5 text-run-failed outline-none transition-[filter] hover:brightness-125 focus-visible:ring-2 focus-visible:ring-cmd-accent">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>}

      <div className="flex min-h-0 flex-1">
        <PluginPalette />

        <div className="flex min-w-0 flex-1 flex-col">
          {view === 'canvas' ? <AuthoringCanvas invalidIds={invalidIds} /> : <YamlPreview />}
        </div>

        <ConfigPanel issues={issues} showErrors={showErrors} />
      </div>

      <StatusBar taskCount={tasks.length} blockingCount={blockingCount} />

      <AuthoringShortcuts open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>;
}
function StatusBar({
  taskCount,
  blockingCount
}: {
  taskCount: number;
  blockingCount: number;
}) {
  return <footer className="flex h-7 shrink-0 items-center gap-3 border-t border-cmd-line bg-cmd-raised px-6">
      <span className="font-mono text-[10px] tabular-nums text-cmd-fg-mute">
        {taskCount} task{taskCount === 1 ? '' : 's'}
      </span>
      <span className="h-3 w-px bg-cmd-line" />
      <span className={cn('font-mono text-[10px] tabular-nums', blockingCount === 0 ? 'text-cmd-fg-mute' : 'text-run-failed')}>
        {blockingCount === 0 ? 'no blocking issues' : `${blockingCount} blocking`}
      </span>
      <span className="ml-auto font-mono text-[10px] text-cmd-fg-mute">
        press ? for shortcuts
      </span>
    </footer>;
}
