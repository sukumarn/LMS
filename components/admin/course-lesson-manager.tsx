"use client";

import { useState, useTransition } from "react";
import { BookPlus, ChevronDown, ClipboardList, Pencil, X, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { LessonForm } from "@/components/admin/lesson-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AdminCourseSummary, AdminLesson } from "@/lib/lms-data";

type CourseOption = {
  id: string;
  title: string;
  slug: string;
};

function EditLessonForm({ lesson, onCancel, onSaved }: { lesson: AdminLesson; onCancel: () => void; onSaved: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: lesson.title,
    description: lesson.description,
    status: lesson.status ?? "DRAFT",
    durationMinutes: String(lesson.durationMinutes),
    videoUrl: lesson.videoUrl,
    materialTitle: lesson.material?.title ?? "",
    materialType: lesson.material?.type ?? "",
    materialUrl: lesson.material?.url ?? "",
    materialSummary: lesson.material?.summary ?? "",
    quizTitle: lesson.quiz?.title ?? "",
    quizDescription: lesson.quiz?.description ?? "",
    quizQuestionCount: String(lesson.quiz?.questionCount ?? 5),
    quizTimeLimitMinutes: String(lesson.quiz?.timeLimitMinutes ?? 10),
    quizPassPercentage: String(lesson.quiz?.passPercentage ?? 70)
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (form.title.trim().length < 3) e.title = "Use at least 3 characters.";
    if (form.description.trim().length < 10) e.description = "Use at least 10 characters.";
    if (!form.durationMinutes || Number(form.durationMinutes) < 1) e.durationMinutes = "Duration must be at least 1 minute.";
    if (!form.videoUrl.trim()) e.videoUrl = "Video URL is required.";
    if (!form.materialTitle.trim()) e.materialTitle = "Material title is required.";
    if (!form.materialType) e.materialType = "Please select a material type.";
    if (!form.materialUrl.trim()) e.materialUrl = "Material URL is required.";
    if (form.quizTitle.trim().length < 2) e.quizTitle = "Use at least 2 characters.";
    return e;
  }

  function handleSave() {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      toast.error("Please fix the highlighted fields.");
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/admin/lessons/${lesson.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          status: form.status,
          durationMinutes: Number(form.durationMinutes),
          videoUrl: form.videoUrl,
          material: {
            title: form.materialTitle,
            type: form.materialType,
            url: form.materialUrl,
            summary: form.materialSummary || null
          },
          quiz: {
            title: form.quizTitle,
            description: form.quizDescription || null,
            questionCount: Number(form.quizQuestionCount),
            timeLimitMinutes: Number(form.quizTimeLimitMinutes),
            passPercentage: Number(form.quizPassPercentage)
          }
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        toast.error(payload?.error || "Unable to update lesson");
        return;
      }

      toast.success("Lesson updated");
      onSaved();
    });
  }

  function Err({ field }: { field: string }) {
    return errors[field] ? <p className="text-sm text-rose-400">{errors[field]}</p> : null;
  }

  return (
    <div className="space-y-4 rounded-[24px] border border-white/10 bg-white/40 p-5 dark:bg-white/5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Editing: {lesson.position}. {lesson.title}</p>
        <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2">
        <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Lesson title" />
        <Err field="title" />
      </div>

      <div className="space-y-2">
        <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Lesson description" />
        <Err field="description" />
      </div>

      <div className="space-y-2">
        <select
          value={form.status}
          onChange={(e) => update("status", e.target.value)}
          className="h-11 w-full rounded-2xl border border-white/20 bg-white/60 px-4 text-sm outline-none dark:bg-white/5"
        >
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <p className="text-xs text-muted-foreground">Published lessons are visible to enrolled learners.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Input value={form.durationMinutes} onChange={(e) => update("durationMinutes", e.target.value)} placeholder="Duration in minutes" />
          <p className="text-xs text-muted-foreground">Estimated length of the lesson video in minutes.</p>
          <Err field="durationMinutes" />
        </div>
        <div className="space-y-2">
          <Input value={form.videoUrl} onChange={(e) => update("videoUrl", e.target.value)} placeholder="Video URL" />
          <Err field="videoUrl" />
        </div>
      </div>

      <div className="rounded-[20px] border border-white/10 p-4 space-y-3">
        <p className="text-sm font-medium">Lesson material</p>
        <div className="space-y-2">
          <Input value={form.materialTitle} onChange={(e) => update("materialTitle", e.target.value)} placeholder="Material title" />
          <Err field="materialTitle" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <select
              value={form.materialType}
              onChange={(e) => update("materialType", e.target.value)}
              className="h-11 w-full rounded-2xl border border-white/20 bg-white/60 px-4 text-sm outline-none dark:bg-white/5"
            >
              <option value="">Select type</option>
              <option value="PDF">PDF</option>
              <option value="Word">Word</option>
              <option value="URL">URL</option>
              <option value="Slides">Slides</option>
              <option value="Spreadsheet">Spreadsheet</option>
              <option value="Video">Video</option>
              <option value="Audio">Audio</option>
              <option value="Image">Image</option>
              <option value="Other">Other</option>
            </select>
            <Err field="materialType" />
          </div>
          <div className="space-y-2">
            <Input value={form.materialUrl} onChange={(e) => update("materialUrl", e.target.value)} placeholder="Material URL" />
            <Err field="materialUrl" />
          </div>
        </div>
        <Textarea value={form.materialSummary} onChange={(e) => update("materialSummary", e.target.value)} placeholder="Material summary (optional)" />
      </div>

      <div className="rounded-[20px] border border-white/10 p-4 space-y-3">
        <p className="text-sm font-medium">Lesson quiz</p>
        <div className="space-y-2">
          <Input value={form.quizTitle} onChange={(e) => update("quizTitle", e.target.value)} placeholder="Quiz title" />
          <Err field="quizTitle" />
        </div>
        <Textarea value={form.quizDescription} onChange={(e) => update("quizDescription", e.target.value)} placeholder="Quiz description (optional)" />
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <select value={form.quizQuestionCount} onChange={(e) => update("quizQuestionCount", e.target.value)}
              className="h-11 w-full rounded-2xl border border-white/20 bg-white/60 px-4 text-sm outline-none dark:bg-white/5">
              {[5, 10, 15, 20, 25, 30].map((n) => <option key={n} value={n}>{n} questions</option>)}
            </select>
            <p className="text-xs text-muted-foreground">Total number of questions.</p>
          </div>
          <div className="space-y-2">
            <select value={form.quizTimeLimitMinutes} onChange={(e) => update("quizTimeLimitMinutes", e.target.value)}
              className="h-11 w-full rounded-2xl border border-white/20 bg-white/60 px-4 text-sm outline-none dark:bg-white/5">
              {[5, 10, 15, 20, 30, 45, 60].map((n) => <option key={n} value={n}>{n} minutes</option>)}
            </select>
            <p className="text-xs text-muted-foreground">Time allowed to complete.</p>
          </div>
          <div className="space-y-2">
            <select value={form.quizPassPercentage} onChange={(e) => update("quizPassPercentage", e.target.value)}
              className="h-11 w-full rounded-2xl border border-white/20 bg-white/60 px-4 text-sm outline-none dark:bg-white/5">
              {[50, 60, 70, 75, 80, 90, 100].map((n) => <option key={n} value={n}>{n}%</option>)}
            </select>
            <p className="text-xs text-muted-foreground">Minimum score to pass.</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={isPending} className="flex-1">
          <Check className="h-4 w-4" />
          {isPending ? "Saving..." : "Save changes"}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function CourseLessonManager({
  courses,
  courseOptions
}: {
  courses: AdminCourseSummary[];
  courseOptions: CourseOption[];
}) {
  const router = useRouter();
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!courses.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-lg font-semibold">No courses yet</p>
          <p className="mt-2 text-sm text-muted-foreground">Create a course first, then its lesson editor will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {courses.map((course) => (
        <Card key={course.id}>
          <CardContent className="p-0">
            <button
              type="button"
              onClick={() => {
                setExpandedCourseId((current) => (current === course.id ? null : course.id));
                setEditingLessonId(null);
              }}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xl font-semibold">{course.title}</p>
                  <div onClick={(event) => event.stopPropagation()} className="flex items-center gap-2">
                    <Badge variant={course.status === "PUBLISHED" ? "success" : course.status === "DRAFT" ? "warning" : "secondary"}>
                      {course.status}
                    </Badge>
                    <select
                      value={course.status}
                      disabled={isPending}
                      onChange={(event) => {
                        const nextStatus = event.target.value;
                        startTransition(async () => {
                          const response = await fetch(`/api/admin/courses/${course.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: nextStatus })
                          });
                          if (!response.ok) {
                            const payload = await response.json().catch(() => null);
                            toast.error(payload?.error || "Unable to update course status");
                            return;
                          }
                          toast.success(`Course status updated to ${nextStatus}`);
                          router.refresh();
                        });
                      }}
                      className="h-9 rounded-xl border border-white/20 bg-white/60 px-3 text-sm outline-none dark:bg-white/5"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">/{course.slug}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span>{course.lessonCount} lessons</span>
                  <span>{course.enrollmentCount} enrollments</span>
                </div>
              </div>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                  expandedCourseId === course.id ? "rotate-180" : ""
                }`}
              />
            </button>

            {expandedCourseId === course.id && (
              <div className="grid gap-6 border-t border-white/10 px-6 py-6 xl:grid-cols-[0.8fr_1.2fr]">
                <div className="space-y-4">
                  <div className="rounded-[24px] border border-white/10 bg-white/50 p-4 dark:bg-white/5">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">Current lessons</p>
                    </div>
                    {course.lessons.length ? (
                      <div className="mt-3 space-y-2">
                        {course.lessons.map((lesson) => (
                          <div key={lesson.id}>
                            {editingLessonId === lesson.id ? (
                              <EditLessonForm
                                lesson={lesson}
                                onCancel={() => setEditingLessonId(null)}
                                onSaved={() => {
                                  setEditingLessonId(null);
                                  router.refresh();
                                }}
                              />
                            ) : (
                              <div className="flex items-center justify-between rounded-2xl border border-white/10 px-3 py-2 text-sm">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="truncate">{lesson.position}. {lesson.title}</span>
                                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                                    lesson.status === "PUBLISHED" ? "bg-emerald-400/10 text-emerald-400" :
                                    lesson.status === "ARCHIVED" ? "bg-zinc-400/10 text-zinc-400" :
                                    "bg-amber-400/10 text-amber-400"
                                  }`}>
                                    {lesson.status ?? "DRAFT"}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setEditingLessonId(lesson.id)}
                                  className="ml-2 flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-white/20 hover:text-foreground"
                                >
                                  <Pencil className="h-3 w-3" />
                                  Edit
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">No lessons added yet for this course.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/40 p-5 dark:bg-white/5">
                  <div className="flex items-center gap-3">
                    <BookPlus className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-lg font-semibold">Add lesson</p>
                      <p className="text-sm text-muted-foreground">Video, material, and quiz are created together for this course.</p>
                    </div>
                  </div>
                  <LessonForm
                    courses={courseOptions}
                    presetCourseId={course.id}
                    presetCourseTitle={course.title}
                    showCourseSelect={false}
                    submitLabel={`Add lesson to ${course.title}`}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
