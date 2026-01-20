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
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-surface-elevated px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary-600/20">
              <BookOpen className="size-5 text-primary-400" />
            </div>
            <div>
              <h1 className="font-headline text-xl font-bold uppercase tracking-wide text-foreground">
                STORYLINES
              </h1>
              <p className="text-sm text-muted-foreground">
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
                  : 'bg-surface-muted text-muted-foreground hover:bg-surface-elevated hover:text-foreground'
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
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : storylines && storylines.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {storylines.map((storyline) => (
              <StorylineCard key={storyline.id} storyline={storyline} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="mb-4 size-12 text-muted-foreground/30" />
            <h3 className="mb-2 font-headline text-lg font-medium text-foreground">
              ストーリーラインがありません
            </h3>
            <p className="text-sm text-muted-foreground">
              ニュースが収集されると、AIが関連記事を自動でグループ化します。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
