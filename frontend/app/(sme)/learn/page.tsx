'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen, Search, Clock, ChevronRight,
  CheckCircle, Target, Zap, Sparkles,
  Loader2, RefreshCw, TrendingUp, Calculator,
} from 'lucide-react';
import {
  LEARNING_LESSONS, LEARNING_COURSES,
  LearningLesson,
} from '@/lib/learn-content';
import PageContext from '@/components/shared/PageContext';
import { useLearningPath } from '@/hooks/useLearningPath';

type TabType       = 'courses' | 'library' | 'calculators';
type DifficultyType = 'All' | 'Beginner' | 'Intermediate' | 'Advanced';

function useProgress() {
  const getCompleted = (): Set<string> => {
    try {
      const raw = localStorage.getItem('learn_completed');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  };

  const [completed, setCompleted] = useState<Set<string>>(getCompleted);

  const markComplete = (id: string) => {
    const next = new Set(completed);
    next.add(id);
    setCompleted(next);
    localStorage.setItem('learn_completed', JSON.stringify([...next]));
  };

  return { completed, markComplete };
}

function DifficultyBadge({ level }: { level: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    Beginner:     { bg: 'rgba(0,166,81,0.12)',   color: '#00A651' },
    Intermediate: { bg: 'rgba(232,160,32,0.12)', color: '#E8A020' },
    Advanced:     { bg: 'rgba(208,2,27,0.10)',   color: '#D0021B' },
  };
  const s = styles[level] || styles.Beginner;
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}
    >
      {level}
    </span>
  );
}

