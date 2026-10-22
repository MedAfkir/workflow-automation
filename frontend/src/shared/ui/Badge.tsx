import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border font-mono text-xs leading-none tracking-[0.02em]',
  {
    variants: {
      variant: {
        neutral: 'border-cmd-line px-2.5 py-1 text-cmd-fg-dim',
        subtle: 'border-cmd-line bg-cmd-raised px-2 py-0.5 text-2xs text-cmd-fg',
        mono: 'border-cmd-line bg-cmd-raised px-2 py-0.5 text-xs text-cmd-fg-dim',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
);

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
