import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  hasSupabaseAdminEnv,
  hasSupabasePublicEnv
} from "@/lib/supabase/server";
import { isAdminRole, type AppSession } from "@/lib/demo-session";

export type CatalogCourse = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  category: string;
  level: string;
  thumbnailUrl: string | null;
  instructorName: string;
  priceInCents: number;
  status: string;
  lessonCount: number;
  lessonPreview: {
    id: string;
    title: string;
    durationMinutes: number;
  }[];
  isEnrolled: boolean;
  enrollmentStatus: string | null;
};

export type CourseLessonDetail = {
  id: string;
  title: string;
  slug: string;
  description: string;
  position: number;
  durationMinutes: number;
  videoUrl: string;
  status: string;
  material: {
    title: string;
    type: string;
    url: string;
    summary: string | null;
  } | null;
  quiz: {
    title: string;
    description: string | null;
    questionCount: number;
    timeLimitMinutes: number;
    passPercentage: number;
  } | null;
};

export type CourseDetail = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  level: string;
  instructorName: string;
  thumbnailUrl: string | null;
  priceInCents: number;
  status: string;
  isEnrolled: boolean;
  lessons: CourseLessonDetail[];
};

export type AdminLesson = {
  id: string;
  title: string;
  position: number;
  status: string;
  description: string;
  durationMinutes: number;
  videoUrl: string;
  material: { id: string; title: string; type: string; url: string; summary: string | null } | null;
  quiz: { id: string; title: string; description: string | null; questionCount: number; timeLimitMinutes: number; passPercentage: number } | null;
};

export type AdminCourseSummary = {
  id: string;
  clientId: string;
  clientName: string | null;
  slug: string;
  title: string;
  status: string;
  lessons: AdminLesson[];
  lessonCount: number;
  enrollmentCount: number;
  updatedAt: string;
};

export type DashboardStat = {
  label: string;
  value: number;
  delta?: string;
  tone: "positive" | "neutral";
  suffix?: string;
};

export type DashboardOverview = {
  stats: DashboardStat[];
  revenueSeries: { name: string; revenue: number; learners: number }[];
  cohortSeries: { name: string; completion: number; engagement: number }[];
  activityFeed: { id: string; title: string; detail: string; time: string }[];
};

export async function getCatalogCourses(session: AppSession): Promise<CatalogCourse[]> {
  if (!hasSupabasePublicEnv()) return [];
  if (!session.activeClient) return [];

  try {
    const canPreviewDrafts = isAdminRole(session.user.role) && hasSupabaseAdminEnv();
    const supabase = canPreviewDrafts ? createSupabaseAdminClient() : createSupabaseServerClient();
    let courseQuery = supabase
      .from("courses")
      .select(
        "id, slug, title, short_description, category, level, thumbnail_url, instructor_name, price_in_cents, status, lessons(id, title, duration_minutes, position)"
      )
      .eq("client_id", session.activeClient.id)
      .order("updated_at", { ascending: false })
      .order("position", { foreignTable: "lessons", ascending: true });

    if (!canPreviewDrafts) {
      courseQuery = courseQuery.eq("status", "PUBLISHED");
    }

    const { data: courseRows, error: courseError } = await courseQuery;

    if (courseError) throw courseError;

    const courses = (courseRows ?? []) as Array<Record<string, any>>;
    const courseIds = courses.map((course) => course.id);
    let enrollmentMap = new Map<string, string>();

    if (courseIds.length && hasSupabaseAdminEnv()) {
      const adminSupabase = createSupabaseAdminClient();
      const { data: enrollmentRows, error: enrollmentError } = await adminSupabase
        .from("enrollments")
        .select("course_id, status")
        .eq("user_id", session.user.id)
        .eq("client_id", session.activeClient.id)
        .in("course_id", courseIds);

      if (!enrollmentError) {
        enrollmentMap = new Map(
          ((enrollmentRows ?? []) as Array<Record<string, any>>).map((row) => [
            row.course_id as string,
            row.status as string
          ])
        );
      }
    }

    return courses.map((course) => ({
      id: course.id,
      slug: course.slug,
      title: course.title,
      shortDescription: course.short_description,
      category: course.category,
      level: course.level,
      thumbnailUrl: course.thumbnail_url,
      instructorName: course.instructor_name,
      priceInCents: course.price_in_cents,
      status: course.status,
      lessonCount: (course.lessons ?? []).length,
      lessonPreview: ((course.lessons ?? []) as Array<Record<string, any>>).slice(0, 3).map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        durationMinutes: lesson.duration_minutes
      })),
      isEnrolled: enrollmentMap.has(course.id),
      enrollmentStatus: enrollmentMap.get(course.id) ?? null
    }));
  } catch {
    return [];
  }
}

