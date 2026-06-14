'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, Award, BookOpen } from 'lucide-react';
import SDGIcon from '@/components/sdg/SDGIcon';
import { LEARNING_COURSES, LEARNING_LESSONS } from '@/lib/learn-content';
import {
  getAllProgress,
  getCourseCompletionPct,
  completeCourse,
  getCourseProgress,
  type LessonProgress,
} from '@/lib/learn-progress';

export default function CourseOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const course = LEARNING_COURSES.find(c => c.id === courseId);
  const lessons = course?.lessons.map(id => LEARNING_LESSONS.find(l => l.id === id)!).filter(Boolean) || [];

  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  const [certId, setCertId] = useState<string | null>(null);
  const [justCertified, setJustCertified] = useState(false);

  useEffect(() => {
    setProgress(getAllProgress());
    const courseProgress = getCourseProgress(courseId);
    if (courseProgress?.certificateId) setCertId(courseProgress.certificateId);
  }, [courseId]);

  if (!course) {
    return <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Course not found</div>;
  }

  const pct = getCourseCompletionPct(courseId, course.lessons);
  const allDone = pct === 100;
  const nextLesson = lessons.find(l => !progress[l.id]?.completed);

  const handleCertificate = () => {
    const id = completeCourse(courseId);
    setCertId(id);
    setJustCertified(true);
  };

  const goLesson = (lessonId: string, index: number) => {
    router.push(`/learning/lesson/${lessonId}?course=${courseId}&step=${index + 1}&total=${lessons.length}`);
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 20px' }} className="animate-page-in">
      <div className="card p-6 mb-5" style={{ background: 'var(--surface)', borderTop: `3px solid ${course.color}` }}>
        <div className="flex items-start gap-4">
          <span className="flex-shrink-0">{course.icon ? <span className="text-4xl">{course.icon}</span> : <BookOpen size={40} style={{ color: course.color }} />}</span>
          <div className="flex-1">
            <h1 className="font-bold text-xl mb-1" style={{ color: 'var(--text-primary)' }}>
              {course.title}
            </h1>
            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>{course.description}</p>
            <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>{lessons.length} lessons</span>
              <span>|</span>
              <span>{course.estimatedTime}</span>
              <span>|</span>
              <span style={{ color: course.color, fontWeight: 600 }}>{pct}% complete</span>
            </div>
          </div>
        </div>

        <div className="mt-4 w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: course.color }} />
        </div>
      </div>

      {allDone && (
        <div
          className="card p-5 mb-5 flex items-center justify-between gap-4 animate-fade-in"
          style={{ background: 'rgba(0,166,81,0.06)', border: '1px solid rgba(0,166,81,0.2)' }}
        >
          <div className="flex items-center gap-3">
            <Award size={24} style={{ color: '#00A651' }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: '#00A651' }}>
                {justCertified ? 'Certificate earned!' : certId ? 'Course complete' : 'Ready for certificate'}
              </p>
              {certId ? (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Certificate ID: {certId}</p>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>You have completed all lessons in this course.</p>
              )}
            </div>
          </div>
          {!certId && (
            <button onClick={handleCertificate} className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex-shrink-0" style={{ background: '#00A651' }}>
              Claim certificate
            </button>
          )}
        </div>
      )}

      {nextLesson && (
        <button
          onClick={() => goLesson(nextLesson.id, lessons.indexOf(nextLesson))}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-xl text-white font-semibold text-sm mb-5 transition"
          style={{ background: 'var(--sanlam-teal)' }}
        >
          {pct === 0 ? 'Start course' : 'Continue learning'}
          <ChevronRight size={16} />
        </button>
      )}

      <div className="card" style={{ background: 'var(--surface)' }}>
        {lessons.map((lesson, li) => {
          const done = progress[lesson.id]?.completed;
          const score = progress[lesson.id]?.quizScore;
          const isNext = lesson.id === nextLesson?.id;

          return (
            <button
              key={lesson.id}
              onClick={() => goLesson(lesson.id, li)}
              className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all"
              style={{
                borderBottom: li < lessons.length - 1 ? '1px solid var(--border)' : 'none',
                background: isNext ? 'rgba(0,181,237,0.04)' : 'transparent',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = isNext ? 'rgba(0,181,237,0.04)' : 'transparent')}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: done ? '#00A651' : isNext ? 'var(--sanlam-teal)' : `${lesson.color}20`,
                  color: done || isNext ? 'white' : lesson.color,
                }}
              >
                {done ? '✓' : li + 1}
              </div>

              <span className="flex-shrink-0">{lesson.sdgId ? <SDGIcon sdgId={lesson.sdgId} size={24} /> : lesson.icon ? <span className="text-xl">{lesson.icon}</span> : <BookOpen size={20} style={{ color: lesson.color }} />}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{lesson.title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{lesson.duration}</span>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>|</span>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{lesson.difficulty}</span>
                  {score !== undefined && (
                    <span className="text-[11px] font-semibold" style={{ color: score >= 67 ? '#00A651' : '#E8A020' }}>
                      | Quiz {score}%
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
