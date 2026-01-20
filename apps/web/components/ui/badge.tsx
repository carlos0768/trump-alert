import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  className,
}: BadgeProps) {
  const variants = {
    default: 'bg-primary-600/20 text-primary-400 border-primary-600/30',
    secondary: 'bg-surface-elevated text-muted-foreground border-border',
    destructive: 'bg-urgent/20 text-urgent border-urgent/30',
    outline: 'bg-transparent text-foreground border-border',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-headline text-xs tracking-wider uppercase',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// Impact level badges with specific styling
interface ImpactBadgeProps {
  level: 'S' | 'A' | 'B' | 'C';
  className?: string;
}

export function ImpactBadge({ level, className }: ImpactBadgeProps) {
  const config = {
    S: {
      bg: 'bg-impact-s',
      text: 'text-white',
      label: 'CRITICAL',
      glow: 'shadow-lg shadow-impact-s/30',
    },
    A: {
      bg: 'bg-impact-a',
      text: 'text-white',
      label: 'HIGH',
      glow: 'shadow-md shadow-impact-a/30',
    },
    B: {
      bg: 'bg-impact-b',
      text: 'text-black',
      label: 'MEDIUM',
      glow: '',
    },
    C: {
      bg: 'bg-impact-c',
      text: 'text-white',
      label: 'LOW',
      glow: '',
    },
  };

  const { bg, text, glow } = config[level];

  return (
    <span
      className={cn(
        'impact-badge',
        bg,
        text,
        glow,
        level === 'S' && 'animate-pulse-urgent',
        className
      )}
    >
      {level}
    </span>
  );
}

// Bias indicator badges
interface BiasBadgeProps {
  bias: 'Left' | 'Center' | 'Right';
  className?: string;
}

export function BiasBadge({ bias, className }: BiasBadgeProps) {
  const config = {
    Left: {
      bg: 'bg-bias-left/20',
      text: 'text-bias-left',
      border: 'border-bias-left/30',
      icon: '←',
    },
    Center: {
      bg: 'bg-bias-center/20',
      text: 'text-bias-center',
      border: 'border-bias-center/30',
      icon: '○',
    },
    Right: {
      bg: 'bg-bias-right/20',
      text: 'text-bias-right',
      border: 'border-bias-right/30',
      icon: '→',
    },
  };

  const { bg, text, border, icon } = config[bias];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-headline text-xs tracking-wider',
        bg,
        text,
        border,
        className
      )}
    >
      <span>{icon}</span>
      <span>{bias.toUpperCase()}</span>
    </span>
  );
}

// Sentiment indicator
interface SentimentBadgeProps {
  sentiment: number; // -1 to 1
  className?: string;
}

export function SentimentBadge({ sentiment, className }: SentimentBadgeProps) {
  const getConfig = (value: number) => {
    if (value >= 0.3) {
      return {
        bg: 'bg-sentiment-positive/20',
        text: 'text-sentiment-positive',
        border: 'border-sentiment-positive/30',
        label: 'POSITIVE',
        icon: '↑',
      };
    }
    if (value <= -0.3) {
      return {
        bg: 'bg-sentiment-negative/20',
        text: 'text-sentiment-negative',
        border: 'border-sentiment-negative/30',
        label: 'NEGATIVE',
        icon: '↓',
      };
    }
    return {
      bg: 'bg-sentiment-neutral/20',
      text: 'text-sentiment-neutral',
      border: 'border-sentiment-neutral/30',
      label: 'NEUTRAL',
      icon: '→',
    };
  };

  const { bg, text, border, icon } = getConfig(sentiment);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-xs',
        bg,
        text,
        border,
        className
      )}
    >
      <span>{icon}</span>
      <span>{(sentiment * 100).toFixed(0)}%</span>
    </span>
  );
}

// Live badge with animation
export function LiveBadge({ className }: { className?: string }) {
  return (
    <span className={cn('live-badge', className)}>
      <span className="live-dot" />
      LIVE
    </span>
  );
}

// Breaking badge with urgent styling
export function BreakingBadge({ className }: { className?: string }) {
  return <span className={cn('breaking-badge', className)}>BREAKING</span>;
}
