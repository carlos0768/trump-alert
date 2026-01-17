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
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { ImpactBadge, BiasBadge, SentimentBadge } from '@/components/ui/badge';
import { cn, formatNumber, formatRelativeTime } from '@/lib/utils';

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
  // Prefer Japanese if available
  const displayTitle = article.titleJa || article.title;
  const displayContent = article.contentJa || article.content;

  return (
    <article className="border-b border-gray-100 bg-white px-4 py-4 transition-colors hover:bg-gray-50">
      <div className="flex gap-3">
        {/* Source Avatar */}
        <Avatar
          src={article.sourceIcon}
          alt={article.source}
          fallback={article.source.charAt(0)}
          size="md"
        />

        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-semibold text-gray-900">
                {article.source}
              </span>
              <span className="text-sm text-gray-500">
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
              className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="More options"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </div>

          {/* Title - Japanese preferred */}
          <Link href={`/article/${article.id}`} className="group mt-1 block">
            <h2 className="text-balance text-base font-medium leading-snug text-gray-900 group-hover:text-primary-600">
              {displayTitle}
            </h2>
          </Link>

          {/* Summary or Content Preview - Japanese preferred */}
          {article.summary && article.summary.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {article.summary.map((point, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-gray-600"
                >
                  <span className="mt-1.5 size-1.5 flex-shrink-0 rounded-full bg-primary-400" />
                  <span className="text-pretty">{point}</span>
                </li>
              ))}
            </ul>
          ) : displayContent ? (
            <p className="mt-2 text-pretty text-sm leading-relaxed text-gray-600 line-clamp-3">
              {displayContent}
            </p>
          ) : null}

          {/* Image */}
          {showImage && article.imageUrl && (
            <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
              <img
                src={article.imageUrl}
                alt=""
                className="aspect-video w-full object-cover"
              />
            </div>
          )}

          {/* External Link Preview */}
          <Link
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100"
          >
            <ExternalLink className="size-4 text-gray-400" />
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
        'flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm transition-colors hover:bg-primary-50 hover:text-primary-600',
        active ? 'text-primary-600' : 'text-gray-500'
      )}
    >
      <Icon className="size-4" />
      {count !== undefined && (
        <span className="tabular-nums">{formatNumber(count)}</span>
      )}
    </button>
  );
}
