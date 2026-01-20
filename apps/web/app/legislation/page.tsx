'use client';

import { useState } from 'react';
import { FileSignature, Loader2, RefreshCw } from 'lucide-react';
import { useExecutiveOrders } from '@/lib/hooks';
import { ExecutiveOrderCard } from '@/components/executive-order';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const typeFilters = [
  { value: undefined, label: 'すべて' },
  { value: 'executive_order', label: '大統領令' },
  { value: 'proclamation', label: '大統領布告' },
  { value: 'memorandum', label: '大統領覚書' },
];

export default function LegislationPage() {
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const { data, isLoading, refetch, isRefetching } = useExecutiveOrders(
    typeFilter,
    limit,
    offset
  );

  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const hasMore = data?.hasMore ?? false;

  const handlePrevPage = () => {
    setOffset(Math.max(0, offset - limit));
  };

  const handleNextPage = () => {
    if (hasMore) {
      setOffset(offset + limit);
    }
  };

  const handleFilterChange = (value: string | undefined) => {
    setTypeFilter(value);
    setOffset(0); // Reset to first page
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-surface-elevated px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary-600/20">
              <FileSignature className="size-5 text-primary-400" />
            </div>
            <div>
              <h1 className="font-headline text-xl font-bold uppercase tracking-wide text-foreground">
                大統領令・法令
              </h1>
              <p className="text-sm text-muted-foreground">
                Federal Registerより取得した公式文書
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{total}件の文書</span>
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
        </div>

        {/* Type filters */}
        <div className="mt-4 flex gap-2">
          {typeFilters.map((filter) => (
            <button
              key={filter.value || 'all'}
              onClick={() => handleFilterChange(filter.value)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                typeFilter === filter.value
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
        ) : orders.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {orders.map((order) => (
                <ExecutiveOrderCard key={order.id} order={order} />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevPage}
                disabled={offset === 0}
              >
                前のページ
              </Button>
              <span className="text-sm text-muted-foreground">
                {offset + 1} - {Math.min(offset + limit, total)} / {total}件
              </span>
              <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={!hasMore}
              >
                次のページ
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileSignature className="mb-4 size-12 text-muted-foreground/30" />
            <h3 className="mb-2 font-headline text-lg font-medium text-foreground">
              文書がありません
            </h3>
            <p className="text-sm text-muted-foreground">
              Federal Registerからデータを収集すると、ここに表示されます。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
