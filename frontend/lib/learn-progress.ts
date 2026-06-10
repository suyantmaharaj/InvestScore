export interface LessonProgress {
  lessonId:      string;
  completed:     boolean;
  completedAt?:  string;
  quizScore?:    number;
  reviewDue?:    string;
  reviewCount:   number;
}

export interface CourseProgress {
  courseId:       string;
  completedAt?:   string;
  certificateId?: string;
}

interface ProgressStore {
  lessons: Record<string, LessonProgress>;
  courses: Record<string, CourseProgress>;
}

const STORAGE_KEY = 'investscore_learn_progress';
const INTERVALS = [1, 3, 7, 14, 30];

function load(): ProgressStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { lessons: {}, courses: {} };
  } catch {
    return { lessons: {}, courses: {} };
  }
}

function save(data: ProgressStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function completeLesson(lessonId: string, quizScore: number) {
  const data = load();
  const existing = data.lessons[lessonId];
  const reviewCount = existing?.reviewCount || 0;
  const intervalDays = INTERVALS[Math.min(reviewCount, INTERVALS.length - 1)];
  const reviewDue = new Date(Date.now() + intervalDays * 86400000).toISOString();

  data.lessons[lessonId] = {
    lessonId,
    completed: true,
    completedAt: existing?.completedAt || new Date().toISOString(),
    quizScore: Math.max(quizScore, existing?.quizScore || 0),
    reviewDue,
    reviewCount: reviewCount + 1,
  };

  save(data);
}

export function getLessonProgress(lessonId: string): LessonProgress | null {
  return load().lessons[lessonId] || null;
}

export function getAllProgress(): Record<string, LessonProgress> {
  return load().lessons;
}

export function getDueReviews(lessonIds: string[]): string[] {
  const data = load();
  const now = new Date().toISOString();
  return lessonIds.filter(id => {
    const progress = data.lessons[id];
    return progress?.completed && progress?.reviewDue && progress.reviewDue <= now;
  });
}

export function completeCourse(courseId: string): string {
  const data = load();
  const existing = data.courses[courseId];
  if (existing?.certificateId) return existing.certificateId;

  const certId = `CERT-${courseId.toUpperCase()}-${Date.now()}`;
  data.courses[courseId] = {
    courseId,
    completedAt: new Date().toISOString(),
    certificateId: certId,
  };
  save(data);
  return certId;
}

export function getCourseProgress(courseId: string): CourseProgress | null {
  return load().courses[courseId] || null;
}

export function getCourseCompletionPct(courseId: string, lessonIds: string[]): number {
  const data = load();
  const done = lessonIds.filter(id => data.lessons[id]?.completed).length;
  return lessonIds.length > 0 ? Math.round((done / lessonIds.length) * 100) : 0;
}
