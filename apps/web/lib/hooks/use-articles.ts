'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import {
  fetchArticles,
  fetchArticle,
  fetchRelatedArticles,
  fetchTrumpIndex,
  fetchStockData,
  fetchTrendingTopics,
  fetchDailyStats,
  fetchSources,
  ArticleFilters,
} from '../api';

// Fetch articles with pagination
export function useArticles(filters?: ArticleFilters) {
  return useInfiniteQuery({
    queryKey: ['articles', filters],
    queryFn: ({ pageParam = 0 }) => fetchArticles(50, pageParam, filters),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length * 50 : undefined,
    refetchInterval: 30000, // Refetch every 30 seconds for live updates
  });
}

// Fetch single article
export function useArticle(id: string) {
  return useQuery({
    queryKey: ['article', id],
    queryFn: () => fetchArticle(id),
    enabled: !!id,
  });
}

// Fetch related articles
export function useRelatedArticles(id: string, limit = 5) {
  return useQuery({
    queryKey: ['relatedArticles', id, limit],
    queryFn: () => fetchRelatedArticles(id, limit),
    enabled: !!id,
  });
}

// Fetch Trump Index data
export function useTrumpIndex(date?: string) {
  return useQuery({
    queryKey: ['trumpIndex', date],
    queryFn: () => fetchTrumpIndex(date),
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}

// Fetch stock data
export function useStockData() {
  return useQuery({
    queryKey: ['stockData'],
    queryFn: fetchStockData,
    refetchInterval: 60000, // Refetch every minute
  });
}

// Fetch trending topics
export function useTrendingTopics(limit = 10) {
  return useQuery({
    queryKey: ['trendingTopics', limit],
    queryFn: () => fetchTrendingTopics(limit),
    refetchInterval: 300000,
  });
}

// Fetch daily stats
export function useDailyStats() {
  return useQuery({
    queryKey: ['dailyStats'],
    queryFn: fetchDailyStats,
    refetchInterval: 300000,
  });
}

// Fetch available sources
export function useSources() {
  return useQuery({
    queryKey: ['sources'],
    queryFn: fetchSources,
    staleTime: 3600000, // Consider stale after 1 hour
  });
}