export async function getCourseBySlug(slug: string, session: AppSession): Promise<CourseDetail | null> {
  if (!hasSupabasePublicEnv()) return null;
  if (!session.activeClient) return null;

  const canPreviewDrafts = isAdminRole(session.user.role) && hasSupabaseAdminEnv();
  const supabase = canPreviewDrafts ? createSupabaseAdminClient() : createSupabaseServerClient();

  // Try with lesson status column first; fall back without it if schema cache is stale
  const selectWithStatus =
    "id, slug, title, short_description, description, category, level, instructor_name, thumbnail_url, price_in_cents, status, lessons(id, title, slug, description, position, duration_minutes, video_url, status, lesson_materials(id, title, type, url, summary), lesson_quizzes(id, title, description, question_count, time_limit_minutes, pass_percentage))";
  const selectWithoutStatus =
    "id, slug, title, short_description, description, category, level, instructor_name, thumbnail_url, price_in_cents, status, lessons(id, title, slug, description, position, duration_minutes, video_url, lesson_materials(id, title, type, url, summary), lesson_quizzes(id, title, description, question_count, time_limit_minutes, pass_percentage))";

  let course: Record<string, any> | null = null;
  let hasLessonStatus = true;

  try {
    const { data, error } = await supabase
      .from("courses")
      .select(selectWithStatus)
      .eq("slug", slug)
      .eq("client_id", session.activeClient.id)
      .maybeSingle();
    if (error) throw error;
    course = data as Record<string, any> | null;
  } catch {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select(selectWithoutStatus)
        .eq("slug", slug)
        .eq("client_id", session.activeClient.id)
        .maybeSingle();
      if (error) throw error;
      course = data as Record<string, any> | null;
      hasLessonStatus = false;
    } catch {
      return null;
    }
  }

  if (!course) return null;

  try {
    let isEnrolled = false;
    if (hasSupabaseAdminEnv()) {
      const adminSupabase = createSupabaseAdminClient();
      const { data: enrollmentRows } = await adminSupabase
        .from("enrollments")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("client_id", session.activeClient.id)
        .eq("course_id", course.id)
        .limit(1);
      isEnrolled = Boolean(enrollmentRows?.length);
    }

    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      shortDescription: course.short_description,
      description: course.description,
      category: course.category,
      level: course.level,
      instructorName: course.instructor_name,
      thumbnailUrl: course.thumbnail_url,
      priceInCents: course.price_in_cents,
      status: course.status,
      isEnrolled,
      lessons: ((course.lessons ?? []) as Array<Record<string, any>>)
        .filter((lesson) => !hasLessonStatus || canPreviewDrafts || lesson.status === "PUBLISHED")
        .sort((a, b) => a.position - b.position)
        .map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          slug: lesson.slug,
          description: lesson.description,
          position: lesson.position,
          durationMinutes: lesson.duration_minutes,
          videoUrl: lesson.video_url,
          status: lesson.status ?? "DRAFT",
          material: normalizeSingleRelation(lesson.lesson_materials)
            ? {
                title: normalizeSingleRelation(lesson.lesson_materials)!.title,
                type: normalizeSingleRelation(lesson.lesson_materials)!.type,
                url: normalizeSingleRelation(lesson.lesson_materials)!.url,
                summary: normalizeSingleRelation(lesson.lesson_materials)!.summary
              }
            : null,
          quiz: normalizeSingleRelation(lesson.lesson_quizzes)
            ? {
                title: normalizeSingleRelation(lesson.lesson_quizzes)!.title,
                description: normalizeSingleRelation(lesson.lesson_quizzes)!.description,
                questionCount: normalizeSingleRelation(lesson.lesson_quizzes)!.question_count,
                timeLimitMinutes: normalizeSingleRelation(lesson.lesson_quizzes)!.time_limit_minutes,
                passPercentage: normalizeSingleRelation(lesson.lesson_quizzes)!.pass_percentage
              }
            : null
        }))
    };
  } catch {
    return null;
  }
}

