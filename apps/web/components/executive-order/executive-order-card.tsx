'use client';

import { ExternalLink, FileText, Scroll, FileSignature } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExecutiveOrder } from '@/lib/api';

interface ExecutiveOrderCardProps {
  order: ExecutiveOrder;
  compact?: boolean;
}

const typeConfig = {
  executive_order: {
    label: '大統領令',
    labelEn: 'Executive Order',
    icon: FileSignature,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    accentColor: 'border-l-blue-500',
  },
  proclamation: {
    label: '大統領布告',
    labelEn: 'Proclamation',
    icon: Scroll,
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    accentColor: 'border-l-purple-500',
  },
  memorandum: {
    label: '大統領覚書',
    labelEn: 'Memorandum',
    icon: FileText,
    color: 'bg-green-100 text-green-700 border-green-200',
    accentColor: 'border-l-green-500',
  },
  other: {
    label: 'その他',
    labelEn: 'Other',
    icon: FileText,
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    accentColor: 'border-l-gray-500',
  },
};

export function ExecutiveOrderCard({
  order,
  compact = false,
}: ExecutiveOrderCardProps) {
  const config = typeConfig[order.type] || typeConfig.other;
  const Icon = config.icon;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (compact) {
    return (
      <a
        href={order.htmlUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50',
          'border-l-4',
          config.accentColor
        )}
      >
        <div
          className={cn(
            'flex size-8 flex-shrink-0 items-center justify-center rounded-lg',
            config.color
          )}
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-xs font-medium',
                config.color
              )}
            >
              {order.executiveOrderNumber
                ? `EO ${order.executiveOrderNumber}`
                : config.label}
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(order.signingDate)}
            </span>
          </div>
          <p className="line-clamp-2 text-sm font-medium text-gray-900">
            {order.titleJa || order.title}
          </p>
        </div>
        <ExternalLink className="size-4 flex-shrink-0 text-gray-400" />
      </a>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md',
        'border-l-4',
        config.accentColor
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex size-10 items-center justify-center rounded-lg',
              config.color
            )}
          >
            <Icon className="size-5" />
          </div>
          <div>
            <span
              className={cn(
                'rounded px-2 py-0.5 text-xs font-medium',
                config.color
              )}
            >
              {order.executiveOrderNumber
                ? `Executive Order ${order.executiveOrderNumber}`
                : config.labelEn}
            </span>
            <p className="mt-0.5 text-xs text-gray-500">
              署名日: {formatDate(order.signingDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="mb-2 text-lg font-bold text-gray-900">
        {order.titleJa || order.title}
      </h3>

      {/* Summary */}
      {order.summaryJa && (
        <p className="mb-4 text-sm text-gray-600">{order.summaryJa}</p>
      )}

      {/* Original title (if translated) */}
      {order.titleJa && (
        <p className="mb-4 text-xs text-gray-400 italic">{order.title}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-xs text-gray-500">
          Doc: {order.documentNumber}
        </span>
        <a
          href={order.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <span>原文を読む</span>
          <ExternalLink className="size-3.5" />
        </a>
      </div>
    </div>
  );
}
