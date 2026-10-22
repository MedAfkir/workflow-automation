import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

import { cn } from '@/shared/lib/cn';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-mono outline-none',
    'transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-cmd-accent',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-cmd-accent text-cmd-bg transition-[filter] hover:brightness-110',
        ghost:
          'border border-cmd-line bg-cmd-raised text-cmd-fg-dim hover:bg-cmd-hover hover:text-cmd-fg',
        subtle: 'bg-cmd-raised text-cmd-fg-dim hover:bg-cmd-hover hover:text-cmd-fg',
        destructive: 'border border-cmd-line bg-cmd-fail-wash text-run-failed hover:brightness-125',
        icon: 'rounded-full border border-cmd-line bg-cmd-raised text-cmd-fg-dim hover:bg-cmd-hover hover:text-cmd-fg',
      },
      size: {
        sm: 'h-7 px-2.5 text-sm',
        md: 'h-8 px-3 text-base',
        lg: 'h-9 px-4 text-md',
        icon: 'h-7 w-7 p-0',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
    );
  },
);

Button.displayName = 'Button';