export async function getAdminCourseSummaries(session: AppSession): Promise<AdminCourseSummary[]> {
  if (!hasSupabaseAdminEnv() || !isAdminRole(session.user.role) || !session.activeClient) return [];

  try {
    const supabase = createSupabaseAdminClient();

    // Try with lesson status; fall back without it if schema cache is stale
    let courses: Array<Record<string, any>> = [];
    let hasLessonStatus = true;

    const { data: dataWithStatus, error: errWithStatus } = await supabase
      .from("courses")
      .select("id, client_id, clients(name), slug, title, status, updated_at, lessons(id, title, position, status, description, duration_minutes, video_url, lesson_materials(id, title, type, url, summary), lesson_quizzes(id, title, description, question_count, time_limit_minutes, pass_percentage)), enrollments(id)")
      .eq("client_id", session.activeClient.id)
      .order("updated_at", { ascending: false });

    if (errWithStatus) {
      const { data: dataWithout, error: errWithout } = await supabase
        .from("courses")
        .select("id, client_id, clients(name), slug, title, status, updated_at, lessons(id, title, position, description, duration_minutes, video_url, lesson_materials(id, title, type, url, summary), lesson_quizzes(id, title, description, question_count, time_limit_minutes, pass_percentage)), enrollments(id)")
        .eq("client_id", session.activeClient.id)
        .order("updated_at", { ascending: false });
      if (errWithout) throw errWithout;
      courses = (dataWithout ?? []) as Array<Record<string, any>>;
      hasLessonStatus = false;
    } else {
      courses = (dataWithStatus ?? []) as Array<Record<string, any>>;
    }

    return courses.map((course) => ({
      id: course.id,
      clientId: course.client_id,
      clientName: course.clients?.name ?? null,
      slug: course.slug,
      title: course.title,
      status: course.status,
      lessons: ((course.lessons ?? []) as Array<Record<string, any>>)
        .sort((a, b) => a.position - b.position)
        .map((lesson) => {
          const material = normalizeSingleRelation(lesson.lesson_materials);
          const quiz = normalizeSingleRelation(lesson.lesson_quizzes);
          return {
            id: lesson.id,
            title: lesson.title,
            position: lesson.position,
            status: hasLessonStatus ? (lesson.status ?? "DRAFT") : "PUBLISHED",
            description: lesson.description,
            durationMinutes: lesson.duration_minutes,
            videoUrl: lesson.video_url,
            material: material ? { id: material.id, title: material.title, type: material.type, url: material.url, summary: material.summary } : null,
            quiz: quiz ? { id: quiz.id, title: quiz.title, description: quiz.description, questionCount: quiz.question_count, timeLimitMinutes: quiz.time_limit_minutes, passPercentage: quiz.pass_percentage } : null
          };
        }),
      lessonCount: (course.lessons ?? []).length,
      enrollmentCount: (course.enrollments ?? []).length,
      updatedAt: course.updated_at
    }));
  } catch {
    return [];
  }
}

export async function getAdminCourseOptions(session: AppSession) {
  if (!hasSupabaseAdminEnv() || !isAdminRole(session.user.role) || !session.activeClient) return [];

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("courses")
      .select("id, title, slug")
      .eq("client_id", session.activeClient.id)
      .order("title", { ascending: true });

    if (error) throw error;

    return (data ?? []) as Array<{ id: string; title: string; slug: string }>;
  } catch {
    return [];
  }
}

export async function getDashboardOverview(session: AppSession): Promise<DashboardOverview> {
  if (!hasSupabaseAdminEnv() || !session.activeClient) {
    return {
      stats: [],
      revenueSeries: [],
      cohortSeries: [],
      activityFeed: []
    };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const clientId = session.activeClient.id;

    const [{ data: courses }, { data: enrollments }, { data: lessons }] = await Promise.all([
      supabase
        .from("courses")
        .select("id, title, status, price_in_cents, created_at, updated_at")
        .eq("client_id", clientId),
      supabase
        .from("enrollments")
        .select("id, user_id, progress_percent, status, enrolled_at, course_id, courses(title, price_in_cents)")
        .eq("client_id", clientId),
      supabase
        .from("lessons")
        .select("id, title, created_at, course_id, courses(title)")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(10)
    ]);

    const safeCourses = (courses ?? []) as Array<Record<string, any>>;
    const safeEnrollments = (enrollments ?? []) as Array<Record<string, any>>;
    const safeLessons = (lessons ?? []) as Array<Record<string, any>>;

    const uniqueLearners = new Set(safeEnrollments.map((enrollment) => enrollment.user_id).filter(Boolean)).size;
    const grossRevenue = safeEnrollments.reduce(
      (sum, enrollment) => sum + Number(enrollment.courses?.price_in_cents ?? 0),
      0
    );
    const averageCompletion = safeEnrollments.length
      ? Math.round(
          safeEnrollments.reduce((sum, enrollment) => sum + Number(enrollment.progress_percent ?? 0), 0) /
            safeEnrollments.length
        )
      : 0;
    const publishedCourses = safeCourses.filter((course) => course.status === "PUBLISHED").length;

    const stats: DashboardStat[] = [
      { label: "Active learners", value: uniqueLearners, tone: "positive" },
      { label: "Gross revenue", value: Math.round(grossRevenue / 100), tone: "positive" },
      { label: "Course completion", value: averageCompletion, suffix: "%", tone: "neutral" },
      { label: "Published courses", value: publishedCourses, tone: "neutral" }
    ];

    const revenueSeries = buildRevenueSeries(safeEnrollments);
    const cohortSeries = buildCohortSeries(safeEnrollments);
    const activityFeed = buildActivityFeed(safeCourses, safeLessons, safeEnrollments);

    return {
      stats,
      revenueSeries,
      cohortSeries,
      activityFeed
    };
  } catch {
    return {
      stats: [],
      revenueSeries: [],
      cohortSeries: [],
      activityFeed: []
    };
  }
}

function normalizeSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

// ─── Quiz analytics ───────────────────────────────────────────────────────────

export type QuizAnalytics = {
  stats: {
    totalAttempts: number;
    passRate: number;
    avgScore: number;
    avgAttemptsToPass: number;
  };
  attemptsByMonth: { name: string; attempts: number }[];
  scoreDistribution: { range: string; count: number }[];
  passByLesson: { name: string; attempts: number; passed: number; failed: number }[];
  leaderboard: { title: string; lesson: string; attempts: number; avgScore: number; passRate: number }[];
};

const SCORE_BUCKETS = [
  { range: "0–20%",   min: 0,  max: 20  },
  { range: "21–40%",  min: 21, max: 40  },
  { range: "41–60%",  min: 41, max: 60  },
  { range: "61–80%",  min: 61, max: 80  },
  { range: "81–100%", min: 81, max: 100 }
];

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function emptyQuizAnalytics(): QuizAnalytics {
  return {
    stats: { totalAttempts: 0, passRate: 0, avgScore: 0, avgAttemptsToPass: 0 },
    attemptsByMonth: [],
    scoreDistribution: SCORE_BUCKETS.map((b) => ({ range: b.range, count: 0 })),
    passByLesson: [],
    leaderboard: []
  };
}

function buildRevenueSeries(enrollments: Array<Record<string, any>>) {
  const monthMap = new Map<string, { revenue: number; learners: number }>();

  for (const enrollment of enrollments) {
    const date = new Date(enrollment.enrolled_at ?? Date.now());
    const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, "0")}`;
    const entry = monthMap.get(key) ?? { revenue: 0, learners: 0 };
    entry.revenue += Math.round(Number(enrollment.courses?.price_in_cents ?? 0) / 100);
    entry.learners += 1;
    monthMap.set(key, entry);
  }

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, value]) => {
      const [, month] = key.split("-");
      return {
        name: MONTH_NAMES[Number(month)],
        revenue: value.revenue,
        learners: value.learners
      };
    });
}

function buildCohortSeries(enrollments: Array<Record<string, any>>) {
  const monthMap = new Map<string, { completionTotal: number; engagementCount: number; total: number }>();

  for (const enrollment of enrollments) {
    const date = new Date(enrollment.enrolled_at ?? Date.now());
    const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, "0")}`;
    const entry = monthMap.get(key) ?? { completionTotal: 0, engagementCount: 0, total: 0 };
    const progress = Number(enrollment.progress_percent ?? 0);
    entry.completionTotal += progress;
    entry.engagementCount += progress > 0 ? 1 : 0;
    entry.total += 1;
    monthMap.set(key, entry);
  }

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-5)
    .map(([key, value]) => {
      const [, month] = key.split("-");
      return {
        name: MONTH_NAMES[Number(month)],
        completion: value.total ? Math.round(value.completionTotal / value.total) : 0,
        engagement: value.total ? Math.round((value.engagementCount / value.total) * 100) : 0
      };
    });
}

