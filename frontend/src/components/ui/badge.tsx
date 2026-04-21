import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
const badgeVariants = cva(['inline-flex items-center gap-1.5', 'rounded-md border', 'font-mono text-[11px] leading-none tracking-[0.02em]', 'whitespace-nowrap'].join(' '), {
  variants: {
    variant: {
      neutral: 'border-cmd-line text-cmd-fg-dim px-2.5 py-1',
      subtle: ['bg-cmd-raised text-cmd-fg', 'border-cmd-line', 'px-2 py-0.5 text-[10px]'].join(' '),
      mono: ['bg-cmd-raised text-cmd-fg-dim', 'border-cmd-line', 'px-2 py-0.5 text-[11px]'].join(' ')
    }
  },
  defaultVariants: {
    variant: 'neutral'
  }
});
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}
export function Badge({
  className,
  variant,
  ...props
}: BadgeProps) {
  return <span className={cn(badgeVariants({
    variant,
    className
  }))} {...props} />;
}
