import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
const buttonVariants = cva(['inline-flex items-center justify-center gap-1.5', 'rounded-md font-mono whitespace-nowrap', 'transition-colors duration-150 outline-none', 'focus-visible:ring-2 focus-visible:ring-cmd-accent', 'disabled:pointer-events-none disabled:opacity-50'].join(' '), {
  variants: {
    variant: {
      primary: 'bg-cmd-accent text-cmd-bg hover:brightness-110',
      ghost: ['bg-cmd-raised text-cmd-fg-dim', 'border border-cmd-line', 'hover:bg-cmd-hover hover:text-cmd-fg'].join(' '),
      subtle: ['bg-cmd-raised text-cmd-fg-dim', 'hover:bg-cmd-hover hover:text-cmd-fg'].join(' '),
      destructive: ['bg-cmd-fail-wash text-run-failed', 'border border-cmd-line', 'hover:brightness-125'].join(' '),
      icon: ['bg-cmd-raised text-cmd-fg-dim rounded-full', 'border border-cmd-line', 'hover:bg-cmd-hover hover:text-cmd-fg'].join(' ')
    },
    size: {
      sm: 'h-7 px-2.5 text-[12px]',
      md: 'h-8 px-3 text-[13px]',
      lg: 'h-9 px-4 text-[14px]',
      icon: 'h-7 w-7 p-0'
    }
  },
  defaultVariants: {
    variant: 'ghost',
    size: 'md'
  }
});
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant,
  size,
  asChild = false,
  ...props
}, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp ref={ref} className={cn(buttonVariants({
    variant,
    size,
    className
  }))} {...props} />;
});
Button.displayName = 'Button';
export { Button, buttonVariants };
