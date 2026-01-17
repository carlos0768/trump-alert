'use client';

import { useState, useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface User {
  id: string;
  email: string;
  name: string | null;
  emailVerified: string | null;
  language: 'ja' | 'en';
  pushSubscription: unknown;
  discordWebhook: string | null;
}

export interface Alert {
  id: string;
  keyword: string;
  minImpact: 'S' | 'A' | 'B' | 'C';
  notifyPush: boolean;
  notifyEmail: boolean;
  notifyDiscord: boolean;
  isActive: boolean;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

export function useAuth() {
  const { user, isLoading, setUser, setLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  // Check if we have a stored user on mount
  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  const register = useCallback(
    async (email: string, name?: string) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Registration failed');
        }

        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Registration failed';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setLoading]
  );

  const login = useCallback(
    async (email: string) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Login failed');
        }

        // In development, we might get a token directly
        if (data.loginToken) {
          // Auto-verify for development
          await verifyToken(data.loginToken);
        }

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setLoading]
  );

  const verifyToken = useCallback(
    async (token: string) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_URL}/api/auth/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Verification failed');
        }

        // Fetch user data after verification
        if (data.email) {
          const userRes = await fetch(
            `${API_URL}/api/auth/user/email/${encodeURIComponent(data.email)}`
          );
          if (userRes.ok) {
            const userData = await userRes.json();
            setUser(userData);
          }
        }

        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Verification failed';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setUser]
  );

  const logout = useCallback(() => {
    setUser(null);
  }, [setUser]);

  const updateUser = useCallback(
    async (updates: Partial<User>) => {
      if (!user) return;

      try {
        const res = await fetch(`${API_URL}/api/auth/user/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!res.ok) {
          throw new Error('Failed to update user');
        }

        const updatedUser = await res.json();
        setUser(updatedUser);
        return updatedUser;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Update failed';
        setError(message);
        throw err;
      }
    },
    [user, setUser]
  );

  const savePushSubscription = useCallback(
    async (subscription: PushSubscription) => {
      if (!user) return;

      const res = await fetch(
        `${API_URL}/api/auth/user/${user.id}/push-subscription`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        }
      );

      if (!res.ok) {
        throw new Error('Failed to save push subscription');
      }

      const updatedUser = await res.json();
      setUser(updatedUser);
    },
    [user, setUser]
  );

  const saveDiscordWebhook = useCallback(
    async (webhookUrl: string) => {
      if (!user) return;

      const res = await fetch(
        `${API_URL}/api/auth/user/${user.id}/discord-webhook`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ webhookUrl }),
        }
      );

      if (!res.ok) {
        throw new Error('Failed to save Discord webhook');
      }

      const updatedUser = await res.json();
      setUser(updatedUser);
    },
    [user, setUser]
  );

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    register,
    login,
    verifyToken,
    logout,
    updateUser,
    savePushSubscription,
    saveDiscordWebhook,
  };
}
