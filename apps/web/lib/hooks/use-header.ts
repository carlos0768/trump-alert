'use client';

import { create } from 'zustand';
import type { ArticleFilters } from '@/lib/api';

interface HeaderState {
  filters: ArticleFilters;
  isRefetching: boolean;
  refetchFn: (() => void) | null;
  setFilters: (filters: ArticleFilters) => void;
  setRefetchFn: (fn: () => void) => void;
  setIsRefetching: (value: boolean) => void;
  triggerRefetch: () => void;
}

export const useHeaderStore = create<HeaderState>()((set, get) => ({
  filters: {},
  isRefetching: false,
  refetchFn: null,
  setFilters: (filters) => set({ filters }),
  setRefetchFn: (fn) => set({ refetchFn: fn }),
  setIsRefetching: (value) => set({ isRefetching: value }),
  triggerRefetch: () => {
    const { refetchFn } = get();
    if (refetchFn) {
      refetchFn();
    }
  },
}));
