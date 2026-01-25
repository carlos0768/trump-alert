'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Scale, GitBranch, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/fact-check', label: 'Factcheck', icon: Scale },
  { href: '/storylines', label: 'Storylines', icon: GitBranch },
];

export function BottomNav() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-md safe-area-bottom lg:hidden">
      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="absolute inset-x-0 bottom-full border-t border-border bg-surface p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search breaking news, topics..."
              autoFocus
              className="w-full rounded-lg border border-border bg-surface-elevated py-2.5 pl-10 pr-10 text-sm text-foreground placeholder-muted-foreground focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <button
              onClick={() => setIsSearchOpen(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex h-16 items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors',
                isActive
                  ? 'text-primary-500'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="size-5" />
              <span className="font-headline text-[10px] tracking-wider">
                {item.label.toUpperCase()}
              </span>
            </Link>
          );
        })}

        {/* Search Button */}
        <button
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className={cn(
            'flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors',
            isSearchOpen
              ? 'text-primary-500'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Search className="size-5" />
          <span className="font-headline text-[10px] tracking-wider">
            SEARCH
          </span>
        </button>
      </div>
    </nav>
  );
}
