'use client';

import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  BarChart3,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number | string;
}

interface StockWidgetProps {
  stock: StockData;
}

export function StockWidget({ stock }: StockWidgetProps) {
  const isPositive = stock.change >= 0;

  return (
    <Card variant="elevated">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="size-4 text-accent" />
            {stock.symbol}
          </CardTitle>
          <span className="rounded bg-accent/20 px-2 py-0.5 font-mono text-xs text-accent">
            NASDAQ
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-3xl font-bold tabular-nums text-foreground">
            ${stock.price.toFixed(2)}
          </span>
          <div
            className={cn(
              'flex items-center gap-0.5 rounded-md px-2 py-1 text-sm font-bold',
              isPositive
                ? 'bg-sentiment-positive/20 text-sentiment-positive'
                : 'bg-sentiment-negative/20 text-sentiment-negative'
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="size-4" />
            ) : (
              <ArrowDownRight className="size-4" />
            )}
            <span className="font-mono tabular-nums">
              {isPositive ? '+' : ''}
              {stock.change.toFixed(2)}
            </span>
            <span className="font-mono tabular-nums text-xs opacity-75">
              ({isPositive ? '+' : ''}
              {stock.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Volume bar */}
        <div className="mt-4 flex items-center gap-2">
          <BarChart3 className="size-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Volume:</span>
          <span className="font-mono text-xs text-foreground tabular-nums">
            {typeof stock.volume === 'number'
              ? stock.volume.toLocaleString()
              : stock.volume}
          </span>
        </div>

        {/* Mini trend indicator */}
        <div className="mt-3 flex h-8 items-end gap-0.5">
          {Array.from({ length: 12 }).map((_, i) => {
            const height = 20 + Math.random() * 80;
            const isLast = i === 11;
            return (
              <div
                key={i}
                className={cn(
                  'flex-1 rounded-t transition-all',
                  isLast
                    ? isPositive
                      ? 'bg-sentiment-positive'
                      : 'bg-sentiment-negative'
                    : 'bg-surface-overlay'
                )}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
