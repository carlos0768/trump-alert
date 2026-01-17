'use client';

import Link from 'next/link';
import { Circle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StorylineEvent } from '@/lib/api';

interface StorylineTimelineProps {
  events: StorylineEvent[];
}

const impactColors: Record<string, string> = {
  S: 'border-red-500 bg-red-50',
  A: 'border-orange-500 bg-orange-50',
  B: 'border-yellow-500 bg-yellow-50',
  C: 'border-gray-300 bg-gray-50',
};

export function StorylineTimeline({ events }: StorylineTimelineProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      month: date.toLocaleDateString('ja-JP', { month: 'short' }),
      day: date.getDate(),
      time: date.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-6 top-0 h-full w-0.5 bg-gray-200" />

      {/* Events */}
      <div className="space-y-6">
        {events.map((event) => {
          const date = formatDate(event.date);

          return (
            <div key={event.article.id} className="relative flex gap-4">
              {/* Timeline node */}
              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={cn(
                    'flex size-12 flex-shrink-0 items-center justify-center rounded-full border-2',
                    event.isKeyEvent
                      ? 'border-primary-500 bg-primary-100'
                      : 'border-gray-300 bg-white'
                  )}
                >
                  {event.isKeyEvent ? (
                    <Star className="size-5 text-primary-600" />
                  ) : (
                    <Circle className="size-3 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 pb-2">
                {/* Date */}
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    {date.month} {date.day}
                  </span>
                  <span className="text-sm text-gray-500">{date.time}</span>
                  {event.isKeyEvent && (
                    <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                      重要
                    </span>
                  )}
                </div>

                {/* Article card */}
                <Link
                  href={`/article/${event.article.id}`}
                  className={cn(
                    'block rounded-lg border-l-4 p-4 transition-colors hover:bg-gray-100',
                    impactColors[event.article.impactLevel] || impactColors.C
                  )}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded bg-white px-2 py-0.5 text-xs font-medium text-gray-600 shadow-sm">
                      {event.article.source}
                    </span>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-xs font-bold',
                        event.article.impactLevel === 'S'
                          ? 'bg-red-600 text-white'
                          : event.article.impactLevel === 'A'
                            ? 'bg-orange-500 text-white'
                            : event.article.impactLevel === 'B'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-gray-400 text-white'
                      )}
                    >
                      {event.article.impactLevel}
                    </span>
                  </div>

                  <h4 className="mb-2 font-medium text-gray-900">
                    {event.article.titleJa || event.article.title}
                  </h4>

                  {event.article.summary &&
                    event.article.summary.length > 0 && (
                      <ul className="space-y-1 text-sm text-gray-600">
                        {event.article.summary.slice(0, 2).map((point, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-1.5 size-1 flex-shrink-0 rounded-full bg-gray-400" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
