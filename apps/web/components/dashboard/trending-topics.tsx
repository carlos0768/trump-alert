'use client';

import { TrendingUp, TrendingDown, Minus, Hash, Flame } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TrendingTopic {
  id?: string;
  rank?: number;
  name: string;
  articleCount?: number;
  count?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface TrendingTopicsProps {
  topics: TrendingTopic[];
}

export function TrendingTopics({ topics }: TrendingTopicsProps) {
  return (
    <Card variant="elevated">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className="size-4 text-impact-a" />
          TRENDING NOW
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {topics.map((topic, index) => {
            const rank = topic.rank ?? index + 1;
            const count = topic.articleCount ?? topic.count ?? 0;
            const TrendIcon = topic.trend === 'up' 
              ? TrendingUp 
              : topic.trend === 'down' 
                ? TrendingDown 
                : Minus;
            
            return (
              <button
                key={topic.id ?? topic.rank ?? index}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2.5 transition-all',
                  'hover:bg-surface-overlay',
                  rank === 1 && 'bg-primary-500/10 hover:bg-primary-500/20'
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex size-6 items-center justify-center rounded font-headline text-sm',
                      rank === 1
                        ? 'bg-primary-500 text-white'
                        : rank <= 3
                          ? 'bg-surface-overlay text-foreground'
                          : 'text-muted-foreground'
                    )}
                  >
                    {rank}
                  </span>
                  <div className="flex items-center gap-1">
                    <Hash className="size-3 text-muted-foreground" />
                    <span className="font-headline text-sm tracking-wider text-foreground">
                      {topic.name.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">
                    {count}
                  </span>
                  {topic.trend && (
                    <TrendIcon
                      className={cn(
                        'size-3',
                        topic.trend === 'up' && 'text-sentiment-positive',
                        topic.trend === 'down' && 'text-sentiment-negative',
                        topic.trend === 'stable' && 'text-muted-foreground'
                      )}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export const mockTrendingTopics: TrendingTopic[] = [
  { id: '1', name: 'Tariff', articleCount: 128, trend: 'up' },
  { id: '2', name: 'Election2024', articleCount: 95, trend: 'up' },
  { id: '3', name: 'TrumpTrial', articleCount: 82, trend: 'stable' },
  { id: '4', name: 'Immigration', articleCount: 67, trend: 'down' },
  { id: '5', name: 'Economy', articleCount: 54, trend: 'up' },
];
