'use client';

import { use } from 'react';
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
} from 'lucide-react';
import { TrumpSpinner } from '@/components/ui';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ImpactBadge, BiasBadge, SentimentBadge } from '@/components/ui/badge';
import { useArticle, useRelatedArticles } from '@/lib/hooks';
import { formatRelativeTime } from '@/lib/utils';
import type { GlossaryItem } from '@/lib/api';

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
        <p className="text-gray-500">Article not found</p>
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
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
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
            <span className="font-semibold text-gray-900">
              {article.source}
            </span>
            <span className="text-sm text-gray-500">
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
      <h1 className="mt-6 text-balance text-2xl font-bold leading-tight text-gray-900">
        {displayTitle}
      </h1>

      {/* Metadata */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
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
            className="hover:text-primary-600"
          >
            {new URL(article.url).hostname}
          </a>
        </div>
      </div>

      {/* Image */}
      {article.imageUrl && (
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200">
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
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <span className="flex size-5 items-center justify-center rounded bg-primary-100 text-xs text-primary-700">
                AI
              </span>
              Summary
            </h2>
            <ul className="space-y-2">
              {article.summary.map((point, idx) => (
                <li key={idx} className="flex items-start gap-3 text-gray-700">
                  <span className="mt-2 size-1.5 flex-shrink-0 rounded-full bg-primary-400" />
                  <span className="text-pretty">{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Glossary - Contextual Explanations */}
      {article.glossary && article.glossary.length > 0 && (
        <Card className="mt-4">
          <CardContent className="pt-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <span className="flex size-5 items-center justify-center rounded bg-amber-100 text-xs text-amber-700">
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
                    className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 text-gray-500" />
                      <span className="font-medium text-gray-900">
                        {item.termJa}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({item.term})
                      </span>
                      <span className="ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                        {glossaryTypeLabels[item.type]}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-gray-600">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      <div className="mt-6">
        <p className="text-pretty leading-relaxed text-gray-700 whitespace-pre-wrap">
          {displayContent}
        </p>
      </div>

      {/* External Link */}
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100"
      >
        <div>
          <p className="font-medium text-gray-900">Read full article</p>
          <p className="text-sm text-gray-500">
            {new URL(article.url).hostname}
          </p>
        </div>
        <ExternalLink className="size-5 text-gray-400" />
      </a>

      {/* Actions */}
      <div className="mt-6 flex items-center justify-between border-y border-gray-200 py-3">
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2 text-gray-500 hover:text-primary-600">
            <MessageCircle className="size-5" />
            <span className="tabular-nums">0</span>
          </button>
          <button className="flex items-center gap-2 text-gray-500 hover:text-green-600">
            <Repeat2 className="size-5" />
            <span className="tabular-nums">0</span>
          </button>
          <button className="flex items-center gap-2 text-gray-500 hover:text-red-500">
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
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Related Articles
          </h2>
          <div className="space-y-3">
            {relatedArticles.slice(0, 3).map((related) => (
              <Link
                key={related.id}
                href={`/article/${related.id}`}
                className="block rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 line-clamp-2">
                      {related.titleJa || related.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
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
