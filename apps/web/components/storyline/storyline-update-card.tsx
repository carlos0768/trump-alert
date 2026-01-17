'use client';

import Link from 'next/link';
import { BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import type { StorylineUpdate } from '@/lib/api';

interface StorylineUpdateCardProps {
  update: StorylineUpdate;
}

export function StorylineUpdateCard({ update }: StorylineUpdateCardProps) {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  };

  const latestArticle = update.articles?.[0]?.article;

  return (
    <Link
      href={`/storylines/${update.id}`}
      className="block border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white p-4 transition-colors hover:from-primary-100"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100">
          <BookOpen className="size-5 text-primary-600" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-primary-600 px-2 py-0.5 text-xs font-medium text-white">
              <Sparkles className="size-3" />
              ストーリー更新
            </span>
            <span className="text-xs text-gray-500">
              {formatTimeAgo(update.lastEventAt)}
            </span>
          </div>

          <h3 className="mb-1 font-medium text-gray-900">
            {update.titleJa || update.title}
          </h3>

          {latestArticle && (
            <p className="text-sm text-gray-600">
              <span className="mr-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                {latestArticle.source}
              </span>
              <span className="line-clamp-1">
                {latestArticle.titleJa || latestArticle.title}
              </span>
            </p>
          )}
        </div>

        <ArrowRight className="size-5 flex-shrink-0 text-primary-400" />
      </div>
    </Link>
  );
}
