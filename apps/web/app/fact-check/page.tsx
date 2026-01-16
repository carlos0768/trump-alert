'use client';

import { Scale, ArrowLeftRight, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge, BiasBadge, SentimentBadge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';

interface ComparisonPair {
  id: string;
  topic: string;
  left: {
    source: string;
    title: string;
    summary: string;
    sentiment: number;
    url: string;
    publishedAt: Date;
  };
  right: {
    source: string;
    title: string;
    summary: string;
    sentiment: number;
    url: string;
    publishedAt: Date;
  };
}

const mockComparisons: ComparisonPair[] = [
  {
    id: '1',
    topic: 'Trump Tariff Announcement',
    left: {
      source: 'CNN',
      title: "Trump's Tariff Plan Could Devastate American Consumers",
      summary:
        'Economic experts warn that proposed tariffs would increase costs for everyday goods and potentially trigger a trade war.',
      sentiment: -0.72,
      url: 'https://cnn.com/article1',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    },
    right: {
      source: 'Fox News',
      title: "Trump's Bold Tariff Strategy to Protect American Jobs",
      summary:
        'Former president outlines plan to bring manufacturing back to America and reduce dependence on Chinese imports.',
      sentiment: 0.68,
      url: 'https://foxnews.com/article1',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
    },
  },
  {
    id: '2',
    topic: 'Trump Rally in Iowa',
    left: {
      source: 'MSNBC',
      title: 'Trump Spreads Misinformation at Iowa Rally',
      summary:
        'Fact-checkers identify multiple false claims made during rally speech about economy and immigration.',
      sentiment: -0.85,
      url: 'https://msnbc.com/article2',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
    },
    right: {
      source: 'Newsmax',
      title: "Massive Crowd Cheers Trump's Vision for America",
      summary:
        "Enthusiastic supporters rally behind Trump's message of economic renewal and border security.",
      sentiment: 0.82,
      url: 'https://newsmax.com/article2',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 7),
    },
  },
  {
    id: '3',
    topic: 'Trump Legal Proceedings',
    left: {
      source: 'New York Times',
      title: 'New Evidence Strengthens Case Against Trump',
      summary:
        'Prosecutors present compelling documentation that could prove decisive in upcoming trial.',
      sentiment: -0.55,
      url: 'https://nytimes.com/article3',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    },
    right: {
      source: 'The Daily Wire',
      title: 'Legal Experts: Trump Case Built on Shaky Foundation',
      summary:
        'Constitutional lawyers question the legal basis of charges, calling prosecution politically motivated.',
      sentiment: 0.45,
      url: 'https://dailywire.com/article3',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 10),
    },
  },
];

export default function FactCheckPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary-100">
          <Scale className="size-8 text-primary-600" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Fact Check Maker
        </h1>
        <p className="mt-2 text-gray-500">
          Compare how different sources cover the same story
        </p>
      </div>

      {/* Legend */}
      <div className="mt-8 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-blue-500" />
          <span className="text-sm text-gray-600">Left-leaning sources</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-red-500" />
          <span className="text-sm text-gray-600">Right-leaning sources</span>
        </div>
      </div>

      {/* Comparisons */}
      <div className="mt-8 space-y-6">
        {mockComparisons.map((comparison) => (
          <Card key={comparison.id} className="overflow-hidden">
            {/* Topic Header */}
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">
                  {comparison.topic}
                </h2>
                <Badge variant="secondary">
                  Sentiment Gap:{' '}
                  {Math.abs(
                    comparison.left.sentiment - comparison.right.sentiment
                  ).toFixed(2)}
                </Badge>
              </div>
            </div>

            <CardContent className="p-0">
              <div className="grid md:grid-cols-2">
                {/* Left Side */}
                <div className="border-b border-gray-200 p-6 md:border-b-0 md:border-r">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar
                        fallback={comparison.left.source.charAt(0)}
                        size="sm"
                      />
                      <span className="font-medium text-gray-900">
                        {comparison.left.source}
                      </span>
                    </div>
                    <BiasBadge bias="Left" />
                  </div>
                  <h3 className="mt-4 text-balance font-semibold text-gray-900">
                    {comparison.left.title}
                  </h3>
                  <p className="mt-2 text-pretty text-sm text-gray-600">
                    {comparison.left.summary}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <SentimentBadge sentiment={comparison.left.sentiment} />
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>
                        {formatRelativeTime(comparison.left.publishedAt)}
                      </span>
                      <a
                        href={comparison.left.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary-600 hover:underline"
                      >
                        Read <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Center Divider (mobile) */}
                <div className="flex items-center justify-center py-2 md:hidden">
                  <ArrowLeftRight className="size-5 text-gray-400" />
                </div>

                {/* Right Side */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar
                        fallback={comparison.right.source.charAt(0)}
                        size="sm"
                      />
                      <span className="font-medium text-gray-900">
                        {comparison.right.source}
                      </span>
                    </div>
                    <BiasBadge bias="Right" />
                  </div>
                  <h3 className="mt-4 text-balance font-semibold text-gray-900">
                    {comparison.right.title}
                  </h3>
                  <p className="mt-2 text-pretty text-sm text-gray-600">
                    {comparison.right.summary}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <SentimentBadge sentiment={comparison.right.sentiment} />
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>
                        {formatRelativeTime(comparison.right.publishedAt)}
                      </span>
                      <a
                        href={comparison.right.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary-600 hover:underline"
                      >
                        Read <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="mt-8 rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">
        <p>
          This comparison is generated automatically by AI analysis. The bias
          classifications are based on general source tendencies and may not
          reflect the specific article content.
        </p>
      </div>
    </div>
  );
}
