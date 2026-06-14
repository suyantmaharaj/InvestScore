'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { MoreHorizontal, X, ChevronLeft, ChevronRight, CheckCircle, ExternalLink, BookOpen } from 'lucide-react';
import SDGIcon from '@/components/sdg/SDGIcon';
import { LEARNING_LESSONS, LEARNING_COURSES } from '@/lib/learn-content';
import { completeLesson, getLessonProgress, getCourseProgress, completeCourse } from '@/lib/learn-progress';

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const search = useSearchParams();

  const lessonId = params.id as string;
  const courseId = search.get('course') || null;
  const stepN = parseInt(search.get('step') || '1', 10);
  const totalN = parseInt(search.get('total') || '1', 10);

  const lesson = LEARNING_LESSONS.find(l => l.id === lessonId);
  const course = courseId ? LEARNING_COURSES.find(c => c.id === courseId) : null;
  const courseLessons = course?.lessons.map(id => LEARNING_LESSONS.find(l => l.id === id)!).filter(Boolean) || [];

  const [outlineOpen, setOutlineOpen] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [certEarned, setCertEarned] = useState(false);

  useEffect(() => {
    if (!lesson) return;
    const progress = getLessonProgress(lesson.id);
    setCompleted(!!progress?.completed);
    setQuizStarted(false);
    setCurrentQ(0);
    setAnswers({});
    setShowResults(false);
    setCertEarned(false);
    window.scrollTo(0, 0);
  }, [lesson?.id]);

  if (!lesson) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 56px)', color: 'var(--text-muted)' }}>
        Lesson not found
      </div>
    );
  }

  const quizScore = showResults && lesson.quiz.length > 0
    ? Math.round((lesson.quiz.filter((q, i) => answers[i] === q.correct).length / lesson.quiz.length) * 100)
    : 0;

  const handleComplete = (score: number) => {
    completeLesson(lesson.id, score);
    setCompleted(true);

    if (course) {
      const allDone = courseLessons.every(l => {
        if (l.id === lesson.id) return true;
        return !!getLessonProgress(l.id)?.completed;
      });
      if (allDone && !getCourseProgress(course.id)?.certificateId) {
        completeCourse(course.id);
        setCertEarned(true);
      }
    }
  };

  const goNext = () => {
    if (!course || stepN >= totalN) {
      router.push(course ? `/learning/course/${course.id}` : '/learning');
      return;
    }
    const nextLesson = courseLessons[stepN];
    if (nextLesson) router.push(`/learning/lesson/${nextLesson.id}?course=${courseId}&step=${stepN + 1}&total=${totalN}`);
    else router.push(`/learning/course/${courseId}`);
  };

  const goPrev = () => {
    if (stepN <= 1) {
      router.push(course ? `/learning/course/${courseId}` : '/learning');
      return;
    }
    const prevLesson = courseLessons[stepN - 2];
    if (prevLesson) router.push(`/learning/lesson/${prevLesson.id}?course=${courseId}&step=${stepN - 1}&total=${totalN}`);
  };

  const outlineLessons = courseLessons.length > 0 ? courseLessons : [lesson];

  return (
    <div style={{ minHeight: 'calc(100vh - 59px)', background: 'var(--bg)' }}>
      <button
        onClick={() => setOutlineOpen(true)}
        className="fixed z-30 flex items-center gap-1.5 rounded-full px-3 py-2 shadow-lg transition"
        style={{
          top: '72px',
          right: '20px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
        }}
      >
        <MoreHorizontal size={16} />
        <span className="text-xs font-medium">{course ? course.title : 'Outline'}</span>
      </button>

      {outlineOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setOutlineOpen(false)} />
          <div
            className="fixed right-0 top-0 h-full z-50 flex flex-col"
            style={{
              width: '280px',
              background: 'var(--surface)',
              borderLeft: '1px solid var(--border)',
              animation: 'slideInRight 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            <div className="flex items-center justify-between px-4 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{course?.title || 'Lesson outline'}</p>
                {course && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{stepN} of {totalN} lessons</p>}
              </div>
              <button onClick={() => setOutlineOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              {outlineLessons.map((item, i) => {
                const isCurrent = item.id === lesson.id;
                const isDone = !!getLessonProgress(item.id)?.completed;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setOutlineOpen(false);
                      if (!isCurrent) {
                        const suffix = courseId ? `?course=${courseId}&step=${i + 1}&total=${totalN}` : '';
                        router.push(`/learning/lesson/${item.id}${suffix}`);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition"
                    style={{ background: isCurrent ? 'rgba(0,181,237,0.08)' : 'transparent' }}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                      style={{
                        background: isDone ? '#00A651' : isCurrent ? 'var(--sanlam-teal)' : 'var(--border)',
                        color: isDone || isCurrent ? 'white' : 'var(--text-muted)',
                      }}
                    >
                      {isDone ? '✓' : i + 1}
                    </div>
                    <span className="flex-shrink-0">{item.sdgId ? <SDGIcon sdgId={item.sdgId} size={20} /> : item.icon ? <span className="text-sm">{item.icon}</span> : <BookOpen size={16} style={{ color: 'var(--text-muted)' }} />}</span>
                    <p className="text-xs flex-1 min-w-0 truncate font-medium" style={{ color: isCurrent ? 'var(--sanlam-teal)' : 'var(--text-muted)' }}>
                      {item.title}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="px-4 py-4 space-y-2 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
              {course && (
                <button
                  onClick={() => { setOutlineOpen(false); router.push(`/learning/course/${courseId}`); }}
                  className="w-full text-xs font-medium py-2 rounded-lg transition text-left px-3"
                  style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}
                >
                  ← Back to course overview
                </button>
              )}
              <button
                onClick={() => { setOutlineOpen(false); router.push('/learning'); }}
                className="w-full text-xs font-medium py-2 rounded-lg transition text-left px-3"
                style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}
              >
                ← Back to Learning Centre
              </button>
              <button
                onClick={() => { setOutlineOpen(false); router.push('/dashboard'); }}
                className="w-full text-xs font-medium py-2 rounded-lg transition text-left px-3"
                style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}
              >
                Exit to Dashboard
              </button>
            </div>
          </div>
        </>
      )}

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 20px 80px' }}>
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {lesson.sdgId && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: `${lesson.color}20`, color: lesson.color }}>
                SDG {lesson.sdgId}
              </span>
            )}
            <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              {lesson.difficulty}
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              {lesson.duration}
            </span>
            {completed && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,166,81,0.1)', color: '#00A651' }}>
                <CheckCircle size={12} /> Completed
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mb-2">
            <span className="flex-shrink-0">{lesson.sdgId ? <SDGIcon sdgId={lesson.sdgId} size={48} rounded /> : lesson.icon ? <span className="text-4xl">{lesson.icon}</span> : <BookOpen size={40} style={{ color: lesson.color }} />}</span>
            <div>
              <h1 className="font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>{lesson.title}</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{lesson.tagline}</p>
            </div>
          </div>
          <div className="w-full h-0.5 rounded-full mt-4" style={{ background: lesson.color, opacity: 0.3 }} />
        </div>

        {certEarned && (
          <div className="card p-4 mb-6 flex items-center gap-3 animate-card-in" style={{ background: 'rgba(0,166,81,0.08)', border: '1px solid rgba(0,166,81,0.3)' }}>
            <span className="text-2xl">🏅</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#00A651' }}>Certificate earned!</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>You completed {course?.title}. Visit the course page to view your certificate.</p>
            </div>
          </div>
        )}

        {lesson.videoUrl && (
          <div className="mb-6">
            <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9', background: 'var(--surface)' }}>
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
          </div>
        )}

        <section className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>What this measures</p>
          <p className="text-base leading-relaxed" style={{ color: 'var(--text-primary)', lineHeight: '1.8' }}>{lesson.what}</p>
        </section>

        <section className="rounded-2xl p-5 mb-6" style={{ background: `${lesson.color}0D`, border: `1px solid ${lesson.color}25` }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: lesson.color }}>Why it matters for South African SMEs</p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)', lineHeight: '1.8' }}>{lesson.why}</p>
        </section>

        <section className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>How to improve your score</p>
          <div className="space-y-3">
            {lesson.how.map((step, i) => (
              <div key={step} className="flex items-start gap-4">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white mt-0.5" style={{ background: lesson.color }}>
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)', lineHeight: '1.8' }}>{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl p-5 mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Example</p>
          <p className="text-sm leading-relaxed italic" style={{ color: 'var(--text-primary)', lineHeight: '1.8' }}>&quot;{lesson.example}&quot;</p>
        </section>

        <section className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>KPIs that feed into this goal</p>
          <div className="flex flex-wrap gap-2">
            {lesson.kpis.map(kpiId => (
              <span
                key={kpiId}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontFamily: 'monospace' }}
              >
                {kpiId}
              </span>
            ))}
          </div>
        </section>

        {lesson.quiz.length > 0 && (
          <div className="rounded-2xl overflow-hidden mb-8" style={{ border: '2px solid var(--border)' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>✏️ Knowledge check</p>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{lesson.quiz.length} questions</span>
            </div>

            <div className="p-5" style={{ background: 'var(--bg)' }}>
              {!quizStarted && !showResults && (
                <div className="text-center py-4">
                  <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Test your understanding before moving on.</p>
                  <button onClick={() => setQuizStarted(true)} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition" style={{ background: lesson.color }}>
                    Start quiz
                  </button>
                </div>
              )}

              {quizStarted && !showResults && (
                <div className="animate-fade-in">
                  <div className="flex items-center gap-2 mb-4">
                    {lesson.quiz.map((_, i) => (
                      <div key={i} className="flex-1 h-1.5 rounded-full" style={{ background: i < currentQ ? lesson.color : i === currentQ ? `${lesson.color}60` : 'var(--border)' }} />
                    ))}
                  </div>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Question {currentQ + 1} of {lesson.quiz.length}</p>
                  <p className="text-base font-medium mb-4" style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>{lesson.quiz[currentQ].question}</p>
                  <div className="space-y-2">
                    {lesson.quiz[currentQ].options.map((opt, i) => {
                      const answered = answers[currentQ] !== undefined;
                      const isSelected = answers[currentQ] === i;
                      const isCorrect = i === lesson.quiz[currentQ].correct;
                      let bg = 'var(--surface)';
                      let border = 'var(--border)';
                      let color = 'var(--text-primary)';
                      if (answered && isSelected && isCorrect) { bg = 'rgba(0,166,81,0.1)'; border = '#00A651'; color = '#00A651'; }
                      if (answered && isSelected && !isCorrect) { bg = 'rgba(208,2,27,0.08)'; border = '#D0021B'; color = '#D0021B'; }
                      if (answered && !isSelected && isCorrect) { bg = 'rgba(0,166,81,0.05)'; border = 'rgba(0,166,81,0.3)'; }

                      return (
                        <button
                          key={opt}
                          disabled={answered}
                          onClick={() => setAnswers(prev => ({ ...prev, [currentQ]: i }))}
                          className="w-full text-left px-4 py-3 rounded-xl text-sm transition"
                          style={{ background: bg, border: `1.5px solid ${border}`, color }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {answers[currentQ] !== undefined && (
                    <div className="animate-fade-in mt-4">
                      <p className="text-sm leading-relaxed p-4 rounded-xl mb-3" style={{ background: 'var(--surface)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {lesson.quiz[currentQ].explanation}
                      </p>
                      {currentQ < lesson.quiz.length - 1 ? (
                        <button onClick={() => setCurrentQ(q => q + 1)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: lesson.color }}>
                          Next question →
                        </button>
                      ) : (
                        <button onClick={() => setShowResults(true)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: '#00A651' }}>
                          See results →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {showResults && (
                <div className="text-center py-4 animate-fade-in">
                  <p className="text-4xl font-bold mb-2" style={{ color: quizScore >= 67 ? '#00A651' : '#E8A020' }}>{quizScore}%</p>
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    {lesson.quiz.filter((q, i) => answers[i] === q.correct).length} of {lesson.quiz.length} correct
                  </p>
                  <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
                    {quizScore >= 100 ? 'Perfect score!' : quizScore >= 67 ? 'Well done!' : 'Review the lesson and try again'}
                  </p>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <button
                      onClick={() => { setQuizStarted(false); setShowResults(false); setCurrentQ(0); setAnswers({}); }}
                      className="px-4 py-2 rounded-xl text-sm font-medium transition"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                    >
                      Retry
                    </button>
                    {quizScore >= 67 && !completed && (
                      <button onClick={() => handleComplete(quizScore)} className="px-5 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#00A651' }}>
                        Mark complete ✓
                      </button>
                    )}
                    {(completed || quizScore >= 67) && (
                      <button onClick={goNext} className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: lesson.color }}>
                        {stepN < totalN ? 'Next lesson' : 'Finish course'}
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {lesson.quiz.length === 0 && !completed && (
          <button onClick={() => handleComplete(100)} className="w-full h-12 rounded-xl text-white font-semibold text-sm mb-6" style={{ background: '#00A651' }}>
            <CheckCircle size={16} className="inline mr-2" />
            Mark lesson complete
          </button>
        )}

        <button
          onClick={() => router.push(`/coach?prompt=${encodeURIComponent(lesson.coachPrompt)}`)}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold mb-8 transition"
          style={{ background: `${lesson.color}12`, color: lesson.color, border: `1px solid ${lesson.color}30` }}
        >
          Ask Chase about this topic
          <ExternalLink size={14} />
        </button>

        {course && (
          <div className="flex items-center justify-between gap-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={goPrev}
              disabled={stepN <= 1}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-40"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              <ChevronLeft size={15} /> Previous
            </button>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{stepN} of {totalN}</span>
            <button onClick={goNext} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition" style={{ background: 'var(--sanlam-teal)' }}>
              {stepN >= totalN ? 'Finish' : 'Next'}
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
