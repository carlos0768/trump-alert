'use client';

import { useState } from 'react';
import { BookOpen, Loader2, RefreshCw } from 'lucide-react';
import { useStorylines } from '@/lib/hooks';
import { StorylineCard } from '@/components/storyline';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const statusFilters = [
  { value: undefined, label: 'すべて' },
  { value: 'ongoing', label: '進行中' },
  { value: 'developing', label: '展開中' },
  { value: 'resolved', label: '完結' },
];

export default function StorylinesPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );
  const {
    data: storylines,
    isLoading,
    refetch,
    isRefetching,
  } = useStorylines(statusFilter);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary-100">
              <BookOpen className="size-5 text-primary-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Storylines</h1>
              <p className="text-sm text-gray-500">
                関連するニュースを時系列で追跡
              </p>
            </div>
          </div>
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

        {/* Status filters */}
        <div className="mt-4 flex gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value || 'all'}
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                statusFilter === filter.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-gray-400" />
          </div>
        ) : storylines && storylines.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {storylines.map((storyline) => (
              <StorylineCard key={storyline.id} storyline={storyline} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="mb-4 size-12 text-gray-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              ストーリーラインがありません
            </h3>
            <p className="text-sm text-gray-500">
              ニュースが収集されると、AIが関連記事を自動でグループ化します。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
