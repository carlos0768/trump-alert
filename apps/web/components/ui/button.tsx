import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-headline text-sm tracking-wider uppercase transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary-600 text-white hover:bg-primary-500 hover:shadow-lg hover:shadow-primary-600/30 active:bg-primary-700',
        destructive:
          'bg-urgent text-white hover:bg-urgent-dark hover:shadow-lg hover:shadow-urgent/30',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-surface-elevated hover:border-primary-500 hover:text-primary-400',
        secondary:
          'bg-surface-elevated text-foreground hover:bg-surface-overlay',
        ghost:
          'text-muted-foreground hover:bg-surface-elevated hover:text-foreground',
        link: 'text-primary-500 underline-offset-4 hover:underline',
        accent:
          'bg-accent text-white hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/30',
        breaking:
          'bg-urgent text-white animate-pulse-urgent hover:shadow-lg hover:shadow-urgent/50',
      },
      size: {
        default: 'h-10 px-4 py-2 rounded-lg',
        sm: 'h-8 px-3 text-xs rounded-md',
        lg: 'h-12 px-6 rounded-lg',
        icon: 'size-10 rounded-lg',
        'icon-sm': 'size-8 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
