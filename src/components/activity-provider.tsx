'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Activity } from '@/lib/catalog';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch('/api' + path, { cache: 'no-store', ...init });
  const body = await response.json().catch(() => null);
  if (!response.ok || body === null) throw new Error(body?.error ?? 'The marketplace could not complete this request. Please try again.');
  return body as T;
}

export function json(method: string, body: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export const errorText = (error: unknown) => error instanceof Error ? error.message : 'Please try again.';

const ActivityContext = createContext<{
  activity: Activity | null;
  error: string;
  refresh: () => Promise<void>;
  toggleFavorite: (id: string, saved: boolean) => Promise<void>;
} | null>(null);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const initial = useRef<Promise<void> | null>(null);

  const refresh = useCallback(async () => {
    const request = ++requestId.current;
    try {
      const data = await api<Activity>('/activity');
      if (request === requestId.current) {
        setActivity(data);
        setError('');
      }
    } catch (error) {
      if (request === requestId.current) setError(errorText(error));
    }
  }, []);

  useEffect(() => {
    initial.current ??= refresh();
    const interval = window.setInterval(() => { if (!document.hidden) void refresh(); }, 30_000);
    const onFocus = () => { void refresh(); };
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  async function toggleFavorite(id: string, saved: boolean) {
    await initial.current;
    await api('/favorites/' + id, json('PUT', { saved }));
    await refresh();
  }

  return <ActivityContext.Provider value={{ activity, error, refresh, toggleFavorite }}>{children}</ActivityContext.Provider>;
}

export function useActivity() {
  const context = useContext(ActivityContext);
  if (!context) throw new Error('ActivityProvider is required.');
  return context;
}
