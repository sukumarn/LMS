"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PlusCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CourseOption = {
  id: string;
  title: string;
  slug: string;
};

type QuizQuestion = {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
};

type FieldErrors = Partial<Record<string, string>>;

function emptyQuestion(): QuizQuestion {
  return { question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A" };
}

function Err({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-rose-400">{message}</p>;
}

const initialState = {
  courseId: "",
  title: "",
  description: "",
  status: "DRAFT",
  durationMinutes: "10",
  videoUrl: "",
  materialTitle: "",
  materialType: "",
  materialUrl: "",
  materialSummary: "",
  quizTitle: "",
  quizDescription: "",
  quizTimeLimitMinutes: "10",
  quizPassPercentage: "70"
};

export function LessonForm({
  courses,
  presetCourseId,
  presetCourseTitle,
  showCourseSelect = true,
  submitLabel = "Create lesson"
}: {
  courses: CourseOption[];
  presetCourseId?: string;
  presetCourseTitle?: string;
  showCourseSelect?: boolean;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    ...initialState,
    courseId: presetCourseId ?? courses[0]?.id ?? ""
  });
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  function updateQuestion(index: number, field: keyof QuizQuestion, value: string) {
    setQuestions((prev) => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
    setFieldErrors((current) => ({ ...current, [`questions.${index}.${field}`]: undefined }));
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, emptyQuestion()]);
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function validate(): FieldErrors {
    const errors: FieldErrors = {};

    if (form.title.trim().length < 3) errors.title = "Use at least 3 characters.";
    if (form.description.trim().length < 10) errors.description = "Use at least 10 characters.";
    if (!form.durationMinutes || Number(form.durationMinutes) < 1) errors.durationMinutes = "Duration must be at least 1 minute.";
    if (!form.videoUrl.trim()) errors.videoUrl = "Video URL is required.";
    if (!form.materialTitle.trim()) errors.materialTitle = "Material title is required.";
    if (!form.materialType) errors.materialType = "Please select a material type.";
    if (!form.materialUrl.trim()) errors.materialUrl = "Material URL is required.";
    if (form.quizTitle.trim().length < 2) errors.quizTitle = "Use at least 2 characters.";
    if (!form.quizTimeLimitMinutes) errors.quizTimeLimitMinutes = "Please select a time limit.";
    if (!form.quizPassPercentage) errors.quizPassPercentage = "Please select a pass percentage.";

    questions.forEach((q, i) => {
      if (!q.question.trim()) errors[`questions.${i}.question`] = "Question text is required.";
      if (!q.optionA.trim()) errors[`questions.${i}.optionA`] = "Option A is required.";
      if (!q.optionB.trim()) errors[`questions.${i}.optionB`] = "Option B is required.";
      if (!q.optionC.trim()) errors[`questions.${i}.optionC`] = "Option C is required.";
      if (!q.optionD.trim()) errors[`questions.${i}.optionD`] = "Option D is required.";
    });

    return errors;
  }

  if (!courses.length) {
    return <p className="text-sm text-muted-foreground">Create a course first before adding lessons.</p>;
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const errors = validate();
        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
          toast.error("Please fix the highlighted fields.");
          return;
        }

        startTransition(async () => {
          const response = await fetch("/api/admin/lessons", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...form,
              durationMinutes: Number(form.durationMinutes),
              quizQuestionCount: questions.length,
              quizTimeLimitMinutes: Number(form.quizTimeLimitMinutes),
              quizPassPercentage: Number(form.quizPassPercentage),
              questions
            })
          });

          if (!response.ok) {
            const payload = await response.json().catch(() => null);
            const apiErrors: FieldErrors = {};
            for (const issue of payload?.issues ?? []) {
              if (issue.field) apiErrors[issue.field] = issue.message;
            }
            if (Object.keys(apiErrors).length > 0) {
              setFieldErrors((current) => ({ ...current, ...apiErrors }));
            }
            toast.error(payload?.error || "Unable to create lesson");
            return;
          }

          toast.success("Lesson created");
          setForm((current) => ({ ...initialState, courseId: current.courseId }));
          setQuestions([]);
          setFieldErrors({});
          router.refresh();
        });
      }}
    >
      {showCourseSelect ? (
        <select
          value={form.courseId}
          onChange={(e) => update("courseId", e.target.value)}
          className="h-11 w-full rounded-2xl border border-white/20 bg-white/60 px-4 text-sm outline-none dark:bg-white/5"
        >
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      ) : presetCourseTitle ? (
        <div className="rounded-[22px] border border-white/10 bg-white/50 px-4 py-3 text-sm dark:bg-white/5">
          Adding lesson to <span className="font-medium text-foreground">{presetCourseTitle}</span>
        </div>
      ) : null}

      <div className="space-y-2">
        <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Lesson title" />
        <Err message={fieldErrors.title} />
      </div>

      <div className="space-y-2">
        <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Lesson description" />
        <Err message={fieldErrors.description} />
      </div>

      <div className="space-y-2">
        <Input value={form.durationMinutes} onChange={(e) => update("durationMinutes", e.target.value)} placeholder="Duration in minutes" />
        <p className="text-xs text-muted-foreground">Estimated length of the lesson video in minutes.</p>
        <Err message={fieldErrors.durationMinutes} />
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
        <p className="text-xs text-muted-foreground">Published lessons are visible to enrolled learners. Draft lessons are only visible to admins.</p>
      </div>

      <div className="space-y-2">
        <Input value={form.videoUrl} onChange={(e) => update("videoUrl", e.target.value)} placeholder="Video URL" />
        <Err message={fieldErrors.videoUrl} />
      </div>

      <div className="rounded-[24px] border border-white/10 p-4">
        <p className="mb-4 text-sm font-medium">Lesson material</p>
        <div className="space-y-4">
          <div className="space-y-2">
            <Input value={form.materialTitle} onChange={(e) => update("materialTitle", e.target.value)} placeholder="Material title" />
            <Err message={fieldErrors.materialTitle} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
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
              <Err message={fieldErrors.materialType} />
            </div>
            <div className="space-y-2">
              <Input value={form.materialUrl} onChange={(e) => update("materialUrl", e.target.value)} placeholder="Material URL" />
              <Err message={fieldErrors.materialUrl} />
            </div>
          </div>
          <Textarea value={form.materialSummary} onChange={(e) => update("materialSummary", e.target.value)} placeholder="Material summary" />
        </div>
      </div>

      <div className="rounded-[24px] border border-white/10 p-4">
        <p className="mb-4 text-sm font-medium">Lesson quiz</p>
        <div className="space-y-4">
          <div className="space-y-2">
            <Input value={form.quizTitle} onChange={(e) => update("quizTitle", e.target.value)} placeholder="Quiz title" />
            <Err message={fieldErrors.quizTitle} />
          </div>
          <Textarea value={form.quizDescription} onChange={(e) => update("quizDescription", e.target.value)} placeholder="Quiz description" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <select
                value={form.quizTimeLimitMinutes}
                onChange={(e) => update("quizTimeLimitMinutes", e.target.value)}
                className="h-11 w-full rounded-2xl border border-white/20 bg-white/60 px-4 text-sm outline-none dark:bg-white/5"
              >
                <option value="">Select limit</option>
                {[5, 10, 15, 20, 30, 45, 60].map((n) => (
                  <option key={n} value={n}>{n} minutes</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Time allowed to complete the quiz (in minutes).</p>
              <Err message={fieldErrors.quizTimeLimitMinutes} />
            </div>
            <div className="space-y-2">
              <select
                value={form.quizPassPercentage}
                onChange={(e) => update("quizPassPercentage", e.target.value)}
                className="h-11 w-full rounded-2xl border border-white/20 bg-white/60 px-4 text-sm outline-none dark:bg-white/5"
              >
                <option value="">Select %</option>
                {[50, 60, 70, 75, 80, 90, 100].map((n) => (
                  <option key={n} value={n}>{n}%</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Minimum score % required to pass (e.g. 70 = 70%).</p>
              <Err message={fieldErrors.quizPassPercentage} />
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Quiz questions <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-xs">{questions.length}</span>
              </p>
              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center gap-1.5 rounded-xl border border-white/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-white/10"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Add question
              </button>
            </div>

            {questions.length === 0 && (
              <p className="text-xs text-muted-foreground">No questions added yet. Click "Add question" to begin.</p>
            )}

            {questions.map((q, index) => (
              <div key={index} className="rounded-[20px] border border-white/10 bg-white/30 p-4 space-y-3 dark:bg-white/5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground">Question {index + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-rose-400 hover:bg-rose-400/10"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </button>
                </div>
                <div className="space-y-1">
                  <Input
                    value={q.question}
                    onChange={(e) => updateQuestion(index, "question", e.target.value)}
                    placeholder="Enter question"
                  />
                  <Err message={fieldErrors[`questions.${index}.question`]} />
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {(["A", "B", "C", "D"] as const).map((letter) => {
                    const field = `option${letter}` as keyof QuizQuestion;
                    return (
                      <div key={letter} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold w-4">{letter}</span>
                          <Input
                            value={q[field] as string}
                            onChange={(e) => updateQuestion(index, field, e.target.value)}
                            placeholder={`Option ${letter}`}
                          />
                        </div>
                        <Err message={fieldErrors[`questions.${index}.${field}`]} />
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-1">
                  <select
                    value={q.correctOption}
                    onChange={(e) => updateQuestion(index, "correctOption", e.target.value)}
                    className="h-10 w-full rounded-2xl border border-white/20 bg-white/60 px-4 text-sm outline-none dark:bg-white/5"
                  >
                    <option value="A">Correct answer: A</option>
                    <option value="B">Correct answer: B</option>
                    <option value="C">Correct answer: C</option>
                    <option value="D">Correct answer: D</option>
                  </select>
                  <p className="text-xs text-muted-foreground">Select which option is the correct answer.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Button className="w-full" disabled={isPending}>
        {isPending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
