'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageCircle,
  Repeat2,
  Heart,
  Bookmark,
  BookmarkCheck,
  Share,
  Share2,
  MoreHorizontal,
  ExternalLink,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Check,
  Link as LinkIcon,
  Twitter,
  MessageSquareQuote,
  TrendingUp,
  Target,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import {
  ImpactBadge,
  BiasBadge,
  SentimentBadge,
  BreakingBadge,
} from '@/components/ui/badge';
import { cn, formatNumber, formatRelativeTime } from '@/lib/utils';
import { getSourceIcon } from '@/lib/sources';
import { useBookmarks } from '@/lib/hooks/use-bookmarks';
import { useLikes } from '@/lib/hooks/use-likes';
import { useAuth } from '@/lib/hooks/use-auth';

export interface Article {
  id: string;
  title: string;
  titleJa?: string;
  url: string;
  source: string;
  sourceIcon?: string;
  content: string;
  contentJa?: string;
  publishedAt: Date | string;
  imageUrl?: string;
  summary: string[];
  sentiment: number | null;
  bias: 'Left' | 'Center' | 'Right' | null;
  impactLevel: 'S' | 'A' | 'B' | 'C';
  stats?: {
    comments: number;
    reposts: number;
    likes: number;
  };
  likeCount?: number;
  commentary?: {
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
  } | null;
}

interface ArticleCardProps {
  article: Article;
  showImage?: boolean;
}