function buildActivityFeed(
  courses: Array<Record<string, any>>,
  lessons: Array<Record<string, any>>,
  enrollments: Array<Record<string, any>>
) {
  const items = [
    ...courses.slice(0, 3).map((course) => ({
      id: `course-${course.id}`,
      title: `Course ${course.status === "PUBLISHED" ? "published" : "updated"}`,
      detail: `${course.title} is currently ${String(course.status ?? "DRAFT").toLowerCase()}.`,
      at: course.updated_at ?? course.created_at ?? new Date().toISOString()
    })),
    ...lessons.slice(0, 3).map((lesson) => ({
      id: `lesson-${lesson.id}`,
      title: "Lesson added",
      detail: `${lesson.title} was added to ${lesson.courses?.title ?? "a course"}.`,
      at: lesson.created_at ?? new Date().toISOString()
    })),
    ...enrollments.slice(0, 3).map((enrollment) => ({
      id: `enrollment-${enrollment.id}`,
      title: "New enrollment",
      detail: `A learner registered for ${enrollment.courses?.title ?? "a course"}.`,
      at: enrollment.enrolled_at ?? new Date().toISOString()
    }))
  ];

  return items
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      title: item.title,
      detail: item.detail,
      time: formatRelativeTime(item.at)
    }));
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

export async function getQuizAnalytics(session: AppSession): Promise<QuizAnalytics> {
  if (!hasSupabaseAdminEnv() || !isAdminRole(session.user.role)) return emptyQuizAnalytics();

  try {
    const supabase = createSupabaseAdminClient();
    let attemptQuery = supabase
      .from("quiz_attempts")
      .select("id, quiz_id, score_percent, passed, question_count, correct_count, attempted_at");

    if (session.activeClient?.id) {
      attemptQuery = attemptQuery.eq("client_id", session.activeClient.id);
    }

    const { data: attempts, error: attemptsError } = await attemptQuery;

    if (attemptsError) throw attemptsError;
    if (!attempts || attempts.length === 0) return emptyQuizAnalytics();

    const total = attempts.length;
    const passedCount = attempts.filter((a) => a.passed).length;
    const passRate = Math.round((passedCount / total) * 100);
    const avgScore = Math.round(attempts.reduce((s, a) => s + a.score_percent, 0) / total);
    const avgAttemptsToPass = passedCount > 0
      ? Math.round((total / passedCount) * 10) / 10
      : 0;

    // Attempts by month — last 12 months ordered chronologically
    const monthMap = new Map<string, number>();
    attempts.forEach((a) => {
      const d = new Date(a.attempted_at);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
    });
    const attemptsByMonth = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([key, count]) => {
        const [, month] = key.split("-");
        return { name: MONTH_NAMES[Number(month)], attempts: count };
      });

    // Score distribution
    const scoreDistribution = SCORE_BUCKETS.map((b) => ({
      range: b.range,
      count: attempts.filter((a) => a.score_percent >= b.min && a.score_percent <= b.max).length
    }));

    // Per-quiz breakdown (only for attempts that have a quiz_id)
    const quizIds = [...new Set(attempts.filter((a) => a.quiz_id).map((a) => a.quiz_id as string))];
    let passByLesson: QuizAnalytics["passByLesson"] = [];
    let leaderboard: QuizAnalytics["leaderboard"] = [];

    if (quizIds.length > 0) {
      const { data: quizzes } = await supabase
        .from("lesson_quizzes")
        .select("id, title, lesson_id")
        .in("id", quizIds);

      const lessonIds = [...new Set((quizzes ?? []).map((q) => q.lesson_id))];
      const { data: lessons } = await supabase
        .from("lessons")
        .select("id, title")
        .in("id", lessonIds);

      const lessonMap = new Map((lessons ?? []).map((l) => [l.id, l.title]));

      passByLesson = (quizzes ?? [])
        .map((quiz) => {
          const qa = attempts.filter((a) => a.quiz_id === quiz.id);
          if (!qa.length) return null;
          return {
            name: lessonMap.get(quiz.lesson_id) ?? quiz.title,
            attempts: qa.length,
            passed: qa.filter((a) => a.passed).length,
            failed: qa.filter((a) => !a.passed).length
          };
        })
        .filter(Boolean) as QuizAnalytics["passByLesson"];

      leaderboard = (quizzes ?? [])
        .map((quiz) => {
          const qa = attempts.filter((a) => a.quiz_id === quiz.id);
          if (!qa.length) return null;
          const avg = Math.round(qa.reduce((s, a) => s + a.score_percent, 0) / qa.length);
          const pr = Math.round((qa.filter((a) => a.passed).length / qa.length) * 100);
          return {
            title: quiz.title,
            lesson: lessonMap.get(quiz.lesson_id) ?? "Unknown",
            attempts: qa.length,
            avgScore: avg,
            passRate: pr
          };
        })
        .filter(Boolean) as QuizAnalytics["leaderboard"];
    }

    return {
      stats: { totalAttempts: total, passRate, avgScore, avgAttemptsToPass },
      attemptsByMonth,
      scoreDistribution,
      passByLesson,
      leaderboard
    };
  } catch {
    return emptyQuizAnalytics();
  }
}
