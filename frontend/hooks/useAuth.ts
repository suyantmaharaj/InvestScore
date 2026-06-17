'use client';

import { useEffect, useState } from 'react';
import {
  inMemoryPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export interface AuthUser {
  uid:       string;
  email:     string;
  name:      string;
  role:      'sme' | 'pm' | 'admin';
  companyId?: string;
}

export function useAuth() {
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Refresh JWT so custom claims (role, companyId) are present before any
      // Firestore read — rules check request.auth.token.role, not the users doc
      await firebaseUser.getIdToken(true);

      const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (snap.exists()) {
        const data = snap.data();
        setUser({
          uid:       firebaseUser.uid,
          email:     firebaseUser.email || '',
          name:      data['name']      || '',
          role:      data['role']      || 'sme',
          companyId: data['companyId'] || undefined,
        });
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const login = async (email: string, password: string) => {
    await setPersistence(auth, inMemoryPersistence);
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return { user, loading, login, logout };
}
