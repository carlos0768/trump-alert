'use client';

import { useEffect, useRef } from 'react';
import { Radio } from 'lucide-react';
import { TrumpSpinner } from '@/components/ui';
import { ArticleCard } from '@/components/article';
import { TrumpIndexChart, type TrumpIndexDataPoint } from '@/components/charts';
import {
  TrendingTopics,
  mockTrendingTopics,
  StockWidget,
} from '@/components/dashboard';
import { ExecutiveOrderWidget } from '@/components/executive-order';
import { Button } from '@/components/ui/button';
import {
  useArticles,
  useTrumpIndex,
  useStockData,
  useTrendingTopics,
  useHeaderStore,
} from '@/lib/hooks';
import { mockTrumpIndexData } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { filters, setRefetchFn, setIsRefetching } = useHeaderStore();

  const {
    data: articlesData,
    isLoading: articlesLoading,
    isRefetching: articlesRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchArticles,
  } = useArticles(filters);

  // Sync refetch function and state with header store
  useEffect(() => {
    setRefetchFn(() => refetchArticles());
  }, [refetchArticles, setRefetchFn]);

  useEffect(() => {
    setIsRefetching(articlesRefetching);
  }, [articlesRefetching, setIsRefetching]);

  const { data: trumpIndexData, isLoading: indexLoading } = useTrumpIndex();
  const { data: stockData, isLoading: stockLoading } = useStockData();
  const { data: trendingTopics, isLoading: topicsLoading } =
    useTrendingTopics();

  const articles = articlesData?.pages.flatMap((page) => page.articles) ?? [];

  // Use API data if available, otherwise fallback to mock
  // API always returns 12 data points, check if any have actual article data
  const hasRealIndexData =
    trumpIndexData &&
    trumpIndexData.length > 0 &&
    trumpIndexData.some((d) => d.articleCount > 0);
  const indexData: TrumpIndexDataPoint[] = hasRealIndexData
    ? trumpIndexData
    : mockTrumpIndexData;
  const getSentiment = (item: TrumpIndexDataPoint | undefined) =>
    item?.sentiment ?? item?.avgSentiment ?? 0;
  const currentIndex = getSentiment(indexData[indexData.length - 1]);
  const previousIndex = getSentiment(indexData[indexData.length - 2]);
  const indexChange = currentIndex - previousIndex;

  // Stock data - no fallback, show nothing if unavailable
  const stock = stockData;

  const topics =
    trendingTopics && trendingTopics.length > 0
      ? trendingTopics.map((t, i) => ({ ...t, rank: i + 1 }))
      : mockTrendingTopics;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Main Feed */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto border-r border-border"
        >
          {/* Articles Feed */}
          <div className="divide-y divide-border">
            {articlesLoading ? (
              <div className="flex items-center justify-center py-16">
                <TrumpSpinner size="lg" />
              </div>
            ) : articles.length > 0 ? (
              articles.map((article, index) => (
                <div
                  key={article.id}
                  className={cn(
                    'animate-fade-in',
                    index < 5 && `stagger-${index + 1}`
                  )}
                >
                  <ArticleCard article={article} />
                </div>
              ))
            ) : (
              <EmptyState />
            )}
          </div>

          {/* Load More */}
          {articles.length > 0 && (
            <div className="p-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fetchNextPage()}
                disabled={!hasNextPage || isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <TrumpSpinner size="sm" className="mr-2" />
                    LOADING...
                  </>
                ) : hasNextPage ? (
                  'LOAD MORE'
                ) : (
                  'END OF FEED'
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <aside className="hidden w-80 flex-shrink-0 overflow-y-auto p-4 xl:block">
          <div className="space-y-4">
            {/* Trump Index Chart */}
            {indexLoading ? (
              <WidgetSkeleton height="h-64" />
            ) : (
              <TrumpIndexChart
                data={indexData}
                currentIndex={currentIndex}
                change={indexChange}
              />
            )}

            {/* DJT Stock Widget */}
            {stockLoading ? (
              <WidgetSkeleton height="h-32" />
            ) : stock ? (
              <StockWidget stock={stock} />
            ) : null}

            {/* Executive Orders Widget */}
            <ExecutiveOrderWidget />

            {/* Trending Topics */}
            {topicsLoading ? (
              <WidgetSkeleton height="h-48" />
            ) : (
              <TrendingTopics topics={topics} />
            )}

            {/* Footer Links */}
            <div className="text-center">
              <p className="font-headline text-xs tracking-wider text-muted-foreground">
                TRUMP TRACKER © 2024
              </p>
              <div className="mt-2 flex justify-center gap-4">
                <a
                  href="#"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms
                </a>
                <a
                  href="#"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy
                </a>
                <a
                  href="#"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  About
                </a>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-4">
        <Radio className="size-16 text-muted-foreground/30" />
        <div className="absolute inset-0 animate-ping">
          <Radio className="size-16 text-primary-500/20" />
        </div>
      </div>
      <h3 className="font-headline text-xl tracking-wider text-foreground mb-2">
        NO NEWS YET
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        We're monitoring all sources. Breaking news will appear here as soon as
        it's detected.
      </p>
    </div>
  );
}

// Widget Skeleton Component
function WidgetSkeleton({ height }: { height: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg bg-card border border-border',
        height
      )}
    >
      <TrumpSpinner size="md" />
    </div>
  );
}
