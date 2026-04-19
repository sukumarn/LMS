"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookText, CirclePlay, ClipboardCheck, ExternalLink, FileText, TimerReset } from "lucide-react";

import type { CourseDetail } from "@/lib/lms-data";
import { useLMSStore } from "@/store/lms-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizPlayer } from "@/components/course-player/quiz-player";

export function LessonResources({ course }: { course: CourseDetail }) {
  const { activeLessonId, setActiveLessonId } = useLMSStore();
  const activeLesson = course.lessons.find((lesson) => lesson.id === activeLessonId) ?? course.lessons[0];
  const embedUrl = getEmbedUrl(activeLesson.videoUrl);
  const [quizOpen, setQuizOpen] = useState(false);

  useEffect(() => {
    if (!course.lessons.some((lesson) => lesson.id === activeLessonId)) {
      setActiveLessonId(course.lessons[0].id);
    }
    setQuizOpen(false);
  }, [activeLessonId, course.lessons, setActiveLessonId]);

  return (
    <>
    <div className="space-y-4">
      <Card className="overflow-hidden">
        {embedUrl ? (
          <div className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="px-4 py-2">Lesson video</Badge>
              <Button asChild size="sm" variant="outline">
                <Link href={activeLesson.videoUrl!} target="_blank" rel="noreferrer">
                  Open in YouTube
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="overflow-hidden rounded-[28px] border border-white/10">
              <iframe
                className="aspect-video w-full"
                src={embedUrl}
                title={activeLesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            <div className="px-2 pb-2">
              <p className="text-2xl font-semibold">{activeLesson.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{activeLesson.description}</p>
            </div>
          </div>
        ) : (
          <div className="relative aspect-video bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.32),transparent_24%),linear-gradient(135deg,#090d18_0%,#11172b_45%,#0c1020_100%)]">
            <div className="absolute left-6 top-6">
              <Badge variant="secondary" className="px-4 py-2">Lesson video</Badge>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur">
                <CirclePlay className="h-10 w-10" />
              </div>
              <p className="mt-4 text-2xl font-semibold">{activeLesson.title}</p>
              <p className="mt-2 max-w-2xl text-sm text-white/70">{activeLesson.description}</p>
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <p className="text-sm text-muted-foreground">Lesson material</p>
              <CardTitle className="mt-1">{activeLesson.material?.title ?? "Material pending"}</CardTitle>
            </div>
            <BookText className="h-5 w-5 text-cyan-400" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[24px] border border-white/10 bg-white/50 p-4 dark:bg-white/5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{activeLesson.material?.type ?? "Reference"}</p>
              <p className="mt-3 text-sm text-muted-foreground">{activeLesson.material?.summary ?? "No material has been attached to this lesson yet."}</p>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                {activeLesson.material?.url ? "Material URL available" : "Material not available"}
              </div>
            </div>
            {activeLesson.material?.url ? (
              <Button asChild variant="outline" className="w-full">
                <Link href={activeLesson.material.url} target="_blank" rel="noreferrer">
                  Open material
                </Link>
              </Button>
            ) : (
              <Button variant="outline" className="w-full" disabled>
                Open material
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <p className="text-sm text-muted-foreground">Quiz</p>
              <CardTitle className="mt-1">{activeLesson.quiz?.title ?? "Quiz pending"}</CardTitle>
            </div>
            <ClipboardCheck className="h-5 w-5 text-emerald-400" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[24px] border border-white/10 bg-white/50 p-4 dark:bg-white/5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Questions</p>
                  <p className="mt-1 text-lg font-semibold">{activeLesson.quiz?.questionCount ?? 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pass mark</p>
                  <p className="mt-1 text-lg font-semibold">{activeLesson.quiz ? `${activeLesson.quiz.passPercentage}%` : "N/A"}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <TimerReset className="h-4 w-4" />
                Estimated duration {activeLesson.quiz ? `${activeLesson.quiz.timeLimitMinutes} min` : "Not set"}
              </div>
            </div>
            <Button className="w-full" onClick={() => setQuizOpen(true)}>Start quiz</Button>
          </CardContent>
        </Card>
      </div>
    </div>

    {quizOpen && (
      <QuizPlayer
        lessonId={activeLesson.id}
        quizTitle={activeLesson.quiz?.title ?? "Lesson Quiz"}
        onClose={() => setQuizOpen(false)}
      />
    )}
    </>
  );
}

function getEmbedUrl(url?: string) {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.pathname.replace("/", "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
  } catch {
    return null;
  }

  return null;
}
