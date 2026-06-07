'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import type { UserRole } from '@/types';

export function useRole() {
  const { user, loading } = useAuth();
  const [role, setRole]   = useState<UserRole | null>(null);

  useEffect(() => {
    if (!user) {
      setRole(null);
      return;
    }
    user.getIdTokenResult().then((result) => {
      setRole((result.claims['role'] as UserRole) || 'sme');
    });
  }, [user]);

  return { role, loading };
}
