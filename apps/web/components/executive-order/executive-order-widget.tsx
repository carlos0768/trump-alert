'use client';

import Link from 'next/link';
import { FileSignature, ArrowRight, Loader2 } from 'lucide-react';
import { useRecentExecutiveOrders } from '@/lib/hooks';
import { cn } from '@/lib/utils';

const typeColors = {
  executive_order: 'bg-blue-100 text-blue-700',
  proclamation: 'bg-purple-100 text-purple-700',
  memorandum: 'bg-green-100 text-green-700',
  other: 'bg-gray-100 text-gray-700',
};

export function ExecutiveOrderWidget() {
  const { data: orders, isLoading } = useRecentExecutiveOrders(3);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSignature className="size-4 text-blue-600" />
          <h3 className="text-sm font-bold text-gray-900">大統領令</h3>
        </div>
        <Link
          href="/legislation"
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          <span>すべて見る</span>
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="size-5 animate-spin text-gray-400" />
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="space-y-2">
          {orders.map((order) => (
            <a
              key={order.id}
              href={order.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-gray-100 p-2.5 transition-colors hover:bg-gray-50"
            >
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 text-[10px] font-medium',
                    typeColors[order.type] || typeColors.other
                  )}
                >
                  {order.executiveOrderNumber
                    ? `EO ${order.executiveOrderNumber}`
                    : order.type === 'proclamation'
                      ? '布告'
                      : order.type === 'memorandum'
                        ? '覚書'
                        : '令'}
                </span>
                <span className="text-[10px] text-gray-500">
                  {formatDate(order.signingDate)}
                </span>
              </div>
              <p className="line-clamp-2 text-xs font-medium text-gray-900">
                {order.titleJa || order.title}
              </p>
              {order.summaryJa && (
                <p className="mt-1 line-clamp-1 text-[10px] text-gray-500">
                  {order.summaryJa}
                </p>
              )}
            </a>
          ))}
        </div>
      ) : (
        <div className="py-4 text-center text-xs text-gray-500">
          <p>データがありません</p>
        </div>
      )}
    </div>
  );
}
