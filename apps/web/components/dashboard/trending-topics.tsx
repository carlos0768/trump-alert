'use client';

import { TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface TrendingTopic {
  id: string;
  name: string;
  articleCount: number;
  trend: 'up' | 'down' | 'stable';
}

interface TrendingTopicsProps {
  topics: TrendingTopic[];
}

export function TrendingTopics({ topics }: TrendingTopicsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-medium text-gray-700">
          <TrendingUp className="size-4 text-primary-500" />
          Trending Topics
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {topics.map((topic, index) => (
            <div
              key={topic.id}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-400">
                  {index + 1}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  #{topic.name}
                </span>
              </div>
              <span className="text-xs text-gray-500 tabular-nums">
                {topic.articleCount} articles
              </span>
            </div>
          ))}
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
