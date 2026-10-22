import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

interface TableHeaderProps {
  grid: string;
  columns: readonly string[];
}

export function TableHeader({ grid, columns }: TableHeaderProps) {
  return (
    <div
      className={cn(
        'sticky top-0 z-10 grid items-center gap-4 border-b border-cmd-line-strong bg-cmd-raised px-6 py-2',
        'font-mono text-2xs uppercase tracking-[0.12em] text-cmd-fg-mute',
        grid,
      )}
    >
      {columns.map((column) => (
        <div key={column}>{column}</div>
      ))}
      <div aria-hidden />
    </div>
  );
}

export function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn('h-3 rounded-sm bg-cmd-hover motion-safe:animate-pulse', className)} />;
}

interface SkeletonRowsProps {
  grid: string;
  rows: number;
  children: ReactNode;
}

export function SkeletonRows({ grid, rows, children }: SkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className={cn('grid items-center gap-4 border-b border-cmd-line px-6 py-2.5', grid)}
        >
          {children}
          <span />
        </div>
      ))}
    </>
  );
}

interface TableSkeletonProps extends TableHeaderProps {
  rows: number;
  children: ReactNode;
}

export function TableSkeleton({ grid, columns, rows, children }: TableSkeletonProps) {
  return (
    <div className="flex-1 overflow-hidden bg-cmd-surface" aria-busy="true">
      <TableHeader grid={grid} columns={columns} />
      <SkeletonRows grid={grid} rows={rows}>
        {children}
      </SkeletonRows>
    </div>
  );
}
