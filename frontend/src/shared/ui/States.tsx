import { AlertTriangle, Loader2, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

interface EmptyStateProps {
  icon: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center bg-cmd-surface p-12">
      <div className="max-w-sm text-center">
        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md border border-cmd-line bg-cmd-raised">
          <Icon className="h-4 w-4 text-cmd-accent" aria-hidden />
        </div>
        <div className="font-mono text-base text-cmd-fg">{title}</div>
        {description && (
          <p className="mt-2 font-mono text-xs leading-relaxed text-cmd-fg-mute">{description}</p>
        )}
        {children}
      </div>
    </div>
  );
}

export function CommandHint({ children }: { children: ReactNode }) {
  return (
    <code className="mt-3 inline-block rounded-md border border-cmd-line bg-cmd-bg px-3 py-1.5 font-mono text-xs text-cmd-fg-dim">
      {children}
    </code>
  );
}

interface NoMatchesProps {
  message: string;
  onClear: () => void;
  clearLabel?: string;
}

export function NoMatches({ message, onClear, clearLabel = 'Clear filters' }: NoMatchesProps) {
  return (
    <div className="flex flex-1 items-center justify-center bg-cmd-surface p-12">
      <div className="text-center">
        <div className="font-mono text-base text-cmd-fg-dim">{message}</div>
        <button
          type="button"
          onClick={onClear}
          className={cn(
            'mt-3 rounded-md border border-cmd-line px-3 py-1 font-mono text-xs text-cmd-fg-dim outline-none transition-colors',
            'hover:bg-cmd-hover hover:text-cmd-fg focus-visible:ring-2 focus-visible:ring-cmd-accent',
          )}
        >
          {clearLabel}
        </button>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  title: ReactNode;
  message: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function ErrorState({ title, message, children, className }: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-1 items-center justify-center bg-cmd-surface p-8 font-mono',
        className,
      )}
    >
      <div className="max-w-md text-center">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md border border-cmd-line bg-cmd-fail-wash">
          <AlertTriangle className="h-4 w-4 text-run-failed" aria-hidden />
        </div>
        <div className="text-base text-cmd-fg">{title}</div>
        <p className="mx-auto mt-2 max-w-sm break-all text-xs text-cmd-fg-mute">{message}</p>
        {children}
      </div>
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center gap-2 bg-cmd-bg font-mono text-cmd-fg-dim">
      <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
