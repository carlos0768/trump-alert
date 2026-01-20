'use client';

import { useEffect, useState } from 'react';
import { Scale, ArrowLeftRight, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge, BiasBadge, SentimentBadge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';
import {
  fetchFactCheckComparisons,
  type ComparisonPair,
  type ComparisonArticle,
} from '@/lib/api';

// モックデータ（APIからデータがない場合のフォールバック）
const mockComparisons: ComparisonPair[] = [
  {
    id: '1',
    topic: 'Trump Tariff Announcement',
    topicJa: 'トランプ関税発表',
    left: {
      id: '1',
      source: 'CNN',
      title: "Trump's Tariff Plan Could Devastate American Consumers",
      titleJa: 'トランプの関税計画がアメリカの消費者を直撃する可能性',
      summary:
        'Economic experts warn that proposed tariffs would increase costs for everyday goods and potentially trigger a trade war.',
      sentiment: -0.72,
      url: 'https://cnn.com/article1',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
    center: null,
    right: {
      id: '2',
      source: 'Fox News',
      title: "Trump's Bold Tariff Strategy to Protect American Jobs",
      titleJa: 'トランプの大胆な関税戦略でアメリカの雇用を守る',
      summary:
        'Former president outlines plan to bring manufacturing back to America and reduce dependence on Chinese imports.',
      sentiment: 0.68,
      url: 'https://foxnews.com/article1',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    },
    sentimentGap: 1.4,
  },
  {
    id: '2',
    topic: 'Trump Rally in Iowa',
    topicJa: 'トランプのアイオワ集会',
    left: {
      id: '3',
      source: 'MSNBC',
      title: 'Trump Spreads Misinformation at Iowa Rally',
      titleJa: 'トランプがアイオワ集会で誤情報を拡散',
      summary:
        'Fact-checkers identify multiple false claims made during rally speech about economy and immigration.',
      sentiment: -0.85,
      url: 'https://msnbc.com/article2',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    },
    center: null,
    right: {
      id: '4',
      source: 'Newsmax',
      title: "Massive Crowd Cheers Trump's Vision for America",
      titleJa: '大勢の聴衆がトランプのアメリカビジョンに歓声',
      summary:
        "Enthusiastic supporters rally behind Trump's message of economic renewal and border security.",
      sentiment: 0.82,
      url: 'https://newsmax.com/article2',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    },
    sentimentGap: 1.67,
  },
  {
    id: '3',
    topic: 'Trump Legal Proceedings',
    topicJa: 'トランプ法的手続き',
    left: {
      id: '5',
      source: 'New York Times',
      title: 'New Evidence Strengthens Case Against Trump',
      titleJa: '新たな証拠がトランプに対する訴訟を強化',
      summary:
        'Prosecutors present compelling documentation that could prove decisive in upcoming trial.',
      sentiment: -0.55,
      url: 'https://nytimes.com/article3',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
    center: null,
    right: {
      id: '6',
      source: 'The Daily Wire',
      title: 'Legal Experts: Trump Case Built on Shaky Foundation',
      titleJa: '法律専門家：トランプ訴訟は不安定な基盤の上に構築',
      summary:
        'Constitutional lawyers question the legal basis of charges, calling prosecution politically motivated.',
      sentiment: 0.45,
      url: 'https://dailywire.com/article3',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    },
    sentimentGap: 1.0,
  },
];

function ArticleCard({
  article,
  bias,
}: {
  article: ComparisonArticle;
  bias: 'Left' | 'Center' | 'Right';
}) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar fallback={article.source.charAt(0)} size="sm" />
          <span className="font-medium text-foreground">{article.source}</span>
        </div>
        <BiasBadge bias={bias} />
      </div>
      <h3 className="mt-4 text-balance font-semibold text-foreground">
        {article.titleJa || article.title}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">{article.title}</p>
      <p className="mt-2 text-pretty text-sm text-muted-foreground">
        {article.summary}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <SentimentBadge sentiment={article.sentiment} />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{formatRelativeTime(new Date(article.publishedAt))}</span>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary-400 hover:underline"
          >
            Read <ExternalLink className="size-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function FactCheckPage() {
  const [comparisons, setComparisons] = useState<ComparisonPair[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadComparisons() {
      setIsLoading(true);
      try {
        const data = await fetchFactCheckComparisons(10);
        if (data && data.length > 0) {
          setComparisons(data);
        } else {
          // APIからデータがない場合はモックを使用
          setComparisons(mockComparisons);
        }
      } catch {
        setComparisons(mockComparisons);
      } finally {
        setIsLoading(false);
      }
    }
    loadComparisons();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary-600/20">
          <Scale className="size-8 text-primary-400" />
        </div>
        <h1 className="mt-4 font-headline text-2xl font-bold uppercase tracking-wide text-foreground">
          Fact Check Maker
        </h1>
        <p className="mt-2 text-muted-foreground">
          Compare how different sources cover the same story
        </p>
        <p className="mt-1 text-sm text-muted-foreground/70">
          同じニュースを異なる視点のメディアがどう報じているかを比較
        </p>
      </div>

      {/* Legend */}
      <div className="mt-8 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-bias-left" />
          <span className="text-sm text-muted-foreground">
            Left-leaning sources
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-bias-center" />
          <span className="text-sm text-muted-foreground">Center sources</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-bias-right" />
          <span className="text-sm text-muted-foreground">
            Right-leaning sources
          </span>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="mt-12 flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        /* Comparisons */
        <div className="mt-8 space-y-6">
          {comparisons.map((comparison) => (
            <Card
              key={comparison.id}
              className="overflow-hidden border-border bg-surface-elevated"
            >
              {/* Topic Header */}
              <div className="border-b border-border bg-surface-muted px-6 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-headline font-semibold uppercase tracking-wide text-foreground">
                      {comparison.topicJa || comparison.topic}
                    </h2>
                    {comparison.topicJa && (
                      <p className="text-xs text-muted-foreground">
                        {comparison.topic}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary">
                    Sentiment Gap: {comparison.sentimentGap.toFixed(2)}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-0">
                <div
                  className={`grid ${comparison.center ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}
                >
                  {/* Left Side */}
                  {comparison.left && (
                    <div className="border-b border-border md:border-b-0 md:border-r">
                      <ArticleCard article={comparison.left} bias="Left" />
                    </div>
                  )}

                  {/* Center (if available) */}
                  {comparison.center && (
                    <div className="border-b border-border md:border-b-0 md:border-r">
                      <ArticleCard article={comparison.center} bias="Center" />
                    </div>
                  )}

                  {/* Center Divider (mobile, no center article) */}
                  {!comparison.center && (
                    <div className="flex items-center justify-center py-2 md:hidden">
                      <ArrowLeftRight className="size-5 text-muted-foreground" />
                    </div>
                  )}

                  {/* Right Side */}
                  {comparison.right && (
                    <div>
                      <ArticleCard article={comparison.right} bias="Right" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {comparisons.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <p>比較可能な記事がありません</p>
              <p className="mt-2 text-sm">
                左右両方のメディアから同じトピックの記事が必要です
              </p>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-8 rounded-lg bg-surface-muted p-4 text-center text-sm text-muted-foreground">
        <p>
          This comparison is generated automatically by AI analysis. The bias
          classifications are based on general source tendencies and may not
          reflect the specific article content.
        </p>
        <p className="mt-2 text-xs">
          この比較はAI分析により自動生成されています。バイアス分類はメディアの一般的な傾向に基づいており、特定の記事内容を反映していない場合があります。
        </p>
      </div>
    </div>
  );
}
