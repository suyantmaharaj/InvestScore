// Auth helper functions — implementation coming in a future prompt

import { auth } from './firebase';

export const getCurrentUser = () => auth.currentUser;

export const getIdToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
};