function LessonCard({
  lesson, completed, onOpen,
}: {
  lesson:    LearningLesson;
  completed: boolean;
  onOpen:    (l: LearningLesson) => void;
}) {
  return (
    <button
      onClick={() => onOpen(lesson)}
      className="card card-interactive w-full text-left p-5"
      style={{ background: 'var(--surface)', borderLeft: `4px solid ${lesson.color}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-2xl flex-shrink-0">{lesson.icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {lesson.title}
              </p>
              <DifficultyBadge level={lesson.difficulty} />
              {completed && (
                <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: '#00A651' }}>
                  <CheckCircle size={11} /> Done
                </span>
              )}
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{lesson.tagline}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                <Clock size={11} /> {lesson.duration}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {lesson.kpis.length} KPIs
              </span>
            </div>
          </div>
        </div>
        <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
      </div>
    </button>
  );
}

function LessonDrawer({
  lesson, completed, onClose, onComplete, onCoach,
}: {
  lesson:     LearningLesson;
  completed:  boolean;
  onClose:    () => void;
  onComplete: (id: string) => void;
  onCoach:    (prompt: string) => void;
}) {
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    setQuizStarted(false);
    setCurrentQ(0);
    setAnswers({});
    setShowResults(false);
  }, [lesson.id]);

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div
        className="fixed right-0 top-0 h-full w-full max-w-[460px] z-50 overflow-y-auto shadow-2xl"
        style={{
          background: 'var(--surface)',
          animation:  'slideInRight 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <div className="h-1.5 w-full" style={{ background: lesson.color }} />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{lesson.icon}</span>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {lesson.sdgId && (
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${lesson.color}20`, color: lesson.color }}
                    >
                      SDG {lesson.sdgId}
                    </span>
                  )}
                  <DifficultyBadge level={lesson.difficulty} />
                  <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    <Clock size={11} /> {lesson.duration}
                  </span>
                </div>
                <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                  {lesson.title}
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{lesson.tagline}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-sm px-3 py-1.5 rounded-lg transition flex-shrink-0"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              Close
            </button>
          </div>

          {/* What this measures */}
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Target size={14} style={{ color: lesson.color }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                What this measures
              </p>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              {lesson.what}
            </p>
          </section>

          {/* Video */}
          {lesson.videoUrl && (
            <section className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Watch
              </p>
              <div
                className="rounded-xl overflow-hidden"
                style={{ aspectRatio: '16/9', background: 'var(--bg)' }}
              >
                <iframe
                  width="100%"
                  height="100%"
                  src={lesson.videoUrl}
                  title={lesson.videoTitle || lesson.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ display: 'block' }}
                />
              </div>
            </section>
          )}

          {/* Why it matters */}
          <section
            className="mb-6 p-4 rounded-xl"
            style={{ background: `${lesson.color}10`, border: `1px solid ${lesson.color}25` }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: lesson.color }}>
              Why it matters for South African SMEs
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              {lesson.why}
            </p>
          </section>

          {/* How to improve */}
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} style={{ color: '#00A651' }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                How to improve your score
              </p>
            </div>
            <div className="space-y-2">
              {lesson.how.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 text-white"
                    style={{ background: lesson.color }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Example */}
          <section className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              Example
            </p>
            <div
              className="p-4 rounded-xl"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              <p className="text-sm leading-relaxed italic" style={{ color: 'var(--text-primary)' }}>
                "{lesson.example}"
              </p>
            </div>
          </section>

          {/* KPIs */}
          <section className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              KPIs that feed into this goal
            </p>
            <div className="flex flex-wrap gap-1.5">
              {lesson.kpis.map(kpiId => (
                <span
                  key={kpiId}
                  className="text-[11px] px-2 py-1 rounded-lg"
                  style={{
                    background: 'var(--bg)',
                    border:     '1px solid var(--border)',
                    color:      'var(--text-muted)',
                    fontFamily: 'monospace',
                  }}
                >
                  {kpiId}
                </span>
              ))}
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {completed ? (
              <div
                className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
                style={{ background: 'rgba(0,166,81,0.1)', color: '#00A651' }}
              >
                <CheckCircle size={15} /> Completed
              </div>
            ) : (
              <button
                onClick={() => onComplete(lesson.id)}
                className="w-full h-11 rounded-xl text-white font-semibold text-sm transition-all"
                style={{ background: '#00A651' }}
              >
                <CheckCircle size={15} className="inline mr-2" />
                Mark as complete
              </button>
            )}
            <button
              onClick={() => onCoach(lesson.coachPrompt)}
              className="w-full h-11 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: `${lesson.color}12`,
                color:       lesson.color,
                border:      `1px solid ${lesson.color}30`,
              }}
            >
              Ask AI Coach about this →
            </button>
          </div>

          {/* Knowledge check */}
          {lesson.quiz.length > 0 && (
            <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">✏️</span>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Knowledge Check
                </p>
              </div>

              {!quizStarted && !showResults && (
                <button
                  onClick={() => setQuizStarted(true)}
                  className="w-full h-10 rounded-xl text-sm font-semibold transition"
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                  }}
                >
                  Take 3-question quiz
                </button>
              )}

              {quizStarted && !showResults && (() => {
                const q = lesson.quiz[currentQ];
                const answered = answers[currentQ] !== undefined;
                return (
                  <div className="animate-fade-in">
                    <p className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>
                      Question {currentQ + 1} of {lesson.quiz.length}
                    </p>
                    <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                      {q.question}
                    </p>
                    <div className="space-y-2 mb-3">
                      {q.options.map((opt, i) => {
                        const isSelected = answers[currentQ] === i;
                        const isCorrect = i === q.correct;
                        let bg = 'var(--bg)';
                        let border = 'var(--border)';
                        let color = 'var(--text-primary)';
                        if (answered && isSelected && isCorrect) { bg = 'rgba(0,166,81,0.1)'; border = '#00A651'; color = '#00A651'; }
                        if (answered && isSelected && !isCorrect) { bg = 'rgba(208,2,27,0.08)'; border = '#D0021B'; color = '#D0021B'; }
                        if (answered && !isSelected && isCorrect) { bg = 'rgba(0,166,81,0.06)'; border = 'rgba(0,166,81,0.3)'; }

                        return (
                          <button
                            key={opt}
                            disabled={answered}
                            onClick={() => setAnswers(prev => ({ ...prev, [currentQ]: i }))}
                            className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition"
                            style={{ background: bg, border: `1px solid ${border}`, color }}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {answered && (
                      <div className="animate-fade-in">
                        <p className="text-xs italic mb-3 p-3 rounded-xl" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
                          {q.explanation}
                        </p>
                        {currentQ < lesson.quiz.length - 1 ? (
                          <button
                            onClick={() => setCurrentQ(prev => prev + 1)}
                            className="w-full h-9 rounded-xl text-xs font-semibold text-white transition"
                            style={{ background: 'var(--sanlam-teal)' }}
                          >
                            Next question →
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowResults(true)}
                            className="w-full h-9 rounded-xl text-xs font-semibold text-white transition"
                            style={{ background: '#00A651' }}
                          >
                            See results
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {showResults && (() => {
                const correct = lesson.quiz.filter((q, i) => answers[i] === q.correct).length;
                const pct = Math.round((correct / lesson.quiz.length) * 100);
                return (
                  <div className="text-center py-3 animate-fade-in">
                    <p className="text-2xl font-bold mb-1" style={{ color: pct >= 67 ? '#00A651' : '#E8A020' }}>
                      {correct}/{lesson.quiz.length}
                    </p>
                    <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                      {pct >= 100 ? 'Perfect!' : pct >= 67 ? 'Well done!' : 'Keep learning - try again'}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setQuizStarted(false); setShowResults(false); setCurrentQ(0); setAnswers({}); }}
                        className="flex-1 h-9 rounded-xl text-xs font-medium transition"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                      >
                        Retry
                      </button>
                      {pct >= 67 && (
                        <button
                          onClick={() => onComplete(lesson.id)}
                          className="flex-1 h-9 rounded-xl text-xs font-semibold text-white transition"
                          style={{ background: '#00A651' }}
                        >
                          Mark complete ✓
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function LearnPage() {
  const router = useRouter();
  const { completed, markComplete } = useProgress();
  const {
    path, loading: pathLoading, generating, error: pathError,
    generatePath, markLessonComplete, completedSet, completionPct,
  } = useLearningPath();

  const [activeTab,  setActiveTab]  = useState<TabType>('courses');
  const [search,     setSearch]     = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyType>('All');
  const [openLesson, setOpenLesson] = useState<LearningLesson | null>(null);
  const [customGoal, setCustomGoal] = useState('');
  const [showGoalInput, setShowGoalInput] = useState(false);

  useEffect(() => {
    if (!pathLoading && !path && !generating) {
      generatePath();
    }
  }, [pathLoading, path, generating, generatePath]);

  const combinedCompleted = useMemo(() => {
    const next = new Set(completed);
    completedSet.forEach(id => next.add(id));
    return next;
  }, [completed, completedSet]);

  const filteredLibrary = useMemo(() => {
    return LEARNING_LESSONS.filter(l => {
      if (difficulty !== 'All' && l.difficulty !== difficulty) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          l.title.toLowerCase().includes(q) ||
          l.tagline.toLowerCase().includes(q) ||
          l.kpis.some(k => k.includes(q))
        );
      }
      return true;
    });
  }, [search, difficulty]);

  const totalLessons   = LEARNING_LESSONS.length;
  const completedCount = [...combinedCompleted].filter(id => LEARNING_LESSONS.find(l => l.id === id)).length;
  const progressPct    = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const handleCoach = (prompt: string) => {
    setOpenLesson(null);
    router.push(`/coach?prompt=${encodeURIComponent(prompt)}`);
  };

  const handleComplete = (id: string) => {
    markComplete(id);
    markLessonComplete(id);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-page-in">

      <PageContext>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Progress: <strong style={{ color: 'var(--text-primary)' }}>
            {completedCount} of {totalLessons} lessons
          </strong>
        </span>
        <div className="w-px h-4" style={{ background: 'var(--border)' }} />
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%`, background: 'var(--sanlam-teal)' }}
            />
          </div>
          <span className="text-xs font-medium" style={{ color: 'var(--sanlam-teal)' }}>
            {progressPct}%
          </span>
        </div>
      </PageContext>

      {/* Hero */}
      <div
        className="card p-6 flex items-center justify-between gap-6 flex-wrap"
        style={{ background: 'var(--sanlam-navy)' }}
      >
        <div>
          <p className="text-white font-bold text-lg mb-1">INvestScore Learning Centre</p>
          <p className="text-white/70 text-sm">
            Understand your SDG scores, learn how to improve, and become a more impactful business.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-white font-bold text-2xl">{totalLessons}</p>
            <p className="text-white/50 text-xs">Lessons</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-2xl">{LEARNING_COURSES.length}</p>
            <p className="text-white/50 text-xs">Courses</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-2xl" style={{ color: 'var(--sanlam-teal)' }}>{progressPct}%</p>
            <p className="text-white/50 text-xs">Complete</p>
          </div>
        </div>
      </div>

      {/* AI Learning Path */}
      <div
        className="card p-5"
        style={{
          background: 'var(--surface)',
          borderTop: '3px solid var(--sanlam-teal)',
        }}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: 'var(--sanlam-teal)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Your AI Learning Path
            </p>
          </div>
          <div className="flex items-center gap-2">
            {path && (
              <button
                onClick={() => setShowGoalInput(!showGoalInput)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg transition"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              >
                New goal
              </button>
            )}
            {path && (
              <button
                onClick={() => generatePath(customGoal || undefined)}
                disabled={generating}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition"
                style={{ background: 'rgba(0,181,237,0.1)', color: 'var(--sanlam-teal)', border: '1px solid rgba(0,181,237,0.2)' }}
              >
                <RefreshCw size={12} className={generating ? 'animate-spin' : ''} />
                Regenerate
              </button>
            )}
          </div>
        </div>

        {showGoalInput && (
          <div className="flex gap-2 mb-4 animate-fade-in">
            <input
              type="text"
              value={customGoal}
              onChange={e => setCustomGoal(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && customGoal.trim()) {
                  generatePath(customGoal);
                  setShowGoalInput(false);
                }
              }}
              placeholder="e.g. Improve my B-BBEE score, get to Level 2"
              className="flex-1 h-10 px-3 rounded-xl text-sm focus:outline-none focus:ring-2"
              style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }}
            />
            <button
              onClick={() => {
                if (customGoal.trim()) {
                  generatePath(customGoal);
                  setShowGoalInput(false);
                }
              }}
              disabled={!customGoal.trim() || generating}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50"
              style={{ background: 'var(--sanlam-teal)' }}
            >
              Generate
            </button>
          </div>
        )}

        {generating && (
          <div className="flex items-center gap-3 py-6 justify-center animate-fade-in">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--sanlam-teal)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Analysing your scores and building your personalised path...
            </p>
          </div>
        )}

        {path && !generating && (
          <div className="animate-fade-in">
            <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
              {path.goalStatement}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {[
                { icon: Clock, value: path.estimatedTime, label: 'Total time' },
                { icon: Target, value: `${path.lessons.length} lessons`, label: 'Lessons' },
                { icon: TrendingUp, value: `${completionPct}%`, label: 'Complete' },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="text-center p-3 rounded-xl" style={{ background: 'var(--bg)' }}>
                  <Icon size={16} className="mx-auto mb-1" style={{ color: 'var(--sanlam-teal)' }} />
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{value}</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
                </div>
              ))}
            </div>

            <div
              className="p-3 rounded-xl mb-4 text-xs"
              style={{ background: 'rgba(0,166,81,0.08)', border: '1px solid rgba(0,166,81,0.2)' }}
            >
              <span className="font-semibold" style={{ color: '#00A651' }}>Expected outcome: </span>
              <span style={{ color: 'var(--text-primary)' }}>{path.expectedImprovement}</span>
            </div>

            <p className="text-xs italic mb-4" style={{ color: 'var(--text-muted)' }}>
              &quot;{path.personalNote}&quot;
            </p>

            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
                <span>Progress</span>
                <span>{completedSet.size} of {path.lessons.length} done</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${completionPct}%`, background: 'var(--sanlam-teal)' }}
                />
              </div>
            </div>

            <div className="space-y-2">
              {path.lessons.map((pl, i) => {
                const lesson = LEARNING_LESSONS.find(l => l.id === pl.lessonId);
                const isDone = completedSet.has(pl.lessonId);
                const isNext = !isDone && path.lessons.slice(0, i).every(l => completedSet.has(l.lessonId));
                const priorityColor = pl.priority === 'high' ? '#D0021B' : pl.priority === 'medium' ? '#E8A020' : 'var(--text-muted)';

                return (
                  <button
                    key={pl.lessonId}
                    onClick={() => lesson && setOpenLesson(lesson)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                    style={{
                      background: isNext ? 'rgba(0,181,237,0.06)' : 'var(--bg)',
                      border: isNext ? '1px solid rgba(0,181,237,0.25)' : '1px solid var(--border)',
                      opacity: isDone ? 0.6 : 1,
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{
                        background: isDone ? '#00A651' : isNext ? 'var(--sanlam-teal)' : 'var(--border)',
                        color: isDone || isNext ? 'white' : 'var(--text-muted)',
                      }}
                    >
                      {isDone ? '✓' : i + 1}
                    </div>
                    <span className="text-lg flex-shrink-0">{lesson?.icon || '📖'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{pl.title}</p>
                      <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{pl.reason}</p>
                    </div>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ background: `${priorityColor}15`, color: priorityColor }}
                    >
                      {pl.priority}
                    </span>
                  </button>
                );
              })}
            </div>

            {path.milestones.length > 0 && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                  Milestones
                </p>
                <div className="space-y-2">
                  {path.milestones.map((m, i) => {
                    const achieved = m.lessonsRequired.every(id => completedSet.has(id));
                    return (
                      <div
                        key={`${m.title}-${i}`}
                        className="flex items-start gap-3 p-3 rounded-xl"
                        style={{
                          background: achieved ? 'rgba(0,166,81,0.08)' : 'var(--bg)',
                          border: `1px solid ${achieved ? 'rgba(0,166,81,0.2)' : 'var(--border)'}`,
                        }}
                      >
                        <span className="text-base flex-shrink-0">{achieved ? '🏅' : '🎯'}</span>
                        <div>
                          <p className="text-xs font-semibold" style={{ color: achieved ? '#00A651' : 'var(--text-primary)' }}>
                            {m.title}
                          </p>
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

        {pathError && (
          <p className="text-xs" style={{ color: '#D0021B' }}>{pathError}</p>
        )}
      </div>

      {/* Tab toggle */}
      <div
        className="flex gap-1 p-1 rounded-xl"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
      >
        {([
          { key: 'courses', label: '📘 Courses'           },
          { key: 'library', label: '📚 Reference Library' },
          { key: 'calculators', label: '🧮 Calculators' },
        ] as { key: TabType; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
            style={{
              background: activeTab === key ? 'var(--sanlam-navy)' : 'transparent',
              color:      activeTab === key ? 'white'               : 'var(--text-muted)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Courses tab */}
      {activeTab === 'courses' && (
        <div className="space-y-6 animate-fade-in">
          {LEARNING_COURSES.map((course, ci) => {
            const lessons   = course.lessons.map(id => LEARNING_LESSONS.find(l => l.id === id)!).filter(Boolean);
            const doneCount = lessons.filter(l => combinedCompleted.has(l.id)).length;
            const coursePct = lessons.length > 0 ? Math.round((doneCount / lessons.length) * 100) : 0;

            return (
              <div
                key={course.id}
                className="card animate-card-in"
                style={{
                  background:     'var(--surface)',
                  animationDelay: `${ci * 80}ms`,
                  borderTop:      `3px solid ${course.color}`,
                }}
              >
                <div className="p-5 pb-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{course.icon}</span>
                      <div>
                        <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                          {course.title}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                            <Clock size={11} /> {course.estimatedTime}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {lessons.length} lessons
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-lg" style={{ color: course.color }}>{coursePct}%</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {doneCount}/{lessons.length} done
                      </p>
                    </div>
                  </div>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                    {course.description}
                  </p>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${coursePct}%`, background: course.color }}
                    />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)' }}>
                  {lessons.map((lesson, li) => (
                    <button
                      key={lesson.id}
                      onClick={() => setOpenLesson(lesson)}
                      className="w-full flex items-center gap-4 px-5 py-3.5 text-left transition-all duration-150"
                      style={{ borderBottom: li < lessons.length - 1 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                        style={{
                          background: combinedCompleted.has(lesson.id) ? '#00A651' : `${lesson.color}20`,
                          color:      combinedCompleted.has(lesson.id) ? 'white'   : lesson.color,
                        }}
                      >
                        {combinedCompleted.has(lesson.id) ? '✓' : li + 1}
                      </div>
                      <span className="text-lg flex-shrink-0">{lesson.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{lesson.title}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{lesson.tagline}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <DifficultyBadge level={lesson.difficulty} />
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{lesson.duration}</span>
                        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Library tab */}
      {activeTab === 'library' && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search lessons, KPIs..."
                className="h-9 pl-8 pr-3 rounded-xl text-sm w-full focus:outline-none"
                style={{
                  background: 'var(--surface)',
                  border:     '1.5px solid var(--border)',
                  color:      'var(--text-primary)',
                }}
              />
            </div>
            <div className="flex gap-1">
              {(['All', 'Beginner', 'Intermediate', 'Advanced'] as DifficultyType[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className="px-3 py-1.5 text-xs rounded-lg border font-medium transition-all"
                  style={{
                    background:  difficulty === d ? 'var(--sanlam-teal)' : 'var(--surface)',
                    color:       difficulty === d ? 'white'               : 'var(--text-muted)',
                    borderColor: difficulty === d ? 'var(--sanlam-teal)' : 'var(--border)',
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {filteredLibrary.some(l => l.sdgId) && (
            <div>
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>SDG Goals</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredLibrary.filter(l => l.sdgId).map(lesson => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    completed={combinedCompleted.has(lesson.id)}
                    onOpen={setOpenLesson}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredLibrary.some(l => l.category) && (
            <div>
              <p className="text-sm font-semibold mb-3 mt-2" style={{ color: 'var(--text-primary)' }}>KPI Categories</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredLibrary.filter(l => l.category).map(lesson => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    completed={combinedCompleted.has(lesson.id)}
                    onOpen={setOpenLesson}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredLibrary.length === 0 && (
            <div className="card p-12 text-center" style={{ background: 'var(--surface)' }}>
              <p className="text-4xl mb-3">📭</p>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No lessons found</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Try a different search term or filter.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'calculators' && (
        <div className="card p-6 flex items-center justify-between gap-4 flex-wrap animate-fade-in" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center gap-3">
            <Calculator size={22} style={{ color: 'var(--sanlam-teal)' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Practice calculators
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Scope 2 emissions, recycling rate, and B-BBEE ownership calculations.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/learn/calculators')}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition"
            style={{ background: 'var(--sanlam-teal)' }}
          >
            Open calculators
          </button>
        </div>
      )}

      {openLesson && (
        <LessonDrawer
          lesson={openLesson}
          completed={combinedCompleted.has(openLesson.id)}
          onClose={() => setOpenLesson(null)}
          onComplete={handleComplete}
          onCoach={handleCoach}
        />
      )}
    </div>
  );
}
