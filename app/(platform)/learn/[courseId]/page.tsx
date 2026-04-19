import { notFound } from "next/navigation";
import { Clock3, Flame, NotebookText, Users } from "lucide-react";

import { LessonSidebar } from "@/components/course-player/lesson-sidebar";
import { LessonResources } from "@/components/course-player/lesson-resources";
import { CourseQuizCard } from "@/components/course-player/course-quiz-card";
import { SimulateExamCard } from "@/components/course-player/simulate-exam-card";
import { EnrollButton } from "@/components/learning/enroll-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getDemoSession, isAdminRole } from "@/lib/demo-session";
import { getCourseBySlug } from "@/lib/lms-data";
import { formatCurrencyFromCents } from "@/lib/utils";

export default async function LearnPage({ params }: { params: { courseId: string } }) {
  const session = await getDemoSession();
  const course = await getCourseBySlug(params.courseId, session);

  if (!course) {
    notFound();
  }

  const canAccessContent = isAdminRole(session.user.role) || course.isEnrolled;

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-indigo-950/80 via-background to-background p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.18),transparent_60%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
          {/* Left: course info */}
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full px-3 py-1">{course.category}</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-muted-foreground">{course.level}</Badge>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{course.title}</h1>
              <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">{course.description}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-foreground">
                <Clock3 className="h-4 w-4 text-cyan-400" />
                {course.lessons.length} lesson{course.lessons.length !== 1 ? "s" : ""}
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-foreground">
                <Flame className="h-4 w-4 text-orange-400" />
                {course.level}
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-foreground">
                <NotebookText className="h-4 w-4 text-violet-400" />
                {course.instructorName}
              </div>
            </div>
          </div>

          {/* Right: enrollment panel */}
          <div className="rounded-[24px] border border-white/10 bg-white/60 p-6 backdrop-blur dark:bg-white/5">
            {course.isEnrolled ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/15">
                    <Users className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Enrollment status</p>
                    <p className="font-semibold text-emerald-400">Registered</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">You have full access to all lessons, materials, and quizzes in this course.</p>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Registration required</p>
                <p className="mt-2 text-3xl font-bold">{formatCurrencyFromCents(course.priceInCents)}</p>
                <p className="mt-1 text-sm text-muted-foreground">One-time payment. Lifetime access.</p>
                {!isAdminRole(session.user.role) && (
                  <EnrollButton className="mt-5 w-full" courseSlug={course.slug} enrolled={false} />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content area */}
      {canAccessContent && course.lessons.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_380px] xl:items-start">
          {/* Main: video + material + quiz cards */}
          <LessonResources course={course} />

          {/* Sidebar: lesson list + course quiz + simulate exam */}
          <div className="space-y-4 xl:sticky xl:top-4">
            <LessonSidebar course={course} />
            <CourseQuizCard courseSlug={course.slug} lessonCount={course.lessons.length} />
            <SimulateExamCard courseSlug={course.slug} />
          </div>
        </div>
      ) : canAccessContent ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-xl font-semibold">No lessons added yet</p>
            <p className="mt-2 text-sm text-muted-foreground">The course has been created but no lessons have been published yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="grid gap-8 p-8 xl:grid-cols-[1fr_0.9fr] xl:items-start">
            <div>
              <p className="text-xl font-semibold">Course outline</p>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Register this course to unlock lesson videos, downloadable materials, and quizzes.
              </p>
            </div>
            <LessonSidebar course={course} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
