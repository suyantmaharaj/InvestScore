'use client';

import { useAuth } from './useAuth';
import type { UserRole } from '@/types';

export function useRole(): { role: UserRole | null; loading: boolean } {
  const { user, loading } = useAuth();
  return { role: user?.role ?? null, loading };
}
