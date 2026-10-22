import type { ReactNode } from 'react';

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-cmd-line bg-cmd-raised px-6 py-3">
      {children}
    </div>
  );
}

export function ToolbarDivider() {
  return <span className="mx-1 h-4 w-px bg-cmd-line" />;
}

interface ResultCountProps {
  total: number;
  shown: number;
  noun: string;
}

export function ResultCount({ total, shown, noun }: ResultCountProps) {
  return (
    <span className="ml-auto font-mono text-xs tabular-nums text-cmd-fg-mute">
      {shown === total ? `${total} ${noun}${total === 1 ? '' : 's'}` : `${shown} / ${total}`}
    </span>
  );
}
