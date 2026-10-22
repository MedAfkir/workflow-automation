import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/lib/cn';

const kbdVariants = cva('rounded px-1 font-mono text-2xs', {
  variants: {
    variant: {
      outline: 'border border-cmd-line text-cmd-fg-mute',
      accent: 'bg-cmd-bg text-cmd-accent',
      accentOutline: 'border border-cmd-accent-dim',
    },
  },
  defaultVariants: {
    variant: 'outline',
  },
});

type KbdProps = HTMLAttributes<HTMLElement> & VariantProps<typeof kbdVariants>;

export function Kbd({ variant, className, ...props }: KbdProps) {
  return <kbd className={cn(kbdVariants({ variant }), className)} {...props} />;
}
