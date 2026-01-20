'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Bell,
  BarChart3,
  Scale,
  Settings,
  X,
  BookOpen,
  FileSignature,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/lib/hooks';

const navigation = [
  { name: 'LIVE FEED', href: '/', icon: Home, badge: 'LIVE' },
  { name: 'STORYLINES', href: '/storylines', icon: BookOpen },
  { name: 'LEGISLATION', href: '/legislation', icon: FileSignature },
  { name: 'ALERTS', href: '/alerts', icon: Bell },
  { name: 'ANALYTICS', href: '/analytics', icon: BarChart3 },
  { name: 'FACT CHECK', href: '/fact-check', icon: Scale },
  { name: 'SETTINGS', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebarStore();

  // Close sidebar when route changes
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-border bg-gradient-to-b from-secondary-900 to-surface lg:block">
        <DesktopSidebarContent pathname={pathname} />
      </aside>

      {/* Mobile Sidebar - only render when open */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={close}
          />

          {/* Sidebar panel */}
          <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-gradient-to-b from-secondary-900 to-surface lg:hidden">
            <div className="flex h-full flex-col">
              {/* Logo */}
              <div className="flex h-16 items-center justify-between border-b border-border px-4">
                <Logo />
                <button
                  onClick={close}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                  aria-label="Close menu"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => (
                  <NavItem
                    key={item.name}
                    item={item}
                    isActive={pathname === item.href}
                  />
                ))}
              </nav>

              {/* Pro upgrade card */}
              <ProUpgradeCard />
            </div>
          </aside>
        </>
      )}
    </>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <div className="relative flex size-10 items-center justify-center rounded-lg bg-primary-600 shadow-lg shadow-primary-600/30 transition-all group-hover:shadow-primary-600/50">
        <Zap className="size-5 text-white" />
        <div className="absolute -right-1 -top-1 size-3 rounded-full bg-accent animate-pulse" />
      </div>
      <div className="flex flex-col">
        <span className="font-headline text-xl tracking-wider text-foreground">
          TRUMP
        </span>
        <span className="font-headline text-xs tracking-widest text-primary-500">
          TRACKER
        </span>
      </div>
    </Link>
  );
}

interface NavItemProps {
  item: {
    name: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
  };
  isActive: boolean;
}

function NavItem({ item, isActive }: NavItemProps) {
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 font-headline text-sm tracking-wider transition-all',
        isActive
          ? 'bg-primary-600/20 text-primary-400 shadow-inner'
          : 'text-muted-foreground hover:bg-surface-elevated hover:text-foreground'
      )}
    >
      <item.icon className={cn('size-5', isActive ? 'text-primary-500' : '')} />
      <span className="flex-1">{item.name}</span>
      {item.badge && (
        <span className="live-badge flex items-center gap-1 !px-2 !py-0.5 !text-[10px]">
          <span className="live-dot !size-1.5" />
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function ProUpgradeCard() {
  return (
    <div className="border-t border-border p-4">
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-primary-600/20 to-primary-900/20 p-4">
        {/* Decorative elements */}
        <div className="absolute -right-4 -top-4 size-24 rounded-full bg-primary-500/10 blur-2xl" />
        <div className="absolute -bottom-4 -left-4 size-16 rounded-full bg-accent/10 blur-xl" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="size-4 text-primary-400" />
            <span className="font-headline text-sm tracking-wider text-primary-400">
              PRO ACCESS
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Real-time alerts, advanced analytics, and priority notifications.
          </p>
          <button className="w-full rounded-lg bg-primary-600 px-3 py-2 font-headline text-sm tracking-wider text-white transition-all hover:bg-primary-500 hover:shadow-lg hover:shadow-primary-600/30">
            UPGRADE NOW
          </button>
        </div>
      </div>
    </div>
  );
}

// Separate component for desktop to avoid re-renders
function DesktopSidebarContent({ pathname }: { pathname: string }) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-4">
        <Logo />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => (
          <NavItem
            key={item.name}
            item={item}
            isActive={pathname === item.href}
          />
        ))}
      </nav>

      {/* Pro upgrade card */}
      <ProUpgradeCard />
    </div>
  );
}
