'use client';

import { useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuth } from './use-auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface LikeState {
  likedIds: Set<string>;
  likeCounts: Record<string, number>;
  setLikedIds: (ids: string[]) => void;
  addLike: (id: string) => void;
  removeLike: (id: string) => void;
  isLiked: (id: string) => boolean;
  setLikeCount: (id: string, count: number) => void;
  incrementLikeCount: (id: string) => void;
  decrementLikeCount: (id: string) => void;
  getLikeCount: (id: string) => number;
}

// Store for quick lookup of liked article IDs and counts
export const useLikeStore = create<LikeState>()(
  persist(
    (set, get) => ({
      likedIds: new Set<string>(),
      likeCounts: {},
      setLikedIds: (ids) => set({ likedIds: new Set(ids) }),
      addLike: (id) =>
        set((state) => ({
          likedIds: new Set([...state.likedIds, id]),
        })),
      removeLike: (id) =>
        set((state) => {
          const newSet = new Set(state.likedIds);
          newSet.delete(id);
          return { likedIds: newSet };
        }),
      isLiked: (id) => get().likedIds.has(id),
      setLikeCount: (id, count) =>
        set((state) => ({
          likeCounts: { ...state.likeCounts, [id]: count },
        })),
      incrementLikeCount: (id) =>
        set((state) => ({
          likeCounts: {
            ...state.likeCounts,
            [id]: (state.likeCounts[id] || 0) + 1,
          },
        })),
      decrementLikeCount: (id) =>
        set((state) => ({
          likeCounts: {
            ...state.likeCounts,
            [id]: Math.max(0, (state.likeCounts[id] || 0) - 1),
          },
        })),
      getLikeCount: (id) => get().likeCounts[id] || 0,
    }),
    {
      name: 'like-storage',
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
              likedIds: new Set(parsed.state.likedIds || []),
            },
          };
        },
        setItem: (name, value) => {
          const toStore = {
            ...value,
            state: {
              ...value.state,
              likedIds: [...value.state.likedIds],
            },
          };
          localStorage.setItem(name, JSON.stringify(toStore));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

export function useLikes() {
  const { user } = useAuth();
  const {
    likedIds,
    likeCounts,
    setLikedIds,
    addLike: addToStore,
    removeLike: removeFromStore,
    isLiked,
    setLikeCount,
    incrementLikeCount,
    decrementLikeCount,
    getLikeCount,
  } = useLikeStore();

  // Fetch liked IDs on mount when user is logged in
  useEffect(() => {
    if (user?.id) {
      fetchLikedIds();
    }
  }, [user?.id]);

  const fetchLikedIds = useCallback(async () => {
    if (!user?.id) return;

    try {
      const res = await fetch(`${API_URL}/api/likes/user/${user.id}/ids`);
      if (res.ok) {
        const data = await res.json();
        setLikedIds(data.articleIds);
      }
    } catch (err) {
      console.error('Failed to fetch liked IDs:', err);
    }
  }, [user?.id, setLikedIds]);

  const toggleLike = useCallback(
    async (articleId: string) => {
      if (!user?.id)
        return { success: false, likeCount: getLikeCount(articleId) };

      const wasLiked = isLiked(articleId);

      // Optimistic update
      if (wasLiked) {
        removeFromStore(articleId);
        decrementLikeCount(articleId);
      } else {
        addToStore(articleId);
        incrementLikeCount(articleId);
      }

      try {
        if (wasLiked) {
          const res = await fetch(
            `${API_URL}/api/likes/user/${user.id}/article/${articleId}`,
            { method: 'DELETE' }
          );
          if (!res.ok) throw new Error('Failed to remove like');
          const data = await res.json();
          setLikeCount(articleId, data.likeCount);
          return { success: true, likeCount: data.likeCount };
        } else {
          const res = await fetch(
            `${API_URL}/api/likes/user/${user.id}/article/${articleId}`,
            { method: 'POST' }
          );
          if (!res.ok) throw new Error('Failed to add like');
          const data = await res.json();
          setLikeCount(articleId, data.likeCount);
          return { success: true, likeCount: data.likeCount };
        }
      } catch (err) {
        // Revert optimistic update on error
        if (wasLiked) {
          addToStore(articleId);
          incrementLikeCount(articleId);
        } else {
          removeFromStore(articleId);
          decrementLikeCount(articleId);
        }
        console.error('Like toggle failed:', err);
        return { success: false, likeCount: getLikeCount(articleId) };
      }
    },
    [
      user?.id,
      isLiked,
      addToStore,
      removeFromStore,
      incrementLikeCount,
      decrementLikeCount,
      setLikeCount,
      getLikeCount,
    ]
  );

  // Initialize like count for an article
  const initLikeCount = useCallback(
    (articleId: string, count: number) => {
      if (likeCounts[articleId] === undefined) {
        setLikeCount(articleId, count);
      }
    },
    [likeCounts, setLikeCount]
  );

  return {
    likedIds,
    likeCounts,
    isLiked,
    toggleLike,
    getLikeCount,
    initLikeCount,
    fetchLikedIds,
  };
}
