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
  fetchWeeklyStats,
  fetchAnalyticsOverview,
  fetchStorylines,
  fetchStorylineTimeline,
  fetchRecentStorylineUpdates,
  fetchExecutiveOrders,
  fetchRecentExecutiveOrders,
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

// Fetch weekly stats
export function useWeeklyStats() {
  return useQuery({
    queryKey: ['weeklyStats'],
    queryFn: fetchWeeklyStats,
    refetchInterval: 300000,
  });
}

// Fetch analytics overview
export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ['analyticsOverview'],
    queryFn: fetchAnalyticsOverview,
    refetchInterval: 300000,
  });
}

// Fetch all storylines
export function useStorylines(status?: string) {
  return useQuery({
    queryKey: ['storylines', status],
    queryFn: () => fetchStorylines(status),
    refetchInterval: 60000, // Refetch every minute
  });
}

// Fetch single storyline with timeline
export function useStorylineTimeline(id: string) {
  return useQuery({
    queryKey: ['storylineTimeline', id],
    queryFn: () => fetchStorylineTimeline(id),
    enabled: !!id,
  });
}

// Fetch recent storyline updates (for home feed)
export function useRecentStorylineUpdates(limit = 5) {
  return useQuery({
    queryKey: ['recentStorylineUpdates', limit],
    queryFn: () => fetchRecentStorylineUpdates(limit),
    refetchInterval: 60000,
  });
}

// Fetch executive orders with pagination
export function useExecutiveOrders(type?: string, limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['executiveOrders', type, limit, offset],
    queryFn: () => fetchExecutiveOrders(type, limit, offset),
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}

// Fetch recent executive orders (for sidebar widget)
export function useRecentExecutiveOrders(limit = 5) {
  return useQuery({
    queryKey: ['recentExecutiveOrders', limit],
    queryFn: () => fetchRecentExecutiveOrders(limit),
    refetchInterval: 300000,
  });
}
