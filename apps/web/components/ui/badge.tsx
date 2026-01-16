import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary-100 text-primary-700',
        secondary: 'bg-gray-100 text-gray-700',
        destructive: 'bg-red-100 text-red-700',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-yellow-100 text-yellow-800',
        outline: 'border border-gray-200 text-gray-700',
        // Impact levels
        impactS: 'bg-red-600 text-white',
        impactA: 'bg-orange-500 text-white',
        impactB: 'bg-yellow-500 text-black',
        impactC: 'bg-gray-500 text-white',
        // Bias
        biasLeft: 'bg-blue-500 text-white',
        biasCenter: 'bg-gray-500 text-white',
        biasRight: 'bg-red-500 text-white',
        // Sentiment
        positive: 'bg-green-500 text-white',
        negative: 'bg-red-500 text-white',
        neutral: 'bg-gray-500 text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

// Helper components for specific badge types
function ImpactBadge({ level }: { level: 'S' | 'A' | 'B' | 'C' }) {
  const variants = {
    S: 'impactS',
    A: 'impactA',
    B: 'impactB',
    C: 'impactC',
  } as const;

  return <Badge variant={variants[level]}>{level}</Badge>;
}

function BiasBadge({ bias }: { bias: 'Left' | 'Center' | 'Right' }) {
  const variants = {
    Left: 'biasLeft',
    Center: 'biasCenter',
    Right: 'biasRight',
  } as const;

  const labels = {
    Left: 'Left',
    Center: 'Center',
    Right: 'Right',
  };

  return <Badge variant={variants[bias]}>{labels[bias]}</Badge>;
}

function SentimentBadge({ sentiment }: { sentiment: number }) {
  let variant: 'positive' | 'negative' | 'neutral';
  let label: string;

  if (sentiment > 0.3) {
    variant = 'positive';
    label = `+${sentiment.toFixed(1)}`;
  } else if (sentiment < -0.3) {
    variant = 'negative';
    label = sentiment.toFixed(1);
  } else {
    variant = 'neutral';
    label = sentiment.toFixed(1);
  }

  return <Badge variant={variant}>{label}</Badge>;
}

export { Badge, badgeVariants, ImpactBadge, BiasBadge, SentimentBadge };
