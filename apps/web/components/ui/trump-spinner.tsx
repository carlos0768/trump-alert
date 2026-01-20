'use client';

import { cn } from '@/lib/utils';

interface TrumpSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'size-8',
  md: 'size-12',
  lg: 'size-16',
};

export function TrumpSpinner({ size = 'md', className }: TrumpSpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="relative">
        <img
          src="/trump-face.png"
          alt="Loading..."
          className={cn(sizeClasses[size], 'animate-spin rounded-full')}
          style={{ animationDuration: '1s' }}
        />
        {/* Glow effect */}
        <div
          className={cn(
            'absolute inset-0 rounded-full bg-primary-500/20 blur-xl animate-pulse',
            sizeClasses[size]
          )}
        />
      </div>
    </div>
  );
}

// Full page loading overlay
export function TrumpLoadingOverlay() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-background">
      <TrumpSpinner size="lg" />
      <p className="font-headline text-sm tracking-wider text-muted-foreground animate-pulse">
        LOADING...
      </p>
    </div>
  );
}
