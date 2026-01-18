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
      <img
        src="/trump-face.png"
        alt="Loading..."
        className={cn(sizeClasses[size], 'animate-spin')}
        style={{ animationDuration: '1s' }}
      />
    </div>
  );
}

// Full page loading overlay
export function TrumpLoadingOverlay() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <TrumpSpinner size="lg" />
      <p className="text-sm text-gray-500 animate-pulse">Loading...</p>
    </div>
  );
}
