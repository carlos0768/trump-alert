'use client';

import Link from 'next/link';
import { BookOpen, Clock, ArrowRight, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Storyline } from '@/lib/api';

interface StorylineCardProps {
  storyline: Storyline;
  compact?: boolean;
}

const categoryColors: Record<string, string> = {
  tariff: 'bg-orange-100 text-orange-700',
  legal: 'bg-purple-100 text-purple-700',
  election: 'bg-blue-100 text-blue-700',
  foreign_policy: 'bg-green-100 text-green-700',
  domestic_policy: 'bg-cyan-100 text-cyan-700',
  personnel: 'bg-yellow-100 text-yellow-700',
  media: 'bg-pink-100 text-pink-700',
  other: 'bg-gray-100 text-gray-700',
};

const statusColors: Record<string, string> = {
  ongoing: 'bg-green-500',
  developing: 'bg-yellow-500',
  resolved: 'bg-gray-400',
};

export function StorylineCard({
  storyline,
  compact = false,
}: StorylineCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return '1時間以内';
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    return formatDate(dateString);
  };

  if (compact) {
    return (
      <Link
        href={`/storylines/${storyline.id}`}
        className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50"
      >
        <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100">
          <BookOpen className="size-5 text-primary-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">
            {storyline.titleJa || storyline.title}
          </p>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
            <span>{storyline.eventCount}件のイベント</span>
            <span>•</span>
            <span>{formatTimeAgo(storyline.lastEventAt)}</span>
          </div>
        </div>
        <ArrowRight className="size-4 flex-shrink-0 text-gray-400" />
      </Link>
    );
  }

  return (
    <Link
      href={`/storylines/${storyline.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-primary-300 hover:shadow-md"
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'size-2 rounded-full',
              statusColors[storyline.status] || statusColors.ongoing
            )}
          />
          <span className="text-xs font-medium capitalize text-gray-500">
            {storyline.status === 'ongoing'
              ? '進行中'
              : storyline.status === 'developing'
                ? '展開中'
                : '完結'}
          </span>
        </div>
        {storyline.category && (
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              categoryColors[storyline.category] || categoryColors.other
            )}
          >
            {storyline.category}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="mb-2 text-lg font-bold text-gray-900">
        {storyline.titleJa || storyline.title}
      </h3>

      {/* Description */}
      <p className="mb-4 line-clamp-2 text-sm text-gray-600">
        {storyline.descriptionJa || storyline.description}
      </p>

      {/* Summary (if available) */}
      {storyline.summaryJa && (
        <div className="mb-4 rounded-lg bg-gray-50 p-3">
          <div className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-500">
            <TrendingUp className="size-3" />
            <span>現在の状況</span>
          </div>
          <p className="line-clamp-2 text-sm text-gray-700">
            {storyline.summaryJa}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <BookOpen className="size-3.5" />
            <span>{storyline.eventCount}件</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="size-3.5" />
            <span>{formatDate(storyline.firstEventAt)} 〜</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-primary-600">
          <span>詳細を見る</span>
          <ArrowRight className="size-3.5" />
        </div>
      </div>

      {/* Recent articles preview */}
      {storyline.articles && storyline.articles.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-3">
          <p className="mb-2 text-xs font-medium text-gray-500">最近の動き</p>
          <div className="space-y-2">
            {storyline.articles.slice(0, 2).map((sa) => (
              <div
                key={sa.articleId}
                className="flex items-center gap-2 text-xs"
              >
                <span className="flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">
                  {sa.article.source}
                </span>
                <span className="truncate text-gray-700">
                  {sa.article.titleJa || sa.article.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Link>
  );
}
