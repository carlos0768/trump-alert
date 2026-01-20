'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  ring?: boolean;
}

const sizeClasses = {
  xs: 'size-6',
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-12',
  xl: 'size-16',
};

const fontSizeClasses = {
  xs: 'text-xs',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

export function Avatar({
  src,
  alt,
  fallback,
  size = 'md',
  className,
  ring = false,
}: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full',
        sizeClasses[size],
        ring && 'ring-2 ring-primary-500 ring-offset-2 ring-offset-background',
        className
      )}
    >
      <AvatarPrimitive.Image
        src={src}
        alt={alt}
        className="aspect-square h-full w-full object-cover"
      />
      <AvatarPrimitive.Fallback
        className={cn(
          'flex h-full w-full items-center justify-center rounded-full bg-surface-elevated font-headline text-muted-foreground',
          fontSizeClasses[size]
        )}
      >
        {fallback}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
