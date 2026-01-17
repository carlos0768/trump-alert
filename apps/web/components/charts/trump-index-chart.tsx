'use client';

import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TrumpIndexDataPoint {
  time?: string;
  hour?: string;
  sentiment?: number;
  avgSentiment?: number;
  articleCount: number;
}

interface TrumpIndexChartProps {
  data: TrumpIndexDataPoint[];
  currentIndex: number;
  change: number;
}

// Helper to normalize data from different sources (API uses hour/avgSentiment, mock uses time/sentiment)
function normalizeData(data: TrumpIndexDataPoint[]) {
  return data.map((item) => ({
    time: item.time ?? item.hour ?? '',
    sentiment: item.sentiment ?? item.avgSentiment ?? 0,
    articleCount: item.articleCount,
  }));
}

export function TrumpIndexChart({
  data,
  currentIndex,
  change,
}: TrumpIndexChartProps) {
  const normalizedData = normalizeData(data);
  const isPositive = change > 0;
  const isNeutral = change === 0;

  const TrendIcon = isPositive ? TrendingUp : isNeutral ? Minus : TrendingDown;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium text-gray-700">
            Trump Index
          </CardTitle>
          <span className="text-xs text-gray-500">Today</span>
        </div>
        <div className="flex items-baseline gap-3">
          <span
            className={cn(
              'text-3xl font-bold tabular-nums',
              isPositive
                ? 'text-green-600'
                : isNeutral
                  ? 'text-gray-600'
                  : 'text-red-600'
            )}
          >
            {currentIndex > 0 ? '+' : ''}
            {currentIndex.toFixed(2)}
          </span>
          <div
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              isPositive
                ? 'bg-green-100 text-green-700'
                : isNeutral
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-red-100 text-red-700'
            )}
          >
            <TrendIcon className="size-3" />
            <span className="tabular-nums">
              {isPositive ? '+' : ''}
              {change.toFixed(2)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={normalizedData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="positiveGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient
                  id="negativeGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[-1, 1]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickFormatter={(value) => value.toFixed(1)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as TrumpIndexDataPoint;
                    return (
                      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                        <p className="text-xs text-gray-500">{data.time}</p>
                        <p
                          className={cn(
                            'text-lg font-semibold tabular-nums',
                            data.sentiment > 0
                              ? 'text-green-600'
                              : data.sentiment < 0
                                ? 'text-red-600'
                                : 'text-gray-600'
                          )}
                        >
                          {data.sentiment > 0 ? '+' : ''}
                          {data.sentiment.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {data.articleCount} articles
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={0} stroke="#d1d5db" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="sentiment"
                stroke="none"
                fill="url(#positiveGradient)"
                fillOpacity={1}
                baseLine={0}
              />
              <Line
                type="monotone"
                dataKey="sentiment"
                stroke={currentIndex >= 0 ? '#22c55e' : '#ef4444'}
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: currentIndex >= 0 ? '#22c55e' : '#ef4444',
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Generate mock data for demo
export function generateMockTrumpIndexData(): TrumpIndexDataPoint[] {
  const hours = [
    '00:00',
    '02:00',
    '04:00',
    '06:00',
    '08:00',
    '10:00',
    '12:00',
    '14:00',
    '16:00',
    '18:00',
    '20:00',
    '22:00',
  ];

  return hours.map((time) => ({
    time,
    sentiment: Math.random() * 2 - 1, // -1 to 1
    articleCount: Math.floor(Math.random() * 50) + 10,
  }));
}
