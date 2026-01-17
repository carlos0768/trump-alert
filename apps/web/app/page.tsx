'use client';

import { useState } from 'react';
import { Zap, RefreshCw, Loader2 } from 'lucide-react';
import { ArticleCard } from '@/components/article';
import { TrumpIndexChart, type TrumpIndexDataPoint } from '@/components/charts';
import {
  TrendingTopics,
  mockTrendingTopics,
  StockWidget,
  FilterBar,
} from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import {
  useArticles,
  useTrumpIndex,
  useStockData,
  useTrendingTopics,
} from '@/lib/hooks';
import { mockTrumpIndexData } from '@/lib/mock-data';
import type { ArticleFilters } from '@/lib/api';

export default function DashboardPage() {
  const [filters, setFilters] = useState<ArticleFilters>({});

  // Fetch real data from API with filters
  const {
    data: articlesData,
    isLoading: articlesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchArticles,
  } = useArticles(filters);

  const { data: trumpIndexData, isLoading: indexLoading } = useTrumpIndex();
  const { data: stockData, isLoading: stockLoading } = useStockData();
  const { data: trendingTopics, isLoading: topicsLoading } =
    useTrendingTopics();

  // Flatten paginated articles
  const articles = articlesData?.pages.flatMap((page) => page.articles) ?? [];

  // Calculate current Trump Index (use mock data as fallback)
  const indexData =
    trumpIndexData && trumpIndexData.length > 0
      ? trumpIndexData
      : mockTrumpIndexData;
  const getSentiment = (item: (typeof indexData)[number] | undefined) =>
    item?.sentiment ?? item?.avgSentiment ?? 0;
  const currentIndex = getSentiment(indexData[indexData.length - 1]);
  const previousIndex = getSentiment(indexData[indexData.length - 2]);
  const indexChange = currentIndex - previousIndex;

  // Stock data with fallback
  const stock = stockData ?? {
    symbol: 'DJT',
    price: 34.56,
    change: 2.34,
    changePercent: 7.26,
    volume: 12500000,
  };

  // Trending topics with fallback
  const topics =
    trendingTopics && trendingTopics.length > 0
      ? trendingTopics.map((t, i) => ({ ...t, rank: i + 1 }))
      : mockTrendingTopics;

  // Handle filter changes
  const handleFilterChange = (newFilters: {
    impactLevels: string[];
    biases: string[];
    timeRange: string;
  }) => {
    setFilters({
      impactLevels:
        newFilters.impactLevels.length > 0
          ? newFilters.impactLevels
          : undefined,
      biases: newFilters.biases.length > 0 ? newFilters.biases : undefined,
      timeRange: newFilters.timeRange,
    });
  };

  return (
    <div className="flex h-full">
      {/* Main Feed */}
      <div className="flex-1 overflow-y-auto border-r border-gray-200">
        {/* Feed Header */}
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">Live Feed</h1>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => refetchArticles()}
              >
                <RefreshCw className="size-4" />
              </Button>
              <Button size="sm" className="gap-1.5">
                <Zap className="size-3.5" />
                <span>Live</span>
              </Button>
            </div>

            {/* Filter Bar - Right aligned */}
            <div className="flex-1 flex justify-end">
              <FilterBar onFilterChange={handleFilterChange} />
            </div>
          </div>
        </div>

        {/* Articles Feed */}
        <div className="divide-y divide-gray-100">
          {articlesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-gray-400" />
            </div>
          ) : articles.length > 0 ? (
            articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))
          ) : (
            <div className="py-12 text-center text-gray-500">
              <p>まだ記事がありません</p>
              <p className="mt-2 text-sm">
                ニュースを収集するには、APIの /api/collect
                エンドポイントを呼び出してください
              </p>
            </div>
          )}
        </div>

        {/* Load More */}
        <div className="p-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fetchNextPage()}
            disabled={!hasNextPage || isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Loading...
              </>
            ) : hasNextPage ? (
              'Load More'
            ) : (
              'No more articles'
            )}
          </Button>
        </div>
      </div>

      {/* Right Sidebar */}
      <aside className="hidden w-80 flex-shrink-0 overflow-y-auto p-4 xl:block">
        <div className="space-y-4">
          {/* Trump Index Chart */}
          {indexLoading ? (
            <div className="flex h-48 items-center justify-center rounded-lg bg-white">
              <Loader2 className="size-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <TrumpIndexChart
              data={indexData}
              currentIndex={currentIndex}
              change={indexChange}
            />
          )}

          {/* DJT Stock Widget */}
          {stockLoading ? (
            <div className="flex h-24 items-center justify-center rounded-lg bg-white">
              <Loader2 className="size-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <StockWidget stock={stock} />
          )}

          {/* Trending Topics */}
          {topicsLoading ? (
            <div className="flex h-48 items-center justify-center rounded-lg bg-white">
              <Loader2 className="size-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <TrendingTopics topics={topics} />
          )}

          {/* Footer Links */}
          <div className="text-center text-xs text-gray-400">
            <p>Trump Alert &copy; 2024</p>
            <div className="mt-1 flex justify-center gap-3">
              <a href="#" className="hover:text-gray-600">
                Terms
              </a>
              <a href="#" className="hover:text-gray-600">
                Privacy
              </a>
              <a href="#" className="hover:text-gray-600">
                About
              </a>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
