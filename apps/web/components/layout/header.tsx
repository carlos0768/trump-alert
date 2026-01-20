'use client';

import { useState, useEffect } from 'react';
import { Search, Bell, AlertTriangle, ChevronDown } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Update time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY;

      if (window.innerWidth < 1024) {
        if (scrollDelta > 10 && currentScrollY > 60) {
          setIsVisible(false);
        } else if (scrollDelta < -10) {
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className={cn(
        'flex h-16 flex-shrink-0 items-center justify-between border-b border-border bg-surface px-4 pl-16 transition-transform duration-300 lg:px-6 lg:pl-6 lg:translate-y-0',
        isVisible ? 'translate-y-0' : '-translate-y-full'
      )}
    >
      {/* Left section - Breaking indicator & time */}
      <div className="hidden items-center gap-4 lg:flex">
        <BreakingIndicator />
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground">
            {currentTime}
          </span>
          <span className="text-xs text-muted-foreground">EST</span>
        </div>
      </div>

      {/* Center - Search */}
      <div className="flex flex-1 items-center justify-center px-4 lg:justify-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search breaking news, topics..."
            className="w-full rounded-lg border border-border bg-surface-elevated py-2 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground transition-all focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground lg:block">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Alert count badge */}
        <AlertButton count={3} />

        {/* Notifications */}
        <NotificationButton count={12} />

        {/* User menu */}
        <UserMenu />
      </div>
    </header>
  );
}

function BreakingIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="breaking-badge">
          <AlertTriangle className="size-3" />
          <span>BREAKING</span>
        </div>
        {/* Glow effect */}
        <div className="absolute inset-0 rounded bg-urgent/30 blur-md -z-10" />
      </div>
      <span className="text-sm text-muted-foreground">5 new alerts</span>
    </div>
  );
}

function AlertButton({ count }: { count: number }) {
  return (
    <button className="relative flex items-center gap-1.5 rounded-lg bg-urgent/10 px-3 py-2 text-urgent transition-all hover:bg-urgent/20">
      <AlertTriangle className="size-4" />
      <span className="hidden font-headline text-xs tracking-wider sm:block">
        {count} URGENT
      </span>
      {/* Pulse effect */}
      <span className="absolute -right-1 -top-1 flex size-3">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-urgent opacity-75" />
        <span className="relative inline-flex size-3 rounded-full bg-urgent" />
      </span>
    </button>
  );
}

function NotificationButton({ count }: { count: number }) {
  return (
    <button className="relative rounded-lg p-2 text-muted-foreground transition-all hover:bg-surface-elevated hover:text-foreground">
      <Bell className="size-5" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}

function UserMenu() {
  return (
    <button className="flex items-center gap-2 rounded-lg p-1.5 transition-all hover:bg-surface-elevated">
      <Avatar
        src="/avatar-placeholder.png"
        alt="User"
        fallback="U"
        size="sm"
      />
      <ChevronDown className="hidden size-4 text-muted-foreground lg:block" />
    </button>
  );
}
