'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Map, Star, RefreshCw, ChevronRight, Zap, Calculator } from 'lucide-react';
import { LEARNING_LESSONS, LEARNING_COURSES } from '@/lib/learn-content';
import {
  getAllProgress,
  getCourseCompletionPct,
  getDueReviews,
  getCourseProgress,
  type LessonProgress,
} from '@/lib/learn-progress';
import { SDG_LIST } from '@/lib/sdg';
import { toDisplay } from '@/lib/score';
import { useSMEData } from '@/hooks/useSMEData';
import { useLearningPath } from '@/hooks/useLearningPath';

type Tab = 'home' | 'skillmap' | 'path' | 'courses' | 'lessons';

function ProgressRing({ pct, size = 64, stroke = 5, color = '#00B5ED' }: {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
}) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(0.16, 1, 0.3, 1)' }}
      />
    </svg>
  );
}

export default function LearningHubPage() {
  const router = useRouter();
  const { scorecard } = useSMEData();
  const { path } = useLearningPath();
  const [tab, setTab] = useState<Tab>('home');
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  const [dueReviews, setDueReviews] = useState<string[]>([]);

  useEffect(() => {
    const current = getAllProgress();
    setProgress(current);
    setDueReviews(getDueReviews(LEARNING_LESSONS.map(l => l.id)));
  }, []);

  const totalLessons = LEARNING_LESSONS.length;
  const completedCount = Object.values(progress).filter(p => p.completed).length;
  const overallPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const recommended = useMemo(() => {
    if (!scorecard) return LEARNING_LESSONS.filter(l => !progress[l.id]?.completed).slice(0, 3);
    const lowSDGs = scorecard.sdgScores.filter(s => s.classification === 'Low').map(s => s.sdgId);
    const recs = LEARNING_LESSONS.filter(l => l.sdgId && lowSDGs.includes(l.sdgId) && !progress[l.id]?.completed);
    return (recs.length > 0 ? recs : LEARNING_LESSONS.filter(l => !progress[l.id]?.completed)).slice(0, 3);
  }, [scorecard, progress]);

  const goToLesson = (lessonId: string, courseId?: string, stepN?: number, totalN?: number) => {
    const params = new URLSearchParams();
    if (courseId) params.set('course', courseId);
    if (stepN !== undefined) params.set('step', String(stepN));
    if (totalN !== undefined) params.set('total', String(totalN));
    const suffix = params.toString();
    router.push(`/learning/lesson/${lessonId}${suffix ? `?${suffix}` : ''}`);
  };

  const tabs: { id: Tab | 'calculators'; label: string; icon: React.ElementType; href?: string }[] = [
    { id: 'home',        label: 'Home',        icon: BookOpen },
    { id: 'skillmap',    label: 'Skill map',   icon: Map },
    { id: 'path',        label: 'My path',     icon: Zap },
    { id: 'courses',     label: 'Courses',     icon: Star },
    { id: 'lessons',     label: 'All lessons', icon: BookOpen },
    { id: 'calculators', label: 'Calculators', icon: Calculator, href: '/learning/calculators' },
  ];

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 20px' }} className="animate-page-in">
      {dueReviews.length > 0 && (
        <div
          className="rounded-xl p-4 mb-5 flex items-center justify-between gap-4 animate-fade-in"
          style={{ background: 'rgba(0,181,237,0.06)', border: '1px solid rgba(0,181,237,0.2)' }}
        >
          <div className="flex items-center gap-3">
            <RefreshCw size={16} style={{ color: 'var(--sanlam-teal)' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {dueReviews.length} lesson{dueReviews.length > 1 ? 's' : ''} due for review
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Spaced repetition keeps knowledge fresh.
              </p>
            </div>
          </div>
          <button
            onClick={() => goToLesson(dueReviews[0])}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white flex-shrink-0"
            style={{ background: 'var(--sanlam-teal)' }}
          >
            Review now →
          </button>
        </div>
      )}

      <div
        className="flex gap-1 p-1 rounded-xl mb-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', overflowX: 'auto' }}
      >
        {tabs.map(({ id, label, icon: Icon, href }) => (
          <button
            key={id}
            onClick={() => href ? router.push(href) : setTab(id as Tab)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center"
            style={{
              background: tab === id ? 'var(--sanlam-navy)' : 'transparent',
              color: tab === id ? 'white' : 'var(--text-muted)',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'home' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {LEARNING_COURSES.map((course, ci) => {
              const pct = getCourseCompletionPct(course.id, course.lessons);
              const cert = getCourseProgress(course.id);
              return (
                <button
                  key={course.id}
                  className="card card-interactive p-5 text-center animate-card-in"
                  style={{ background: 'var(--surface)', animationDelay: `${ci * 60}ms` }}
                  onClick={() => router.push(`/learning/course/${course.id}`)}
                >
                  <div className="relative inline-block mb-3">
                    <ProgressRing pct={pct} size={72} stroke={6} color={course.color} />
                    <div className="absolute inset-0 flex items-center justify-center" style={{ fontSize: '20px' }}>
                      {course.icon}
                    </div>
                  </div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{course.title}</p>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{course.lessons.length} lessons | {course.estimatedTime}</p>
                  <p className="font-bold text-lg" style={{ color: course.color }}>{pct}%</p>
                  {cert && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: 'rgba(0,166,81,0.1)', color: '#00A651' }}>
                      Certificate earned
                    </span>
                  )}
                </button>
              );
            })}

            <div className="card p-5 text-center animate-card-in" style={{ background: 'var(--surface)', animationDelay: '120ms' }}>
              <div className="relative inline-block mb-3">
                <ProgressRing pct={overallPct} size={72} stroke={6} color="#00B5ED" />
                <div className="absolute inset-0 flex items-center justify-center" style={{ fontSize: '20px' }}>🎯</div>
              </div>
              <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>Overall progress</p>
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{completedCount} of {totalLessons} lessons</p>
              <p className="font-bold text-lg" style={{ color: 'var(--sanlam-teal)' }}>{overallPct}%</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Recommended for you
              <span className="ml-2 text-[11px] font-normal" style={{ color: 'var(--text-muted)' }}>
                Based on your lowest SDG scores
              </span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recommended.map((lesson, i) => (
                <button
                  key={lesson.id}
                  onClick={() => goToLesson(lesson.id)}
                  className="card card-interactive p-4 text-left animate-card-in"
                  style={{ background: 'var(--surface)', borderLeft: `4px solid ${lesson.color}`, animationDelay: `${i * 50}ms` }}
                >
                  <span className="text-xl mb-2 block">{lesson.icon}</span>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{lesson.title}</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{lesson.duration} | {lesson.difficulty}</p>
                </button>
              ))}
            </div>
          </div>

          {path && (
            <div className="card p-4 flex items-center justify-between gap-4" style={{ background: 'var(--surface)', borderTop: '3px solid var(--sanlam-teal)' }}>
              <div className="flex items-center gap-3">
                <Zap size={18} style={{ color: 'var(--sanlam-teal)' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Your AI path</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{path.goalStatement}</p>
                </div>
              </div>
              <button
                onClick={() => setTab('path')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold flex-shrink-0"
                style={{ background: 'rgba(0,181,237,0.1)', color: 'var(--sanlam-teal)' }}
              >
                Continue <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'skillmap' && (
        <div className="animate-fade-in">
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Each node shows your SDG score. Coloured rings show lesson completion.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {LEARNING_LESSONS.filter(l => l.sdgId).map((lesson, idx) => {
              const sdg = SDG_LIST.find(s => s.id === lesson.sdgId);
              const done = progress[lesson.id]?.completed;
              const sdgScore = scorecard?.sdgScores?.find(s => s.sdgId === lesson.sdgId);
              const sdgScoreColor = sdgScore
                ? sdgScore.score >= 2.4 ? '#00A651' : sdgScore.score >= 1.6 ? '#E8A020' : '#D0021B'
                : 'var(--text-muted)';

              return (
                <button
                  key={lesson.id}
                  onClick={() => goToLesson(lesson.id)}
                  className="card flex flex-col items-center gap-2 p-3 transition-all duration-150 animate-card-in"
                  style={{
                    background: 'var(--surface)',
                    border: `1px solid ${done ? `${sdg?.color}40` : 'var(--border)'}`,
                    animationDelay: `${idx * 30}ms`,
                  }}
                >
                  <div className="relative">
                    <ProgressRing pct={done ? 100 : 0} size={52} stroke={4} color={sdg?.color || '#00B5ED'} />
                    <div className="absolute inset-0 flex items-center justify-center text-xl">{sdg?.icon}</div>
                  </div>
                  <p className="text-[10px] font-semibold text-center leading-tight" style={{ color: 'var(--text-muted)' }}>
                    SDG {lesson.sdgId}
                  </p>
                  {sdgScore && (
                    <span className="text-[10px] font-bold" style={{ color: sdgScoreColor }}>
                      {toDisplay(sdgScore.score)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'path' && (
        <div className="animate-fade-in">
          {!path ? (
            <div className="card text-center py-12" style={{ background: 'var(--surface)' }}>
              <Zap size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No learning path yet</p>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Open Learning from the SME portal to generate your AI-powered path.</p>
              <button onClick={() => router.push('/dashboard')} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--sanlam-teal)' }}>
                Go to dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="card p-5" style={{ background: 'var(--surface)', borderTop: '3px solid var(--sanlam-teal)' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{path.goalStatement}</p>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{path.estimatedTime} | {path.lessons.length} lessons</p>
                <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(0,166,81,0.08)', color: '#00A651' }}>
                  {path.expectedImprovement}
                </div>
              </div>

              <div className="space-y-2">
                {path.lessons.map((pl, i) => {
                  const lesson = LEARNING_LESSONS.find(l => l.id === pl.lessonId);
                  const done = progress[pl.lessonId]?.completed;
                  const isNext = !done && path.lessons.slice(0, i).every(l => progress[l.lessonId]?.completed);

                  return (
                    <button
                      key={pl.lessonId}
                      onClick={() => lesson && goToLesson(lesson.id, undefined, i + 1, path.lessons.length)}
                      className="card w-full flex items-center gap-3 p-4 text-left transition-all"
                      style={{
                        background: isNext ? 'rgba(0,181,237,0.06)' : 'var(--surface)',
                        border: `1px solid ${isNext ? 'rgba(0,181,237,0.25)' : 'var(--border)'}`,
                        opacity: done ? 0.6 : 1,
                      }}
                    >
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 text-white" style={{ background: done ? '#00A651' : isNext ? 'var(--sanlam-teal)' : 'var(--border)' }}>
                        {done ? '✓' : i + 1}
                      </div>
                      <span className="text-lg flex-shrink-0">{lesson?.icon || '📖'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{pl.title}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{pl.reason}</p>
                      </div>
                      <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    </button>
                  );
                })}
              </div>

              {path.milestones?.length > 0 && (
                <div className="card p-4" style={{ background: 'var(--surface)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Milestones</p>
                  <div className="space-y-2">
                    {path.milestones.map((m, i) => {
                      const achieved = m.lessonsRequired.every(id => progress[id]?.completed);
                      return (
                        <div key={`${m.title}-${i}`} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: achieved ? 'rgba(0,166,81,0.08)' : 'var(--bg)' }}>
                          <span className="text-base">{achieved ? '🏅' : '🎯'}</span>
                          <div>
                            <p className="text-xs font-semibold" style={{ color: achieved ? '#00A651' : 'var(--text-primary)' }}>{m.title}</p>
                            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{m.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'courses' && (
        <div className="space-y-4 animate-fade-in">
          {LEARNING_COURSES.map((course, ci) => {
            const pct = getCourseCompletionPct(course.id, course.lessons);
            const lessons = course.lessons.map(id => LEARNING_LESSONS.find(l => l.id === id)!).filter(Boolean);
            const cert = getCourseProgress(course.id);

            return (
              <div key={course.id} className="card animate-card-in" style={{ background: 'var(--surface)', borderTop: `3px solid ${course.color}`, animationDelay: `${ci * 60}ms` }}>
                <div className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <ProgressRing pct={pct} size={56} stroke={5} color={course.color} />
                      <div className="absolute inset-0 flex items-center justify-center text-lg">{course.icon}</div>
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{course.title}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{course.lessons.length} lessons | {course.estimatedTime}</p>
                      {cert && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1" style={{ background: 'rgba(0,166,81,0.1)', color: '#00A651' }}>
                          Completed | ID: {cert.certificateId}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/learning/course/${course.id}`)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0"
                    style={{ background: `${course.color}15`, color: course.color, border: `1px solid ${course.color}30` }}
                  >
                    {pct === 100 ? 'Review' : pct > 0 ? 'Continue' : 'Start'}
                    <ChevronRight size={14} />
                  </button>
                </div>
                <div style={{ borderTop: '1px solid var(--border)' }}>
                  {lessons.map((lesson, li) => {
                    const done = progress[lesson.id]?.completed;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => goToLesson(lesson.id, course.id, li + 1, lessons.length)}
                        className="w-full flex items-center gap-3 px-5 py-3 text-left transition-all"
                        style={{ borderBottom: li < lessons.length - 1 ? '1px solid var(--border)' : 'none' }}
                      >
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0" style={{ background: done ? '#00A651' : `${lesson.color}20`, color: done ? 'white' : lesson.color }}>
                          {done ? '✓' : li + 1}
                        </div>
                        <span className="text-base flex-shrink-0">{lesson.icon}</span>
                        <p className="text-sm flex-1 min-w-0 truncate" style={{ color: 'var(--text-primary)' }}>{lesson.title}</p>
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{lesson.duration}</span>
                        <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'lessons' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
          {LEARNING_LESSONS.map((lesson, idx) => {
            const done = progress[lesson.id]?.completed;
            const score = progress[lesson.id]?.quizScore;
            return (
              <button
                key={lesson.id}
                onClick={() => goToLesson(lesson.id)}
                className="card card-interactive p-4 text-left animate-card-in"
                style={{
                  background: 'var(--surface)',
                  borderLeft: `4px solid ${lesson.color}`,
                  animationDelay: `${idx * 25}ms`,
                  opacity: done ? 0.75 : 1,
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{lesson.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{lesson.title}</p>
                      {done && <span className="text-[10px] font-semibold" style={{ color: '#00A651' }}>✓</span>}
                    </div>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{lesson.tagline}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{lesson.duration}</span>
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>|</span>
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{lesson.difficulty}</span>
                      {score !== undefined && (
                        <>
                          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>|</span>
                          <span className="text-[11px] font-semibold" style={{ color: score >= 67 ? '#00A651' : '#E8A020' }}>
                            Quiz: {score}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
