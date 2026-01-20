'use client';

import Link from 'next/link';
import {
  MessageCircle,
  Repeat2,
  Heart,
  Bookmark,
  Share,
  MoreHorizontal,
  ExternalLink,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { ImpactBadge, BiasBadge, SentimentBadge, BreakingBadge } from '@/components/ui/badge';
import { cn, formatNumber, formatRelativeTime } from '@/lib/utils';
import { getSourceIcon } from '@/lib/sources';

export interface Article {
  id: string;
  title: string;
  titleJa?: string;
  url: string;
  source: string;
  sourceIcon?: string;
  content: string;
  contentJa?: string;
  publishedAt: Date | string;
  imageUrl?: string;
  summary: string[];
  sentiment: number | null;
  bias: 'Left' | 'Center' | 'Right' | null;
  impactLevel: 'S' | 'A' | 'B' | 'C';
  stats?: {
    comments: number;
    reposts: number;
    likes: number;
  };
}

interface ArticleCardProps {
  article: Article;
  showImage?: boolean;
}

export function ArticleCard({ article, showImage = true }: ArticleCardProps) {
  const displayTitle = article.titleJa || article.title;
  const displayContent = article.contentJa || article.content;
  const iconSrc = article.sourceIcon || getSourceIcon(article.source);
  const isUrgent = article.impactLevel === 'S';
  const isBreaking = isUrgent && isWithinHours(article.publishedAt, 2);

  return (
    <article
      className={cn(
        'relative border-b border-border bg-card px-4 py-4 transition-all duration-300',
        'hover:bg-surface-elevated',
        isUrgent && 'border-l-2 border-l-urgent bg-urgent/5 hover:bg-urgent/10'
      )}
    >
      {/* Breaking indicator for urgent news */}
      {isBreaking && (
        <div className="absolute -left-px top-0 bottom-0 w-1 bg-urgent animate-pulse-urgent" />
      )}

      <div className="flex gap-3">
        {/* Source Avatar */}
        <div className="relative">
          <Avatar
            src={iconSrc}
            alt={article.source}
            fallback={article.source.charAt(0)}
            size="md"
            ring={isUrgent}
          />
          {isUrgent && (
            <div className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-urgent">
              <AlertTriangle className="size-2.5 text-white" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {/* Breaking badge */}
              {isBreaking && <BreakingBadge className="mr-1" />}
              
              <span className="font-headline text-sm tracking-wider text-foreground">
                {article.source.toUpperCase()}
              </span>
              
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="size-3" />
                {formatRelativeTime(article.publishedAt)}
              </span>
              
              {/* Badges */}
              <div className="flex items-center gap-1.5">
                <ImpactBadge level={article.impactLevel} />
                {article.bias && <BiasBadge bias={article.bias} />}
                {article.sentiment !== null && (
                  <SentimentBadge sentiment={article.sentiment} />
                )}
              </div>
            </div>
            
            <button
              className="rounded-full p-1.5 text-muted-foreground hover:bg-surface-overlay hover:text-foreground transition-colors"
              aria-label="More options"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </div>

          {/* Title */}
          <Link href={`/article/${article.id}`} className="group mt-2 block">
            <h2
              className={cn(
                'text-balance text-base font-medium leading-snug text-foreground',
                'group-hover:text-primary-400 transition-colors',
                isUrgent && 'font-headline text-lg tracking-wide'
              )}
            >
              {displayTitle}
            </h2>
          </Link>

          {/* Summary */}
          {article.summary && article.summary.length > 0 ? (
            <ul className="mt-3 space-y-1.5">
              {article.summary.map((point, idx) => (
                <li
                  key={idx}
                  className={cn(
                    'flex items-start gap-2 text-sm text-muted-foreground',
                    'animate-fade-in',
                    `stagger-${idx + 1}`
                  )}
                >
                  <span
                    className={cn(
                      'mt-1.5 size-1.5 flex-shrink-0 rounded-full',
                      isUrgent ? 'bg-urgent' : 'bg-primary-500'
                    )}
                  />
                  <span className="text-pretty">{point}</span>
                </li>
              ))}
            </ul>
          ) : displayContent ? (
            <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground line-clamp-3">
              {displayContent}
            </p>
          ) : null}

          {/* Image */}
          {showImage && article.imageUrl && (
            <div className="mt-3 overflow-hidden rounded-lg border border-border">
              <img
                src={article.imageUrl}
                alt=""
                className="aspect-video w-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          )}

          {/* External Link Preview */}
          <Link
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-muted-foreground transition-all hover:border-primary-500/50 hover:text-foreground"
          >
            <ExternalLink className="size-4 text-primary-500" />
            <span className="truncate">{new URL(article.url).hostname}</span>
          </Link>

          {/* Actions */}
          <div className="mt-3 flex items-center justify-between max-w-md">
            <ActionButton
              icon={MessageCircle}
              count={article.stats?.comments ?? 0}
            />
            <ActionButton icon={Repeat2} count={article.stats?.reposts ?? 0} />
            <ActionButton icon={Heart} count={article.stats?.likes ?? 0} />
            <ActionButton icon={Bookmark} />
            <ActionButton icon={Share} />
          </div>
        </div>
      </div>
    </article>
  );
}

interface ActionButtonProps {
  icon: React.ElementType;
  count?: number;
  active?: boolean;
}

function ActionButton({ icon: Icon, count, active }: ActionButtonProps) {
  return (
    <button
      className={cn(
        'flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm transition-all',
        'hover:bg-primary-500/10 hover:text-primary-400',
        active ? 'text-primary-500' : 'text-muted-foreground'
      )}
    >
      <Icon className="size-4" />
      {count !== undefined && (
        <span className="font-mono text-xs tabular-nums">{formatNumber(count)}</span>
      )}
    </button>
  );
}

// Helper function to check if date is within X hours
function isWithinHours(date: Date | string, hours: number): boolean {
  const articleDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - articleDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours <= hours;
}
