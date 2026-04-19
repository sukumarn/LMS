import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, CirclePlay, ClipboardCheck } from "lucide-react";

import { type CatalogCourse } from "@/lib/lms-data";
import { formatCurrencyFromCents, formatDurationMinutes } from "@/lib/utils";
import { EnrollButton } from "@/components/learning/enroll-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function CourseLibrary({ courses }: { courses: CatalogCourse[] }) {
  if (!courses.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-xl font-semibold">No published courses yet</p>
          <p className="mt-2 text-sm text-muted-foreground">An admin needs to add and publish a course before users can register and learn.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      {courses.map((course) => (
        <Card key={course.id} className="overflow-hidden">
          <div className="relative h-48">
            <Image
              src={
                course.thumbnailUrl ??
                "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
              }
              alt={course.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 to-transparent" />
            <div className="absolute left-4 top-4 flex gap-2">
              <Badge variant="secondary">{course.category}</Badge>
              <Badge variant={course.isEnrolled ? "success" : "secondary"}>{course.isEnrolled ? "Registered" : course.level}</Badge>
              <Badge variant={course.status === "PUBLISHED" ? "success" : course.status === "DRAFT" ? "warning" : "secondary"}>
                {course.status}
              </Badge>
            </div>
          </div>
          <CardContent className="space-y-5 p-5">
            <div>
              <p className="text-sm text-muted-foreground">{course.instructorName}</p>
              <h3 className="mt-1 text-2xl font-semibold">{course.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{course.shortDescription}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-2xl border border-white/10 bg-white/50 p-3 dark:bg-white/5">
                <CirclePlay className="h-4 w-4 text-primary" />
                <p className="mt-2 font-medium">{course.lessonCount}</p>
                <p className="text-muted-foreground">Videos</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/50 p-3 dark:bg-white/5">
                <BookOpen className="h-4 w-4 text-cyan-400" />
                <p className="mt-2 font-medium">{course.lessonCount}</p>
                <p className="text-muted-foreground">Materials</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/50 p-3 dark:bg-white/5">
                <ClipboardCheck className="h-4 w-4 text-emerald-400" />
                <p className="mt-2 font-medium">{course.lessonCount}</p>
                <p className="text-muted-foreground">Quizzes</p>
              </div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/50 p-4 dark:bg-white/5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Lesson list</p>
              <div className="mt-3 space-y-2">
                {course.lessonPreview.map((lesson, index) => (
                  <div key={lesson.id} className="flex items-center justify-between rounded-2xl border border-white/10 px-3 py-2 text-sm">
                    <span>{index + 1}. {lesson.title}</span>
                    <span className="text-muted-foreground">{formatDurationMinutes(lesson.durationMinutes)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Price</p>
                <p className="mt-1 text-xl font-semibold">{formatCurrencyFromCents(course.priceInCents)}</p>
              </div>
              <EnrollButton courseSlug={course.slug} enrolled={course.isEnrolled} />
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/learn/${course.slug}`}>
                {course.isEnrolled ? "Continue learning" : "View course"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
