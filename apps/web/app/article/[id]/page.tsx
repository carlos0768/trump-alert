'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ExternalLink,
  MessageCircle,
  Repeat2,
  Heart,
  Bookmark,
  Share,
  Clock,
  Globe,
  User,
  Scale,
  FileText,
  Building2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Newspaper,
  MessageSquareQuote,
  TrendingUp,
  Target,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { TrumpSpinner } from '@/components/ui';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ImpactBadge, BiasBadge, SentimentBadge } from '@/components/ui/badge';
import { useArticle, useRelatedArticles } from '@/lib/hooks';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { GlossaryItem } from '@/lib/api';

// Expert Commentary type
interface ExpertCommentary {
  expert: {
    name: string;
    title: string;
    affiliation: string;
  };
  analysis: string;
  context: string;
  implications: {
    shortTerm: string;
    longTerm: string;
    forJapan: string;
  };
  verdict: {
    reliability: 'high' | 'medium' | 'low';
    importance: number;
    watchPoints: string[];
  };
  oneLineExplain: string;
}

const glossaryTypeIcons: Record<GlossaryItem['type'], typeof User> = {
  person: User,
  law: Scale,
  treaty: FileText,
  organization: Building2,
  term: HelpCircle,
};

const glossaryTypeLabels: Record<GlossaryItem['type'], string> = {
  person: '人物',
  law: '法律',
  treaty: '条約',
  organization: '機関',
  term: '用語',
};

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

