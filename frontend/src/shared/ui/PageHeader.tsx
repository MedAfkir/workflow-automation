import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, meta, actions }: PageHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-cmd-line bg-cmd-raised px-6">
      {meta ? (
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="font-mono text-lg font-semibold tracking-tight text-cmd-fg">{title}</h1>
          <span className="h-4 w-px shrink-0 bg-cmd-line" aria-hidden />
          {meta}
        </div>
      ) : (
        <div>
          <h1 className="font-mono text-lg font-semibold tracking-tight text-cmd-fg">{title}</h1>
          {description && (
            <p className="mt-0.5 font-mono text-xs text-cmd-fg-mute">{description}</p>
          )}
        </div>
      )}
      {actions && <div className="relative flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