export function ArticleCard({ article, showImage = true }: ArticleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCommentary, setShowCommentary] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { isLiked, toggleLike, getLikeCount, initLikeCount } = useLikes();

  const displayTitle = article.titleJa || article.title;
  const displayContent = article.contentJa || article.content;
  const iconSrc = article.sourceIcon || getSourceIcon(article.source);
  const isUrgent = article.impactLevel === 'S';
  const isBreaking = isUrgent && isWithinHours(article.publishedAt, 2);
  // サマリーがある場合でも全文を表示できるようにする（閾値を50文字に下げる）
  const hasFullContent = displayContent && displayContent.length > 50;
  const bookmarked = user ? isBookmarked(article.id) : false;
  const liked = user ? isLiked(article.id) : false;
  const commentary = article.commentary;

  // Initialize like count from article data
  useEffect(() => {
    if (article.likeCount !== undefined) {
      initLikeCount(article.id, article.likeCount);
    }
  }, [article.id, article.likeCount, initLikeCount]);

  const currentLikeCount = getLikeCount(article.id) || article.likeCount || 0;

  const handleBookmark = useCallback(async () => {
    if (!user) {
      // Could show login prompt
      return;
    }
    await toggleBookmark(article.id);
  }, [user, toggleBookmark, article.id]);

  const handleLike = useCallback(async () => {
    if (!user) {
      // Could show login prompt
      return;
    }
    await toggleLike(article.id);
  }, [user, toggleLike, article.id]);

  const articleUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/article/${article.id}`
      : `/article/${article.id}`;

  const handleShare = useCallback(() => {
    setShowShareMenu(!showShareMenu);
  }, [showShareMenu]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      setShowShareMenu(false);
    } catch {
      console.error('Failed to copy link');
    }
  }, [articleUrl]);

  const handleShareTwitter = useCallback(() => {
    const text = encodeURIComponent(displayTitle);
    const url = encodeURIComponent(articleUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      '_blank',
      'noopener,noreferrer'
    );
    setShowShareMenu(false);
  }, [displayTitle, articleUrl]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: displayTitle,
          text: article.summary?.[0] || displayTitle,
          url: articleUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    }
    setShowShareMenu(false);
  }, [displayTitle, article.summary, articleUrl]);

  return (
    <article
      className={cn(
        'relative border-b border-border bg-card px-4 py-4 transition-all duration-300',
        'hover:bg-surface-elevated',
        isUrgent && 'border-l-2 border-l-urgent bg-urgent/5 hover:bg-urgent/10'
      )}
    >
      {/* Breaking indicator for urgent news */}
      {isBreaking && (
        <div className="absolute -left-px top-0 bottom-0 w-1 bg-urgent animate-pulse-urgent" />
      )}

      <div className="flex gap-3">
        {/* Source Avatar */}
        <div className="relative">
          <Avatar
            src={iconSrc}
            alt={article.source}
            fallback={article.source.charAt(0)}
            size="md"
            ring={isUrgent}
          />
          {isUrgent && (
            <div className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-urgent">
              <AlertTriangle className="size-2.5 text-white" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {/* Breaking badge */}
              {isBreaking && <BreakingBadge className="mr-1" />}

              <span className="font-headline text-sm tracking-wider text-foreground">
                {article.source.toUpperCase()}
              </span>

              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="size-3" />
                {formatRelativeTime(article.publishedAt)}
              </span>

              {/* Badges */}
              <div className="flex items-center gap-1.5">
                <ImpactBadge level={article.impactLevel} />
                {article.bias && <BiasBadge bias={article.bias} />}
                {article.sentiment !== null && (
                  <SentimentBadge sentiment={article.sentiment} />
                )}
              </div>
            </div>

            <button
              className="rounded-full p-1.5 text-muted-foreground hover:bg-surface-overlay hover:text-foreground transition-colors"
              aria-label="More options"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </div>

          {/* Title */}
          <Link href={`/article/${article.id}`} className="group mt-2 block">
            <h2
              className={cn(
                'text-balance text-base font-medium leading-snug text-foreground',
                'group-hover:text-primary-400 transition-colors',
                isUrgent && 'font-headline text-lg tracking-wide'
              )}
            >
              {displayTitle}
            </h2>
          </Link>

          {/* Summary */}
          {article.summary && article.summary.length > 0 ? (
            <ul className="mt-3 space-y-1.5">
              {article.summary.map((point, idx) => (
                <li
                  key={idx}
                  className={cn(
                    'flex items-start gap-2 text-sm text-muted-foreground',
                    'animate-fade-in',
                    `stagger-${idx + 1}`
                  )}
                >
                  <span
                    className={cn(
                      'mt-1.5 size-1.5 flex-shrink-0 rounded-full',
                      isUrgent ? 'bg-urgent' : 'bg-primary-500'
                    )}
                  />
                  <span className="text-pretty">{point}</span>
                </li>
              ))}
            </ul>
          ) : displayContent ? (
            <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground line-clamp-3">
              {displayContent}
            </p>
          ) : null}

          {/* Full Content (Expandable) */}
          {hasFullContent && (
            <div className="mt-3">
              {isExpanded && (
                <div className="mb-3 rounded-lg border border-border bg-surface-elevated p-4">
                  <p className="text-pretty text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {displayContent}
                  </p>
                </div>
              )}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                  'flex items-center gap-1 text-sm font-medium transition-colors',
                  'text-primary-400 hover:text-primary-300'
                )}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="size-4" />
                    全文を閉じる
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-4" />
                    全文を表示
                  </>
                )}
              </button>
            </div>
          )}

          {/* Expert Commentary */}
          {commentary && (
            <div className="mt-3">
              <button
                onClick={() => setShowCommentary(!showCommentary)}
                className={cn(
                  'flex items-center gap-2 text-sm font-medium transition-colors',
                  'text-amber-500 hover:text-amber-400'
                )}
              >
                <MessageSquareQuote className="size-4" />
                専門家の解説を見る
                {showCommentary ? (
                  <ChevronUp className="size-3" />
                ) : (
                  <ChevronDown className="size-3" />
                )}
              </button>

              {showCommentary && (
                <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-4">
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
                  <div className="rounded-lg bg-amber-500/10 p-3">
                    <p className="text-xs font-medium text-amber-500 mb-1">
                      要するに...
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {commentary.oneLineExplain}
                    </p>
                  </div>

                  {/* Analysis */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="size-4 text-amber-500" />
                      <p className="text-xs font-medium text-amber-500">分析</p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {commentary.analysis}
                    </p>
                  </div>

                  {/* Context */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="size-4 text-amber-500" />
                      <p className="text-xs font-medium text-amber-500">
                        背景・文脈
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {commentary.context}
                    </p>
                  </div>

                  {/* Implications */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-amber-500">
                      今後の影響
                    </p>
                    <div className="grid gap-2 text-sm">
                      <div className="rounded-lg bg-surface-elevated p-2">
                        <span className="text-xs text-muted-foreground">
                          短期的:
                        </span>
                        <p className="text-foreground mt-0.5">
                          {commentary.implications.shortTerm}
                        </p>
                      </div>
                      <div className="rounded-lg bg-surface-elevated p-2">
                        <span className="text-xs text-muted-foreground">
                          長期的:
                        </span>
                        <p className="text-foreground mt-0.5">
                          {commentary.implications.longTerm}
                        </p>
                      </div>
                      <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-2">
                        <span className="text-xs text-blue-400">
                          日本への影響:
                        </span>
                        <p className="text-foreground mt-0.5">
                          {commentary.implications.forJapan}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Verdict */}
                  <div className="pt-3 border-t border-amber-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="size-4 text-amber-500" />
                      <p className="text-xs font-medium text-amber-500">
                        総合評価
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium',
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
                      <span className="text-xs text-muted-foreground">
                        重要度:{' '}
                        <span className="font-mono text-foreground">
                          {commentary.verdict.importance}/10
                        </span>
                      </span>
                    </div>

                    {/* Watch Points */}
                    {commentary.verdict.watchPoints.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">
                          注目ポイント:
                        </p>
                        <ul className="space-y-1">
                          {commentary.verdict.watchPoints.map((point, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-xs text-muted-foreground"
                            >
                              <span className="mt-1 size-1 flex-shrink-0 rounded-full bg-amber-500" />
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Image */}
          {showImage && article.imageUrl && (
            <div className="mt-3 overflow-hidden rounded-lg border border-border">
              <img
                src={article.imageUrl}
                alt=""
                className="aspect-video w-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          )}

          {/* External Link Preview */}
          <Link
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-muted-foreground transition-all hover:border-primary-500/50 hover:text-foreground"
          >
            <ExternalLink className="size-4 text-primary-500" />
            <span className="truncate">{new URL(article.url).hostname}</span>
          </Link>

          {/* Actions */}
          <div className="mt-3 flex items-center justify-between max-w-md">
            <ActionButton
              icon={MessageCircle}
              count={article.stats?.comments ?? 0}
            />
            <ActionButton icon={Repeat2} count={article.stats?.reposts ?? 0} />
            <LikeButton
              liked={liked}
              count={currentLikeCount}
              onClick={handleLike}
            />
            <ActionButton
              icon={bookmarked ? BookmarkCheck : Bookmark}
              active={bookmarked}
              onClick={handleBookmark}
              className={bookmarked ? 'text-primary-500' : undefined}
            />
            <div className="relative">
              <ActionButton icon={Share2} onClick={handleShare} />
              {showShareMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-48 rounded-lg border border-border bg-surface-elevated p-2 shadow-lg z-10">
                  <button
                    onClick={handleCopyLink}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-surface-overlay transition-colors"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="size-4 text-green-500" />
                        コピーしました
                      </>
                    ) : (
                      <>
                        <LinkIcon className="size-4" />
                        リンクをコピー
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleShareTwitter}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-surface-overlay transition-colors"
                  >
                    <Twitter className="size-4" />
                    Xでシェア
                  </button>
                  {'share' in navigator && (
                    <button
                      onClick={handleNativeShare}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-surface-overlay transition-colors"
                    >
                      <Share className="size-4" />
                      その他のアプリ
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

interface ActionButtonProps {
  icon: React.ElementType;
  count?: number;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

function ActionButton({
  icon: Icon,
  count,
  active,
  onClick,
  className,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm transition-all',
        'hover:bg-primary-500/10 hover:text-primary-400',
        active ? 'text-primary-500' : 'text-muted-foreground',
        className
      )}
    >
      <Icon className="size-4" />
      {count !== undefined && (
        <span className="font-mono text-xs tabular-nums">
          {formatNumber(count)}
        </span>
      )}
    </button>
  );
}

// Like button with トランプ unit
interface LikeButtonProps {
  liked: boolean;
  count: number;
  onClick: () => void;
}

function LikeButton({ liked, count, onClick }: LikeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm transition-all',
        'hover:bg-red-500/10 hover:text-red-400',
        liked ? 'text-red-500' : 'text-muted-foreground'
      )}
    >
      <Heart className={cn('size-4', liked && 'fill-current')} />
      {count > 0 && (
        <span className="text-xs">
          <span className="font-mono tabular-nums">{formatNumber(count)}</span>
          <span className="ml-0.5 text-[10px]">トランプ</span>
        </span>
      )}
    </button>
  );
}

// Helper function to check if date is within X hours
function isWithinHours(date: Date | string, hours: number): boolean {
  const articleDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - articleDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours <= hours;
}