export default function ArticlePage({ params }: ArticlePageProps) {
  const { id } = use(params);
  const { data: article, isLoading, error } = useArticle(id);
  const { data: relatedArticles } = useRelatedArticles(id);
  const [showFullContent, setShowFullContent] = useState(false);
  const [showCommentary, setShowCommentary] = useState(false);

  // Cast commentary to typed interface
  const commentary = article?.commentary as ExpertCommentary | null;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <TrumpSpinner size="lg" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Article not found</p>
        <Link href="/">
          <Button variant="outline">Back to Feed</Button>
        </Link>
      </div>
    );
  }

  const publishedAt =
    typeof article.publishedAt === 'string'
      ? new Date(article.publishedAt)
      : article.publishedAt;

  // Prefer Japanese if available
  const displayTitle = article.titleJa || article.title;
  const displayContent = article.contentJa || article.content;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Back Button */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Feed
      </Link>

      {/* Article Header */}
      <div className="flex items-start gap-4">
        <Avatar
          alt={article.source}
          fallback={article.source.charAt(0)}
          size="lg"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              {article.source}
            </span>
            <span className="text-sm text-muted-foreground">
              {formatRelativeTime(publishedAt)}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <ImpactBadge level={article.impactLevel} />
            {article.bias && <BiasBadge bias={article.bias} />}
            {article.sentiment !== null && (
              <SentimentBadge sentiment={article.sentiment} />
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      <h1 className="mt-6 text-balance text-2xl font-bold leading-tight text-foreground">
        {displayTitle}
      </h1>

      {/* Metadata */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="size-4" />
          <span>
            {publishedAt.toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Globe className="size-4" />
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary-500 transition-colors"
          >
            {new URL(article.url).hostname}
          </a>
        </div>
      </div>

      {/* Image */}
      {article.imageUrl && (
        <div className="mt-6 overflow-hidden rounded-xl border border-border">
          <img
            src={article.imageUrl}
            alt=""
            className="aspect-video w-full object-cover"
          />
        </div>
      )}

      {/* AI Summary */}
      {article.summary && article.summary.length > 0 && (
        <Card className="mt-6">
          <CardContent className="pt-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="flex size-5 items-center justify-center rounded bg-primary-500/20 text-xs text-primary-400">
                AI
              </span>
              Summary
            </h2>
            <ul className="space-y-2">
              {article.summary.map((point, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-foreground/80"
                >
                  <span className="mt-2 size-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                  <span className="text-pretty">{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Expert Commentary */}
      {commentary && (
        <div className="mt-6">
          <button
            onClick={() => setShowCommentary(!showCommentary)}
            className="flex w-full items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 transition-colors hover:bg-amber-500/10"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/20">
                <MessageSquareQuote className="size-5 text-amber-500" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">
                  {showCommentary
                    ? '専門家の解説を閉じる'
                    : '専門家の解説を見る'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {commentary.expert.name}（{commentary.expert.title}）
                </p>
              </div>
            </div>
            {showCommentary ? (
              <ChevronUp className="size-5 text-amber-500" />
            ) : (
              <ChevronDown className="size-5 text-amber-500" />
            )}
          </button>

          {showCommentary && (
            <Card className="mt-4 border-amber-500/30">
              <CardContent className="pt-4 space-y-4">
                {/* Expert Info */}
                <div className="flex items-center gap-3 pb-3 border-b border-amber-500/20">
                  <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/20">
                    <Eye className="size-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {commentary.expert.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {commentary.expert.title} /{' '}
                      {commentary.expert.affiliation}
                    </p>
                  </div>
                </div>

                {/* One-line Explanation */}
                <div className="rounded-lg bg-amber-500/10 p-4">
                  <p className="text-xs font-medium text-amber-500 mb-1">
                    要するに...
                  </p>
                  <p className="text-base font-medium text-foreground">
                    {commentary.oneLineExplain}
                  </p>
                </div>

                {/* Analysis */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="size-4 text-amber-500" />
                    <p className="text-sm font-medium text-amber-500">分析</p>
                  </div>
                  <p className="text-foreground/80 leading-relaxed">
                    {commentary.analysis}
                  </p>
                </div>

                {/* Context */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="size-4 text-amber-500" />
                    <p className="text-sm font-medium text-amber-500">
                      背景・文脈
                    </p>
                  </div>
                  <p className="text-foreground/80 leading-relaxed">
                    {commentary.context}
                  </p>
                </div>

                {/* Implications */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-amber-500">
                    今後の影響
                  </p>
                  <div className="grid gap-3">
                    <div className="rounded-lg bg-surface-elevated p-3">
                      <span className="text-xs text-muted-foreground">
                        短期的:
                      </span>
                      <p className="text-foreground mt-1">
                        {commentary.implications.shortTerm}
                      </p>
                    </div>
                    <div className="rounded-lg bg-surface-elevated p-3">
                      <span className="text-xs text-muted-foreground">
                        長期的:
                      </span>
                      <p className="text-foreground mt-1">
                        {commentary.implications.longTerm}
                      </p>
                    </div>
                    <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
                      <span className="text-xs text-blue-400">
                        日本への影響:
                      </span>
                      <p className="text-foreground mt-1">
                        {commentary.implications.forJapan}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Verdict */}
                <div className="pt-3 border-t border-amber-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="size-4 text-amber-500" />
                    <p className="text-sm font-medium text-amber-500">
                      総合評価
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mb-3">
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-sm font-medium',
                        commentary.verdict.reliability === 'high' &&
                          'bg-green-500/20 text-green-400',
                        commentary.verdict.reliability === 'medium' &&
                          'bg-yellow-500/20 text-yellow-400',
                        commentary.verdict.reliability === 'low' &&
                          'bg-red-500/20 text-red-400'
                      )}
                    >
                      信頼性:{' '}
                      {commentary.verdict.reliability === 'high'
                        ? '高'
                        : commentary.verdict.reliability === 'medium'
                          ? '中'
                          : '低'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      重要度:{' '}
                      <span className="font-mono text-lg text-foreground">
                        {commentary.verdict.importance}/10
                      </span>
                    </span>
                  </div>

                  {/* Watch Points */}
                  {commentary.verdict.watchPoints.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground mb-2">
                        注目ポイント:
                      </p>
                      <ul className="space-y-2">
                        {commentary.verdict.watchPoints.map((point, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm text-foreground/80"
                          >
                            <span className="mt-1.5 size-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Glossary - Contextual Explanations */}
      {article.glossary && article.glossary.length > 0 && (
        <Card className="mt-4">
          <CardContent className="pt-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="flex size-5 items-center justify-center rounded bg-amber-500/20 text-xs text-amber-400">
                ?
              </span>
              用語解説
            </h2>
            <div className="space-y-3">
              {article.glossary.map((item, idx) => {
                const Icon = glossaryTypeIcons[item.type];
                return (
                  <div
                    key={idx}
                    className="rounded-lg border border-border bg-surface-elevated p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {item.termJa}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({item.term})
                      </span>
                      <span className="ml-auto rounded-full bg-surface-overlay px-2 py-0.5 text-xs text-muted-foreground">
                        {glossaryTypeLabels[item.type]}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Preview */}
      <div className="mt-6">
        <p className="text-pretty leading-relaxed text-foreground/80 whitespace-pre-wrap">
          {displayContent}
        </p>
      </div>

      {/* Full Content (Expandable) - 翻訳済み全文 */}
      {article.contentJa && (
        <div className="mt-6">
          <button
            onClick={() => setShowFullContent(!showFullContent)}
            className="flex w-full items-center justify-between rounded-xl border border-primary-500/30 bg-primary-500/5 p-4 transition-colors hover:bg-primary-500/10"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary-500/20">
                <Newspaper className="size-5 text-primary-500" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">
                  {showFullContent ? '全文を閉じる' : '全文を表示'}
                </p>
                <p className="text-sm text-muted-foreground">
                  AI翻訳による日本語全文
                </p>
              </div>
            </div>
            {showFullContent ? (
              <ChevronUp className="size-5 text-primary-500" />
            ) : (
              <ChevronDown className="size-5 text-primary-500" />
            )}
          </button>

          {showFullContent && (
            <Card className="mt-4">
              <CardContent className="pt-4">
                <p className="text-pretty leading-relaxed text-foreground whitespace-pre-wrap">
                  {article.contentJa}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* External Link */}
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex items-center justify-between rounded-xl border border-border bg-surface-elevated p-4 transition-colors hover:bg-surface-overlay"
      >
        <div>
          <p className="font-medium text-foreground">元の記事を読む</p>
          <p className="text-sm text-muted-foreground">
            {new URL(article.url).hostname}
          </p>
        </div>
        <ExternalLink className="size-5 text-muted-foreground" />
      </a>

      {/* Actions */}
      <div className="mt-6 flex items-center justify-between border-y border-border py-3">
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-primary-500 transition-colors">
            <MessageCircle className="size-5" />
            <span className="tabular-nums">0</span>
          </button>
          <button className="flex items-center gap-2 text-muted-foreground hover:text-sentiment-positive transition-colors">
            <Repeat2 className="size-5" />
            <span className="tabular-nums">0</span>
          </button>
          <button className="flex items-center gap-2 text-muted-foreground hover:text-sentiment-negative transition-colors">
            <Heart className="size-5" />
            <span className="tabular-nums">0</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm">
            <Bookmark className="size-5" />
          </Button>
          <Button variant="ghost" size="icon-sm">
            <Share className="size-5" />
          </Button>
        </div>
      </div>

      {/* Related Articles */}
      {relatedArticles && relatedArticles.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 font-headline text-lg tracking-wider text-foreground">
            RELATED ARTICLES
          </h2>
          <div className="space-y-3">
            {relatedArticles.slice(0, 3).map((related) => (
              <Link
                key={related.id}
                href={`/article/${related.id}`}
                className="block rounded-lg border border-border bg-card p-3 transition-colors hover:bg-surface-elevated"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-foreground line-clamp-2">
                      {related.titleJa || related.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {related.source} &middot;{' '}
                      {formatRelativeTime(related.publishedAt)}
                    </p>
                  </div>
                  <ImpactBadge level={related.impactLevel} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
