import * as React from 'react';
import { cn } from '@/lib/utils';
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  className,
  ...props
}, ref) => <div ref={ref} className={cn('rounded-card border border-[rgba(255,255,255,0.08)]', 'bg-[rgba(255,255,255,0.02)]', className)} {...props} />);
Card.displayName = 'Card';
export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  className,
  ...props
}, ref) => <div ref={ref} className={cn('flex flex-col gap-1 px-4 pt-4 pb-3', className)} {...props} />);
CardHeader.displayName = 'CardHeader';
export const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  className,
  ...props
}, ref) => <div ref={ref} className={cn('text-fg-primary font-signature tracking-heading-3', 'text-[15px] leading-tight', className)} {...props} />);
CardTitle.displayName = 'CardTitle';
export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  className,
  ...props
}, ref) => <div ref={ref} className={cn('px-4 pb-4', className)} {...props} />);
CardContent.displayName = 'CardContent';
