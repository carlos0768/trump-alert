'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useBookmarks, BookmarkedArticle } from '@/lib/hooks/use-bookmarks';
import { ArticleCard } from '@/components/article/article-card';
import { Button } from '@/components/ui/button';

export default function BookmarksPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { fetchBookmarks, isLoading } = useBookmarks();
  const [articles, setArticles] = useState<BookmarkedArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadBookmarks();
    }
  }, [user]);

  const loadBookmarks = async () => {
    const result = await fetchBookmarks(limit, 0);
    setArticles(result.bookmarks);
    setTotal(result.total);
    setHasMore(result.hasMore);
    setOffset(limit);
  };

  const loadMore = async () => {
    const result = await fetchBookmarks(limit, offset);
    setArticles((prev) => [...prev, ...result.bookmarks]);
    setHasMore(result.hasMore);
    setOffset((prev) => prev + limit);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="rounded-full p-2 hover:bg-surface-elevated transition-colors"
          >
            <ArrowLeft className="size-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">ブックマーク</h1>
            <p className="text-sm text-muted-foreground">{total}件の記事</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-2xl">
        {isLoading && articles.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-primary-500" />
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <Bookmark className="size-16 text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-2">
              ブックマークがありません
            </h2>
            <p className="text-muted-foreground mb-6">
              記事のブックマークボタンを押すと、ここに保存されます
            </p>
            <Button onClick={() => router.push('/')} variant="outline">
              記事を探す
            </Button>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={{
                    ...article,
                    publishedAt: new Date(article.publishedAt),
                    bias: article.bias as 'Left' | 'Center' | 'Right' | null,
                    impactLevel: article.impactLevel as 'S' | 'A' | 'B' | 'C',
                  }}
                  showImage={false}
                />
              ))}
            </div>

            {hasMore && (
              <div className="p-4">
                <Button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      読み込み中...
                    </>
                  ) : (
                    'もっと見る'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
