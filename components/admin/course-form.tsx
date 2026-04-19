"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const initialState = {
  title: "",
  shortDescription: "",
  description: "",
  category: "",
  level: "",
  instructorName: "",
  thumbnailUrl: "",
  priceInCents: "0",
  status: "DRAFT"
};

export function CourseForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(initialState);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof initialState, string>>>({});

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  function validateForm() {
    const nextErrors: Partial<Record<keyof typeof initialState, string>> = {};

    if (form.title.trim().length < 3) {
      nextErrors.title = "Use at least 3 characters.";
    }

    if (form.shortDescription.trim().length < 8) {
      nextErrors.shortDescription = "Use at least 8 characters.";
    }

    if (form.description.trim().length < 20) {
      nextErrors.description = "Use at least 20 characters.";
    }

    if (!form.category) {
      nextErrors.category = "Please select a category.";
    }

    if (!form.level) {
      nextErrors.level = "Please select a level.";
    }

    if (form.instructorName.trim().length < 2) {
      nextErrors.instructorName = "Use at least 2 characters.";
    }

    if (form.thumbnailUrl.trim() && !isValidUrl(form.thumbnailUrl)) {
      nextErrors.thumbnailUrl = "Enter a valid URL.";
    }

    if (!/^\d+$/.test(form.priceInCents)) {
      nextErrors.priceInCents = "Enter a whole number in cents.";
    }

    return nextErrors;
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const nextErrors = validateForm();

        if (Object.keys(nextErrors).length > 0) {
          setFieldErrors(nextErrors);
          toast.error("Please fix the course form fields.");
          return;
        }

        startTransition(async () => {
          const response = await fetch("/api/admin/courses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...form,
              priceInCents: Number(form.priceInCents)
            })
          });

          if (!response.ok) {
            const payload = await response.json().catch(() => null);
            const apiFieldErrors = mapIssueFields(payload?.issues);

            if (Object.keys(apiFieldErrors).length > 0) {
              setFieldErrors((current) => ({ ...current, ...apiFieldErrors }));
            }

            toast.error(formatApiError(payload, "Unable to create course"));
            return;
          }

          toast.success("Course created");
          setForm(initialState);
          router.refresh();
        });
      }}
    >
      <div className="space-y-2">
        <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Course title" minLength={3} required />
        {fieldErrors.title && <p className="text-sm text-rose-400">{fieldErrors.title}</p>}
      </div>
      <div className="space-y-2">
        <Input value={form.shortDescription} onChange={(e) => update("shortDescription", e.target.value)} placeholder="Short description" minLength={8} required />
        <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        {fieldErrors.shortDescription && <p className="text-sm text-rose-400">{fieldErrors.shortDescription}</p>}
      </div>
      <div className="space-y-2">
        <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Full course description" minLength={20} required />
        <p className="text-xs text-muted-foreground">At least 20 characters.</p>
        {fieldErrors.description && <p className="text-sm text-rose-400">{fieldErrors.description}</p>}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <select
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            required
            className="h-11 w-full rounded-2xl border border-white/20 bg-white/60 px-4 text-sm outline-none dark:bg-white/5"
          >
            <option value="">Select category</option>
            <option value="Business">Business</option>
            <option value="Design">Design</option>
            <option value="Development">Development</option>
            <option value="Finance">Finance</option>
            <option value="Health & Fitness">Health &amp; Fitness</option>
            <option value="Marketing">Marketing</option>
            <option value="Music">Music</option>
            <option value="Photography">Photography</option>
            <option value="Technology">Technology</option>
            <option value="Other">Other</option>
          </select>
          {fieldErrors.category && <p className="text-sm text-rose-400">{fieldErrors.category}</p>}
        </div>
        <div className="space-y-2">
          <select
            value={form.level}
            onChange={(e) => update("level", e.target.value)}
            required
            className="h-11 w-full rounded-2xl border border-white/20 bg-white/60 px-4 text-sm outline-none dark:bg-white/5"
          >
            <option value="">Select level</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="All Levels">All Levels</option>
          </select>
          {fieldErrors.level && <p className="text-sm text-rose-400">{fieldErrors.level}</p>}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Input value={form.instructorName} onChange={(e) => update("instructorName", e.target.value)} placeholder="Instructor name" minLength={2} required />
          {fieldErrors.instructorName && <p className="text-sm text-rose-400">{fieldErrors.instructorName}</p>}
        </div>
        <div className="space-y-2">
          <Input value={form.thumbnailUrl} onChange={(e) => update("thumbnailUrl", e.target.value)} placeholder="Thumbnail URL" />
          {fieldErrors.thumbnailUrl && <p className="text-sm text-rose-400">{fieldErrors.thumbnailUrl}</p>}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Input value={form.priceInCents} onChange={(e) => update("priceInCents", e.target.value)} placeholder="Price in cents" inputMode="numeric" required />
          {fieldErrors.priceInCents && <p className="text-sm text-rose-400">{fieldErrors.priceInCents}</p>}
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
          <p className="text-xs text-muted-foreground">Published courses appear to learners. Draft courses are visible to admins only.</p>
        </div>
      </div>
      <Button className="w-full" disabled={isPending}>
        {isPending ? "Saving..." : "Create course"}
      </Button>
    </form>
  );
}

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function mapIssueFields(
  issues: Array<{ field?: string; message?: string }> | undefined
): Partial<Record<keyof typeof initialState, string>> {
  const next: Partial<Record<keyof typeof initialState, string>> = {};

  for (const issue of issues ?? []) {
    if (!issue.field || !issue.message) continue;
    if (issue.field in initialState) {
      next[issue.field as keyof typeof initialState] = issue.message;
    }
  }

  return next;
}

function formatApiError(
  payload: { error?: string; issues?: Array<{ message?: string }> } | null,
  fallback: string
) {
  if (!payload) return fallback;

  const issueText = payload.issues?.map((issue) => issue.message).filter(Boolean).join(" ");
  return issueText || payload.error || fallback;
}
