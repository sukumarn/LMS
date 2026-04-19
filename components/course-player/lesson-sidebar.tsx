"use client";

import { CheckCircle2, PlayCircle } from "lucide-react";

import type { CourseDetail } from "@/lib/lms-data";
import { cn } from "@/lib/utils";
import { formatDurationMinutes } from "@/lib/utils";
import { useLMSStore } from "@/store/lms-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LessonSidebar({ course }: { course: CourseDetail }) {
  const { activeLessonId, setActiveLessonId } = useLMSStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lesson flow</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[480px] space-y-3 overflow-y-auto pr-1">
        {course.lessons.map((lesson, index) => {
          const active = lesson.id === activeLessonId;
          return (
            <button
              key={lesson.id}
              onClick={() => setActiveLessonId(lesson.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition",
                active
                  ? "border-primary/50 bg-primary/10"
                  : "border-white/10 bg-white/40 hover:bg-white/70 dark:bg-white/5 dark:hover:bg-white/10"
              )}
            >
              <div className="mt-0.5">
                {index === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <PlayCircle className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Lesson {index + 1}</p>
                <p className="mt-1 font-medium">{lesson.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatDurationMinutes(lesson.durationMinutes)}</p>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
