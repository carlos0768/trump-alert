'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Loader2,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { useStorylineTimeline } from '@/lib/hooks';
import { StorylineTimeline } from '@/components/storyline';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const categoryLabels: Record<string, string> = {
  tariff: '関税・貿易',
  legal: '法的問題',
  election: '選挙',
  foreign_policy: '外交政策',
  domestic_policy: '国内政策',
  personnel: '人事',
  media: 'メディア',
  other: 'その他',
};

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

export default function StorylineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, isLoading, refetch, isRefetching } = useStorylineTimeline(id);

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return `${startDate.toLocaleDateString('ja-JP', options)} 〜 ${endDate.toLocaleDateString('ja-JP', options)}`;
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <BookOpen className="mb-4 size-12 text-gray-300" />
        <h2 className="mb-2 text-lg font-medium text-gray-900">
          ストーリーラインが見つかりません
        </h2>
        <Button variant="outline" onClick={() => router.push('/storylines')}>
          一覧に戻る
        </Button>
      </div>
    );
  }

  const { storyline, timeline } = data;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mb-4 flex items-center gap-4">
          <Link
            href="/storylines"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="size-4" />
            <span>一覧に戻る</span>
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw
              className={cn('size-4', isRefetching && 'animate-spin')}
            />
          </Button>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              {storyline.category && (
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium',
                    categoryColors[storyline.category] || categoryColors.other
                  )}
                >
                  {categoryLabels[storyline.category] || storyline.category}
                </span>
              )}
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  storyline.status === 'ongoing'
                    ? 'bg-green-100 text-green-700'
                    : storyline.status === 'developing'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-600'
                )}
              >
                {storyline.status === 'ongoing'
                  ? '進行中'
                  : storyline.status === 'developing'
                    ? '展開中'
                    : '完結'}
              </span>
            </div>

            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              {storyline.titleJa || storyline.title}
            </h1>

            <p className="mb-4 text-gray-600">
              {storyline.descriptionJa || storyline.description}
            </p>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <BookOpen className="size-4" />
                <span>{timeline.length}件のイベント</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="size-4" />
                <span>
                  {formatDateRange(
                    storyline.firstEventAt,
                    storyline.lastEventAt
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Current summary */}
        {storyline.summaryJa && (
          <div className="mt-4 rounded-lg bg-gray-50 p-4">
            <div className="mb-2 flex items-center gap-1 text-sm font-medium text-gray-700">
              <TrendingUp className="size-4" />
              <span>現在の状況</span>
            </div>
            <p className="text-gray-600">{storyline.summaryJa}</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-6">
        <h2 className="mb-6 text-lg font-bold text-gray-900">タイムライン</h2>
        <StorylineTimeline events={timeline} />
      </div>
    </div>
  );
}
