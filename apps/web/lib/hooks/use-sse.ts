'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface SSEEvent {
  type: 'article' | 'alert' | 'stock' | 'heartbeat' | 'connected';
  data: unknown;
  timestamp: string;
}

export interface NewArticleEvent {
  id: string;
  title: string;
  source: string;
  impactLevel: string;
  sentiment: number | null;
  summary: string[] | null;
  publishedAt: string;
}

interface UseSSEOptions {
  onArticle?: (article: NewArticleEvent) => void;
  onAlert?: (alert: unknown) => void;
  onStock?: (stock: unknown) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  enabled?: boolean;
}

export function useSSE(options: UseSSEOptions = {}) {
  const {
    onArticle,
    onAlert,
    onStock,
    onConnect,
    onDisconnect,
    enabled = true,
  } = options;

  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`${API_URL}/api/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      onConnect?.();
    };

    eventSource.onmessage = (event) => {
      try {
        const parsed: SSEEvent = JSON.parse(event.data);
        setLastEvent(parsed);

        switch (parsed.type) {
          case 'article':
            onArticle?.(parsed.data as NewArticleEvent);
            // Invalidate articles query to trigger refetch
            queryClient.invalidateQueries({ queryKey: ['articles'] });
            break;

          case 'alert':
            onAlert?.(parsed.data);
            break;

          case 'stock':
            onStock?.(parsed.data);
            // Invalidate stock query
            queryClient.invalidateQueries({ queryKey: ['stockData'] });
            break;

          case 'connected':
            // Initial connection message
            break;

          case 'heartbeat':
            // Keep-alive, no action needed
            break;
        }
      } catch {
        console.error('Failed to parse SSE event:', event.data);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      onDisconnect?.();
      eventSource.close();

      // Reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    };
  }, [
    enabled,
    onArticle,
    onAlert,
    onStock,
    onConnect,
    onDisconnect,
    queryClient,
  ]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastEvent,
    reconnect: connect,
    disconnect,
  };
}
