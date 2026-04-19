"use client";

import { useState, useEffect } from "react";
import { FlaskConical, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizPlayer } from "@/components/course-player/quiz-player";

type Props = {
  courseSlug: string;
};

export function SimulateExamCard({ courseSlug }: Props) {
  const [total, setTotal] = useState<number | null>(null);
  const [count, setCount] = useState(10);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/courses/${courseSlug}/quiz`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.questions?.length) {
          const t = data.questions.length;
          setTotal(t);
          setCount(Math.min(10, t));
        }
      })
      .catch(() => null);
  }, [courseSlug]);

  function decrement() { setCount((c) => Math.max(1, c - 1)); }
  function increment() { setCount((c) => Math.min(total ?? c, c + 1)); }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <p className="text-sm text-muted-foreground">Simulate exam</p>
            <CardTitle className="mt-1">Custom question set</CardTitle>
          </div>
          <FlaskConical className="h-5 w-5 text-cyan-400" />
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Pick how many questions to attempt. They are randomly drawn from all lesson quizzes in this course.
          </p>

          <div className="rounded-[24px] border border-white/10 bg-white/50 p-4 dark:bg-white/5 space-y-3">
            <p className="text-sm font-medium text-center">Number of questions</p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={decrement}
                disabled={count <= 1 || total === null}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/50 text-foreground hover:bg-white/80 disabled:opacity-40 dark:bg-white/5 dark:hover:bg-white/10"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-3xl font-bold">{count}</span>
              <button
                onClick={increment}
                disabled={total === null || count >= total}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/50 text-foreground hover:bg-white/80 disabled:opacity-40 dark:bg-white/5 dark:hover:bg-white/10"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {total !== null && (
              <p className="text-center text-xs text-muted-foreground">{total} total questions available</p>
            )}
            {total === null && (
              <p className="text-center text-xs text-muted-foreground">Loading question pool...</p>
            )}
          </div>

          <Button
            className="w-full"
            disabled={total === null || total === 0}
            onClick={() => setOpen(true)}
          >
            Start exam
          </Button>
        </CardContent>
      </Card>

      {open && (
        <QuizPlayer
          lessonId={courseSlug}
          quizTitle={`Simulated Exam — ${count} Questions`}
          apiPath={`/api/courses/${courseSlug}/quiz`}
          questionLimit={count}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
