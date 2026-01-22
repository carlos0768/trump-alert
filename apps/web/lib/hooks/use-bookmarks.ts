'use client';

import { useState, useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuth } from './use-auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface BookmarkState {
  bookmarkedIds: Set<string>;
  setBookmarkedIds: (ids: string[]) => void;
  addBookmark: (id: string) => void;
  removeBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;
}

// Store for quick lookup of bookmarked article IDs
export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarkedIds: new Set<string>(),
      setBookmarkedIds: (ids) => set({ bookmarkedIds: new Set(ids) }),
      addBookmark: (id) =>
        set((state) => ({
          bookmarkedIds: new Set([...state.bookmarkedIds, id]),
        })),
      removeBookmark: (id) =>
        set((state) => {
          const newSet = new Set(state.bookmarkedIds);
          newSet.delete(id);
          return { bookmarkedIds: newSet };
        }),
      isBookmarked: (id) => get().bookmarkedIds.has(id),
    }),
    {
      name: 'bookmark-storage',
      // Custom serialization for Set
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          return {
            ...parsed,
            state: {
              ...parsed.state,
              bookmarkedIds: new Set(parsed.state.bookmarkedIds || []),
            },
          };
        },
        setItem: (name, value) => {
          const toStore = {
            ...value,
            state: {
              ...value.state,
              bookmarkedIds: [...value.state.bookmarkedIds],
            },
          };
          localStorage.setItem(name, JSON.stringify(toStore));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

export interface BookmarkedArticle {
  id: string;
  title: string;
  titleJa?: string;
  url: string;
  source: string;
  content: string;
  contentJa?: string;
  summary: string[];
  sentiment: number | null;
  bias: string | null;
  impactLevel: string;
  publishedAt: string;
  imageUrl?: string;
}

export function useBookmarks() {
  const { user } = useAuth();
  const {
    bookmarkedIds,
    setBookmarkedIds,
    addBookmark: addToStore,
    removeBookmark: removeFromStore,
    isBookmarked,
  } = useBookmarkStore();

  const [bookmarks, setBookmarks] = useState<BookmarkedArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch bookmark IDs on mount when user is logged in
  useEffect(() => {
    if (user?.id) {
      fetchBookmarkIds();
    }
  }, [user?.id]);

  const fetchBookmarkIds = useCallback(async () => {
    if (!user?.id) return;

    try {
      const res = await fetch(`${API_URL}/api/bookmarks/user/${user.id}/ids`);
      if (res.ok) {
        const data = await res.json();
        setBookmarkedIds(data.articleIds);
      }
    } catch (err) {
      console.error('Failed to fetch bookmark IDs:', err);
    }
  }, [user?.id, setBookmarkedIds]);

  const fetchBookmarks = useCallback(
    async (limit = 50, offset = 0) => {
      if (!user?.id) return { bookmarks: [], total: 0, hasMore: false };

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${API_URL}/api/bookmarks/user/${user.id}?limit=${limit}&offset=${offset}`
        );

        if (!res.ok) {
          throw new Error('Failed to fetch bookmarks');
        }

        const data = await res.json();
        const articles = data.bookmarks.map(
          (b: { article: BookmarkedArticle }) => b.article
        );
        setBookmarks(articles);
        return {
          bookmarks: articles,
          total: data.total,
          hasMore: data.hasMore,
        };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to fetch bookmarks';
        setError(message);
        return { bookmarks: [], total: 0, hasMore: false };
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id]
  );

  const toggleBookmark = useCallback(
    async (articleId: string) => {
      if (!user?.id) return false;

      const wasBookmarked = isBookmarked(articleId);

      // Optimistic update
      if (wasBookmarked) {
        removeFromStore(articleId);
      } else {
        addToStore(articleId);
      }

      try {
        if (wasBookmarked) {
          const res = await fetch(
            `${API_URL}/api/bookmarks/user/${user.id}/article/${articleId}`,
            { method: 'DELETE' }
          );
          if (!res.ok) throw new Error('Failed to remove bookmark');
        } else {
          const res = await fetch(
            `${API_URL}/api/bookmarks/user/${user.id}/article/${articleId}`,
            { method: 'POST' }
          );
          if (!res.ok) throw new Error('Failed to add bookmark');
        }
        return true;
      } catch (err) {
        // Revert optimistic update on error
        if (wasBookmarked) {
          addToStore(articleId);
        } else {
          removeFromStore(articleId);
        }
        console.error('Bookmark toggle failed:', err);
        return false;
      }
    },
    [user?.id, isBookmarked, addToStore, removeFromStore]
  );

  return {
    bookmarks,
    bookmarkedIds,
    isLoading,
    error,
    isBookmarked,
    toggleBookmark,
    fetchBookmarks,
    fetchBookmarkIds,
  };
}
