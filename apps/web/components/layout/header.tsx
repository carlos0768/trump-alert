'use client';

import { useState, useEffect } from 'react';
import { Search, Bell } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY;

      // Only hide/show on mobile (lg breakpoint = 1024px)
      if (window.innerWidth < 1024) {
        // Scrolling down more than 10px -> hide
        if (scrollDelta > 10 && currentScrollY > 60) {
          setIsVisible(false);
        }
        // Scrolling up more than 10px -> show
        else if (scrollDelta < -10) {
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
        'flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 pl-16 transition-transform duration-300 lg:px-6 lg:pl-6 lg:translate-y-0',
        isVisible ? 'translate-y-0' : '-translate-y-full'
      )}
    >
      {/* Search */}
      <div className="flex flex-1 items-center justify-center px-4 lg:justify-start">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search news, topics, sources..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 transition-colors focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
          <Bell className="size-5" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500" />
        </button>

        {/* User Avatar */}
        <Avatar
          src="/avatar-placeholder.png"
          alt="User"
          fallback="U"
          size="sm"
        />
      </div>
    </header>
  );
}
