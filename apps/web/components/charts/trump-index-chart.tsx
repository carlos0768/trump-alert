'use client';

import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
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

interface NormalizedDataPoint {
  time: string;
  sentiment: number;
  articleCount: number;
}

function normalizeData(data: TrumpIndexDataPoint[]): NormalizedDataPoint[] {
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
    <Card variant="elevated">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="size-4 text-primary-500" />
            TRUMP INDEX
          </CardTitle>
          <span className="font-mono text-xs text-muted-foreground">TODAY</span>
        </div>
        <div className="flex items-baseline gap-3 mt-2">
          <span
            className={cn(
              'font-mono text-4xl font-bold tabular-nums',
              isPositive
                ? 'text-sentiment-positive'
                : isNeutral
                  ? 'text-muted-foreground'
                  : 'text-sentiment-negative'
            )}
          >
            {currentIndex > 0 ? '+' : ''}
            {currentIndex.toFixed(2)}
          </span>
          <div
            className={cn(
              'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold',
              isPositive
                ? 'bg-sentiment-positive/20 text-sentiment-positive'
                : isNeutral
                  ? 'bg-muted/20 text-muted-foreground'
                  : 'bg-sentiment-negative/20 text-sentiment-negative'
            )}
          >
            <TrendIcon className="size-3" />
            <span className="font-mono tabular-nums">
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
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient
                  id="negativeGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#64748B' }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[-1, 1]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#64748B' }}
                tickFormatter={(value) => value.toFixed(1)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as NormalizedDataPoint;
                    return (
                      <div className="rounded-lg border border-border bg-surface-elevated p-3 shadow-xl">
                        <p className="font-mono text-xs text-muted-foreground">
                          {data.time}
                        </p>
                        <p
                          className={cn(
                            'font-mono text-xl font-bold tabular-nums',
                            data.sentiment > 0
                              ? 'text-sentiment-positive'
                              : data.sentiment < 0
                                ? 'text-sentiment-negative'
                                : 'text-muted-foreground'
                          )}
                        >
                          {data.sentiment > 0 ? '+' : ''}
                          {data.sentiment.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {data.articleCount} articles
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={0} stroke="#334155" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="sentiment"
                stroke="none"
                fill={
                  currentIndex >= 0
                    ? 'url(#positiveGradient)'
                    : 'url(#negativeGradient)'
                }
                fillOpacity={1}
                baseLine={0}
              />
              <Line
                type="monotone"
                dataKey="sentiment"
                stroke={currentIndex >= 0 ? '#10B981' : '#EF4444'}
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 6,
                  fill: currentIndex >= 0 ? '#10B981' : '#EF4444',
                  stroke: '#0F172A',
                  strokeWidth: 2,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Sentiment bar indicator */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>NEGATIVE</span>
            <span>NEUTRAL</span>
            <span>POSITIVE</span>
          </div>
          <div className="sentiment-bar h-2 rounded-full" />
          <div className="relative h-0">
            <div
              className="absolute -top-4 size-3 rounded-full bg-foreground border-2 border-surface transition-all"
              style={{
                left: `${((currentIndex + 1) / 2) * 100}%`,
                transform: 'translateX(-50%)',
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
