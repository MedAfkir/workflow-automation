import { History } from 'lucide-react';
import { cn, relativeTime } from '@/lib/utils';
export function DraftBanner({
  savedAt,
  onResume,
  onDiscard
}: {
  savedAt: string;
  onResume: () => void;
  onDiscard: () => void;
}) {
  return <div className="flex shrink-0 items-center gap-3 border-b border-cmd-line bg-cmd-surface px-6 py-2">
      <History className="h-3.5 w-3.5 shrink-0 text-cmd-accent" aria-hidden />
      <p className="min-w-0 flex-1 font-mono text-[12px] text-cmd-fg-dim">
        You have an unsaved draft from{' '}
        <span className="text-cmd-fg" title={savedAt}>
          {relativeTime(savedAt)}
        </span>
        .
      </p>
      <button type="button" onClick={onResume} className={cn('inline-flex h-7 items-center rounded-md border border-cmd-accent-dim bg-cmd-sel px-2.5', 'font-mono text-[12px] text-cmd-accent outline-none transition-[filter] hover:brightness-110', 'focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
        Resume
      </button>
      <button type="button" onClick={onDiscard} className={cn('inline-flex h-7 items-center rounded-md border border-cmd-line bg-cmd-raised px-2.5', 'font-mono text-[12px] text-cmd-fg-mute outline-none transition-colors', 'hover:bg-cmd-hover hover:text-cmd-fg focus-visible:ring-2 focus-visible:ring-cmd-accent')}>
        Discard
      </button>
    </div>;
}
