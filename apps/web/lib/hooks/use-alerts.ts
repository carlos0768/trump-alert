'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from './use-auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

export interface CreateAlertInput {
  keyword: string;
  minImpact: 'S' | 'A' | 'B' | 'C';
  notifyPush?: boolean;
  notifyEmail?: boolean;
  notifyDiscord?: boolean;
}

export interface UpdateAlertInput {
  keyword?: string;
  minImpact?: 'S' | 'A' | 'B' | 'C';
  notifyPush?: boolean;
  notifyEmail?: boolean;
  notifyDiscord?: boolean;
  isActive?: boolean;
}

async function fetchAlerts(userId: string): Promise<Alert[]> {
  const res = await fetch(`${API_URL}/api/alerts?userId=${userId}`);
  if (!res.ok) {
    throw new Error('Failed to fetch alerts');
  }
  return res.json();
}

async function createAlert(
  userId: string,
  data: CreateAlertInput
): Promise<Alert> {
  const res = await fetch(`${API_URL}/api/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, userId }),
  });
  if (!res.ok) {
    throw new Error('Failed to create alert');
  }
  return res.json();
}

async function updateAlert(id: string, data: UpdateAlertInput): Promise<Alert> {
  const res = await fetch(`${API_URL}/api/alerts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error('Failed to update alert');
  }
  return res.json();
}

async function deleteAlert(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/alerts/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Failed to delete alert');
  }
}

export function useAlerts() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const alertsQuery = useQuery({
    queryKey: ['alerts', user?.id],
    queryFn: () => (user ? fetchAlerts(user.id) : []),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAlertInput) =>
      user ? createAlert(user.id, data) : Promise.reject('Not authenticated'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', user?.id] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAlertInput }) =>
      updateAlert(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', user?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', user?.id] });
    },
  });

  return {
    alerts: alertsQuery.data ?? [],
    isLoading: alertsQuery.isLoading,
    error: alertsQuery.error,
    createAlert: createMutation.mutate,
    updateAlert: (id: string, data: UpdateAlertInput) =>
      updateMutation.mutate({ id, data }),
    deleteAlert: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
