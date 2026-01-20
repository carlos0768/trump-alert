'use client';

import Link from 'next/link';
import { FileSignature, ArrowRight, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useRecentExecutiveOrders } from '@/lib/hooks';
import { cn } from '@/lib/utils';

const typeColors = {
  executive_order: 'bg-accent/20 text-accent border-accent/30',
  proclamation: 'bg-primary-500/20 text-primary-400 border-primary-500/30',
  memorandum:
    'bg-sentiment-positive/20 text-sentiment-positive border-sentiment-positive/30',
  other: 'bg-surface-overlay text-muted-foreground border-border',
};

export function ExecutiveOrderWidget() {
  const { data: orders, isLoading } = useRecentExecutiveOrders(3);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card variant="elevated">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSignature className="size-4 text-accent" />
            EXECUTIVE ORDERS
          </CardTitle>
          <Link
            href="/legislation"
            className="flex items-center gap-1 font-headline text-xs tracking-wider text-accent hover:text-accent/80 transition-colors"
          >
            <span>VIEW ALL</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-2">
            {orders.map((order, index) => (
              <a
                key={order.id}
                href={order.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'group block rounded-lg border border-border p-3 transition-all',
                  'hover:border-accent/50 hover:bg-surface-overlay',
                  'animate-fade-in',
                  `stagger-${index + 1}`
                )}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded border px-1.5 py-0.5 font-headline text-[10px] tracking-wider',
                      typeColors[order.type] || typeColors.other
                    )}
                  >
                    {order.executiveOrderNumber
                      ? `EO ${order.executiveOrderNumber}`
                      : order.type === 'proclamation'
                        ? 'PROC'
                        : order.type === 'memorandum'
                          ? 'MEMO'
                          : 'ORDER'}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {formatDate(order.signingDate)}
                  </span>
                  <ExternalLink className="ml-auto size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <p className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                  {order.titleJa || order.title}
                </p>
                {order.summaryJa && (
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                    {order.summaryJa}
                  </p>
                )}
              </a>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center">
            <FileSignature className="mx-auto size-8 text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground">No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
