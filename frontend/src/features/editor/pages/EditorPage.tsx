import { AlertTriangle, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useCreateWorkflow } from '@/features/workflows';
import { ApiError } from '@/shared/api/client';
import { isTypingTarget } from '@/shared/hooks/useHotkeys';
import { cn } from '@/shared/lib/cn';

import { ConfigPanel } from '../components/ConfigPanel';
import { DraftBanner } from '../components/DraftBanner';
import { EditorCanvas } from '../components/EditorCanvas';
import { EditorHeader } from '../components/EditorHeader';
import { PluginPalette } from '../components/PluginPalette';
import { YamlPreview } from '../components/YamlPreview';
import { useHydratePluginCatalog } from '../lib/catalog';
import { clearDraft, readDraft, type StoredDraft, writeDraft } from '../lib/draft';
import { serializeWorkflow } from '../lib/serialize';
import { invalidTaskIds, validate } from '../lib/validate';
import { useEditorStore } from '../store';

export function EditorPage() {
  const navigate = useNavigate();
  const namespace = useEditorStore((s) => s.namespace);
  const wkey = useEditorStore((s) => s.key);
  const tasks = useEditorStore((s) => s.tasks);
  const selectedId = useEditorStore((s) => s.selectedId);
  const view = useEditorStore((s) => s.view);
  const dirty = useEditorStore((s) => s.dirty);
  const setView = useEditorStore((s) => s.setView);
  const removeTask = useEditorStore((s) => s.removeTask);
  const hydrate = useEditorStore((s) => s.hydrate);
  const reset = useEditorStore((s) => s.reset);
  useHydratePluginCatalog();
  const { mutateAsync: createWorkflow } = useCreateWorkflow();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [draftFound, setDraftFound] = useState<StoredDraft | null>(null);
  const issues = useMemo(
    () =>
      validate({
        namespace,
        key: wkey,
        tasks,
      }),
    [namespace, wkey, tasks],
  );
  const invalidIds = useMemo(() => invalidTaskIds(issues), [issues]);
  const blockingCount = issues.filter((i) => i.level === 'error').length;
  useEffect(() => {
    setDraftFound(readDraft());
  }, []);
  useEffect(() => {
    if (!dirty) return;
    writeDraft({
      namespace,
      key: wkey,
      tasks,
    });
    setDraftFound((d) => (d ? null : d));
  }, [dirty, namespace, wkey, tasks]);
  const handleSave = useCallback(async () => {
    const snapshot = {
      namespace: useEditorStore.getState().namespace,
      key: useEditorStore.getState().key,
      tasks: useEditorStore.getState().tasks,
    };
    const errs = validate(snapshot).filter((i) => i.level === 'error');
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
      const msg =
        err instanceof ApiError
          ? `Couldn't create the workflow (${err.status}). ${err.message}`
          : "Couldn't reach the backend to save. Your draft is kept locally - try again.";
      setSaveError(msg);
      setSaving(false);
    }
  }, [createWorkflow, navigate, reset]);
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const el = document.activeElement;
      const typing = isTypingTarget(el);
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
        case 'delete':
        case 'backspace':
          if (typing || !selectedId) break;
          e.preventDefault();
          removeTask(selectedId);
          break;
        case 'escape':
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
  }, [handleSave, selectedId, setView, removeTask, navigate]);

  return (
    <div className="flex h-full w-full flex-col bg-cmd-bg font-mono text-cmd-fg">
      <EditorHeader
        view={view}
        onViewChange={setView}
        issues={issues}
        saving={saving}
        onSave={() => void handleSave()}
      />

      {draftFound && (
        <DraftBanner
          savedAt={draftFound.savedAt}
          onResume={() => {
            hydrate(draftFound.snapshot);
            setDraftFound(null);
          }}
          onDiscard={() => {
            clearDraft();
            reset();
            setDraftFound(null);
          }}
        />
      )}

      {saveError && (
        <div className="flex shrink-0 items-start gap-2.5 border-b border-run-failed/40 bg-cmd-fail-wash px-6 py-2.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-run-failed" aria-hidden />
          <p className="min-w-0 flex-1 font-mono text-sm leading-relaxed text-run-failed">
            {saveError}
          </p>
          <button
            type="button"
            onClick={() => setSaveError(null)}
            aria-label="Dismiss"
            className="rounded p-0.5 text-run-failed outline-none transition-[filter] hover:brightness-125 focus-visible:ring-2 focus-visible:ring-cmd-accent"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <PluginPalette />

        <div className="flex min-w-0 flex-1 flex-col">
          {view === 'canvas' ? <EditorCanvas invalidIds={invalidIds} /> : <YamlPreview />}
        </div>

        <ConfigPanel issues={issues} showErrors={showErrors} />
      </div>

      <StatusBar taskCount={tasks.length} blockingCount={blockingCount} />
    </div>
  );
}

function StatusBar({ taskCount, blockingCount }: { taskCount: number; blockingCount: number }) {
  return (
    <footer className="flex h-7 shrink-0 items-center gap-3 border-t border-cmd-line bg-cmd-raised px-6">
      <span className="font-mono text-2xs tabular-nums text-cmd-fg-mute">
        {taskCount} task{taskCount === 1 ? '' : 's'}
      </span>
      <span className="h-3 w-px bg-cmd-line" />
      <span
        className={cn(
          'font-mono text-2xs tabular-nums',
          blockingCount === 0 ? 'text-cmd-fg-mute' : 'text-run-failed',
        )}
      >
        {blockingCount === 0 ? 'no blocking issues' : `${blockingCount} blocking`}
      </span>
      <span className="ml-auto font-mono text-2xs text-cmd-fg-mute">press ? for shortcuts</span>
    </footer>
  );
}
