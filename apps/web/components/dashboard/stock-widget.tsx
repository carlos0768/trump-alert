'use client';

import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium text-gray-700">
            {stock.symbol} Stock
          </CardTitle>
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            NASDAQ
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold tabular-nums text-gray-900">
            ${stock.price.toFixed(2)}
          </span>
          <div
            className={cn(
              'flex items-center gap-0.5 text-sm font-medium',
              isPositive ? 'text-green-600' : 'text-red-600'
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="size-4" />
            ) : (
              <ArrowDownRight className="size-4" />
            )}
            <span className="tabular-nums">
              {isPositive ? '+' : ''}
              {stock.change.toFixed(2)} ({isPositive ? '+' : ''}
              {stock.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Volume:{' '}
          <span className="tabular-nums">
            {typeof stock.volume === 'number'
              ? stock.volume.toLocaleString()
              : stock.volume}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}

export const mockStockData: StockData = {
  symbol: 'DJT',
  price: 34.56,
  change: 2.34,
  changePercent: 7.26,
  volume: '12.5M',
};
