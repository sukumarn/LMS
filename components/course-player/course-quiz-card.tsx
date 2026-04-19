"use client";

import { useState } from "react";
import { GraduationCap, ClipboardList, TimerReset, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizPlayer } from "@/components/course-player/quiz-player";

type Props = {
  courseSlug: string;
  lessonCount: number;
};

export function CourseQuizCard({ courseSlug, lessonCount }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <p className="text-sm text-muted-foreground">Course quiz</p>
            <CardTitle className="mt-1">All lessons combined</CardTitle>
          </div>
          <GraduationCap className="h-5 w-5 text-amber-400" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-[24px] border border-white/10 bg-white/50 p-4 dark:bg-white/5 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ClipboardList className="h-4 w-4 text-primary" />
              Combines quiz questions from all {lessonCount} lesson{lessonCount !== 1 ? "s" : ""}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="h-4 w-4 text-amber-400" />
              Pass mark averaged across all lessons
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TimerReset className="h-4 w-4 text-cyan-400" />
              Time limit is the sum of all lesson quiz limits
            </div>
          </div>
          <Button className="w-full" onClick={() => setOpen(true)}>
            Start course quiz
          </Button>
        </CardContent>
      </Card>

      {open && (
        <QuizPlayer
          lessonId={courseSlug}
          quizTitle="Course Quiz — All Lessons"
          apiPath={`/api/courses/${courseSlug}/quiz`}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
