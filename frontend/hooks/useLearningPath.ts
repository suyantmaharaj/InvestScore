'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';

export interface PathLesson {
  lessonId: string;
  title:    string;
  order:    number;
  reason:   string;
  priority: 'high' | 'medium' | 'low';
}

export interface PathMilestone {
  title:           string;
  description:     string;
  lessonsRequired: string[];
}

export interface LearningPath {
  companyId:           string;
  goal:                string | null;
  goalStatement:       string;
  estimatedTime:       string;
  expectedImprovement: string;
  milestones:          PathMilestone[];
  lessons:             PathLesson[];
  personalNote:        string;
  completedLessons:    string[];
  generatedAt:         string;
}

async function apiFetch(path: string, options?: RequestInit) {
  const { auth } = await import('@/lib/firebase');
  const token = await auth.currentUser?.getIdToken();
  if (!token) return null;

  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
}

export function useLearningPath() {
  const { user } = useAuth();
  const [path, setPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/api/learning/path/${user.companyId}`);
        if (!res) return;
        const json = await res.json();
        setPath(json.path);
      } catch (err) {
        console.error('Load learning path error:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.companyId]);

  const generatePath = useCallback(async (goal?: string) => {
    if (!user?.companyId) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await apiFetch('/api/learning/generate-path', {
        method: 'POST',
        body: JSON.stringify({ companyId: user.companyId, goal }),
      });
      if (!res) throw new Error('No response from learning service.');

      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Failed to generate path.');
      setPath(json.path);
    } catch (err: any) {
      setError(err.message || 'Failed to generate path.');
    } finally {
      setGenerating(false);
    }
  }, [user?.companyId]);

  const markLessonComplete = useCallback(async (lessonId: string) => {
    if (!user?.companyId || !path) return;
    try {
      const res = await apiFetch(`/api/learning/path/${user.companyId}/complete-lesson`, {
        method: 'POST',
        body: JSON.stringify({ lessonId }),
      });
      if (!res) return;
      const json = await res.json();
      setPath(prev => prev ? { ...prev, completedLessons: json.completedLessons } : prev);
    } catch (err) {
      console.error('Mark complete error:', err);
    }
  }, [user?.companyId, path]);

  const completedSet = useMemo(() => new Set(path?.completedLessons || []), [path?.completedLessons]);
  const completionPct = path?.lessons.length
    ? Math.round((completedSet.size / path.lessons.length) * 100)
    : 0;

  return {
    path,
    loading,
    generating,
    error,
    generatePath,
    markLessonComplete,
    completedSet,
    completionPct,
  };
}
