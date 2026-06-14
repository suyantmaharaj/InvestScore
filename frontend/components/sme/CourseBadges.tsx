'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Award, BookOpen } from 'lucide-react';
import { LEARNING_COURSES } from '@/lib/learn-content';
import { getCourseProgress, getCourseCompletionPct } from '@/lib/learn-progress';

interface BadgeData {
  courseId:  string;
  title:     string;
  icon:      string;
  color:     string;
  earned:    boolean;
  certId?:   string;
  earnedAt?: string;
  pct:       number;
}

export default function CourseBadges() {
  const router = useRouter();
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [newlyEarned, setNewlyEarned] = useState<Set<string>>(new Set());

  useEffect(() => {
    const data: BadgeData[] = LEARNING_COURSES.map(course => {
      const progress = getCourseProgress(course.id);
      const pct = getCourseCompletionPct(course.id, course.lessons);
      return {
        courseId: course.id,
        title: course.title,
        icon: course.icon,
        color: course.color,
        earned: !!progress?.certificateId,
        certId: progress?.certificateId,
        earnedAt: progress?.completedAt,
        pct,
      };
    });

    const now = Date.now();
    const fresh = new Set(
      data
        .filter(badge => badge.earned && badge.earnedAt && now - new Date(badge.earnedAt).getTime() < 60000)
        .map(badge => badge.courseId)
    );

    setBadges(data);
    setNewlyEarned(fresh);
  }, []);

  const earnedCount = badges.filter(badge => badge.earned).length;

  if (badges.length === 0) return null;

  return (
    <div className="card p-5" style={{ background: 'var(--surface)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award size={16} style={{ color: 'var(--sanlam-amber)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Learning Badges
          </p>
        </div>
        {earnedCount > 0 && (
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {earnedCount} of {badges.length} earned
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {badges.map((badge, idx) => {
          const isNew = newlyEarned.has(badge.courseId);

          return (
            <button
              key={badge.courseId}
              onClick={() => router.push(`/learning/course/${badge.courseId}`)}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200 ${
                isNew ? 'animate-bounce-in' : 'animate-card-in'
              }`}
              style={{
                background: badge.earned ? `${badge.color}12` : 'var(--bg)',
                border: `1.5px solid ${badge.earned ? `${badge.color}40` : 'var(--border)'}`,
                opacity: badge.earned ? 1 : 0.5,
                minWidth: '80px',
                animationDelay: `${idx * 60}ms`,
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                if (badge.earned) e.currentTarget.style.background = `${badge.color}20`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = badge.earned ? `${badge.color}12` : 'var(--bg)';
              }}
              title={badge.earned ? `${badge.title} - earned` : `${badge.title} - ${badge.pct}% complete`}
            >
              <div className="relative">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: badge.earned ? `${badge.color}20` : 'var(--border)',
                    border: `2px solid ${badge.earned ? badge.color : 'transparent'}`,
                  }}
                >
                  {badge.icon ? (
                    <span className="text-2xl">{badge.icon}</span>
                  ) : (
                    <BookOpen size={22} style={{ color: badge.earned ? badge.color : 'var(--text-muted)' }} />
                  )}
                </div>

                {badge.earned && (
                  <div
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ background: 'var(--sanlam-green)', border: '2px solid var(--surface)' }}
                  >
                    ✓
                  </div>
                )}

                {!badge.earned && badge.pct > 0 && (
                  <svg
                    width="56"
                    height="56"
                    className="absolute -inset-1 pointer-events-none"
                    style={{ transform: 'rotate(-90deg)' }}
                  >
                    <circle
                      cx="28"
                      cy="28"
                      r="25"
                      fill="none"
                      stroke={badge.color}
                      strokeWidth="2.5"
                      strokeDasharray={`${2 * Math.PI * 25}`}
                      strokeDashoffset={`${2 * Math.PI * 25 * (1 - badge.pct / 100)}`}
                      strokeLinecap="round"
                      opacity="0.5"
                      style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.16,1,0.3,1)' }}
                    />
                  </svg>
                )}

                {isNew && (
                  <div className="absolute -top-1 -right-1 text-sm animate-bounce" style={{ lineHeight: 1 }}>
                    ✨
                  </div>
                )}
              </div>

              <div className="text-center">
                <p
                  className="text-[11px] font-semibold leading-tight"
                  style={{ color: badge.earned ? badge.color : 'var(--text-muted)', maxWidth: '72px' }}
                >
                  {badge.title.split(' ').slice(0, 3).join(' ')}
                </p>
                {badge.earned ? (
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Earned ✓
                  </p>
                ) : badge.pct > 0 ? (
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {badge.pct}% done
                  </p>
                ) : (
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Not started
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {earnedCount === 0 && (
        <div className="mt-4 pt-4 flex items-center justify-between gap-3" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Complete a course to earn your first badge
          </p>
          <button
            onClick={() => router.push('/learning')}
            className="text-xs font-semibold hover:underline flex-shrink-0"
            style={{ color: 'var(--sanlam-teal)' }}
          >
            Start learning →
          </button>
        </div>
      )}
    </div>
  );
}
