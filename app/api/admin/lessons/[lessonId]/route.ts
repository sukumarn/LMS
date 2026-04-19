import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getDemoSession, isAdminRole } from "@/lib/demo-session";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/server";

const patchSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  durationMinutes: z.number().int().min(1).optional(),
  videoUrl: z.string().url().optional(),
  material: z.object({
    title: z.string().min(1),
    type: z.string().min(1),
    url: z.string().url(),
    summary: z.string().optional().nullable()
  }).optional(),
  quiz: z.object({
    title: z.string().min(2),
    description: z.string().optional().nullable(),
    questionCount: z.number().int().min(0),
    timeLimitMinutes: z.number().int().min(1),
    passPercentage: z.number().int().min(0).max(100)
  }).optional()
});

export async function PATCH(request: NextRequest, { params }: { params: { lessonId: string } }) {
  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured" }, { status: 503 });
  }

  const session = await getDemoSession();
  if (!isAdminRole(session.user.role) || !session.activeClient) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const activeClientId = session.activeClient.id;

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please fix the highlighted fields.",
        issues: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message
        }))
      },
      { status: 400 }
    );
  }

  const { material, quiz, ...lessonFields } = parsed.data;
  const supabase = createSupabaseAdminClient();
  const lessonId = params.lessonId;

  try {
    const { data: lesson } = await supabase
      .from("lessons")
      .select("id")
      .eq("id", lessonId)
      .eq("client_id", activeClientId)
      .maybeSingle();

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found in the active client workspace" }, { status: 404 });
    }

    if (Object.keys(lessonFields).length > 0) {
      const { error } = await supabase.from("lessons").update({
        ...(lessonFields.title && { title: lessonFields.title }),
        ...(lessonFields.description && { description: lessonFields.description }),
        ...(lessonFields.status && { status: lessonFields.status }),
        ...(lessonFields.durationMinutes && { duration_minutes: lessonFields.durationMinutes }),
        ...(lessonFields.videoUrl && { video_url: lessonFields.videoUrl }),
        updated_at: new Date().toISOString()
      }).eq("id", lessonId).eq("client_id", activeClientId);
      if (error) throw error;
    }

    if (material) {
      const { data: existing } = await supabase
        .from("lesson_materials")
        .select("id")
        .eq("lesson_id", lessonId)
        .eq("client_id", activeClientId)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase.from("lesson_materials").update({
          title: material.title,
          type: material.type,
          url: material.url,
          summary: material.summary ?? null,
          updated_at: new Date().toISOString()
        }).eq("lesson_id", lessonId).eq("client_id", activeClientId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("lesson_materials").insert({
          client_id: activeClientId,
          lesson_id: lessonId,
          title: material.title,
          type: material.type,
          url: material.url,
          summary: material.summary ?? null
        });
        if (error) throw error;
      }
    }

    if (quiz) {
      const { data: existing } = await supabase
        .from("lesson_quizzes")
        .select("id")
        .eq("lesson_id", lessonId)
        .eq("client_id", activeClientId)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase.from("lesson_quizzes").update({
          title: quiz.title,
          description: quiz.description ?? null,
          question_count: quiz.questionCount,
          time_limit_minutes: quiz.timeLimitMinutes,
          pass_percentage: quiz.passPercentage,
          updated_at: new Date().toISOString()
        }).eq("lesson_id", lessonId).eq("client_id", activeClientId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("lesson_quizzes").insert({
          client_id: activeClientId,
          lesson_id: lessonId,
          title: quiz.title,
          description: quiz.description ?? null,
          question_count: quiz.questionCount,
          time_limit_minutes: quiz.timeLimitMinutes,
          pass_percentage: quiz.passPercentage
        });
        if (error) throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message
      : typeof error === "object" && error && "message" in error && typeof error.message === "string"
        ? error.message : "Unable to update lesson";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
