import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/lib/cn';

const kbdVariants = cva('rounded px-1 font-mono text-2xs', {
  variants: {
    variant: {
      outline: 'border border-cmd-line text-cmd-fg-mute',
      accent: 'bg-cmd-bg text-cmd-accent',
      accentOutline: 'border border-cmd-accent-dim',
      cap: 'inline-flex h-5 min-w-5 items-center justify-center border border-b-2 border-cmd-line-strong bg-cmd-surface leading-none text-cmd-fg-dim',
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
