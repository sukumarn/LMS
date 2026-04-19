import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getDemoSession, isAdminRole } from "@/lib/demo-session";
import { slugify } from "@/lib/slug";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/server";

const questionSchema = z.object({
  question: z.string().min(3),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().min(1),
  optionD: z.string().min(1),
  correctOption: z.enum(["A", "B", "C", "D"])
});

const payloadSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(3),
  description: z.string().min(10),
  durationMinutes: z.number().int().min(1),
  videoUrl: z.string().url(),
  materialTitle: z.string().min(2),
  materialType: z.string().min(2),
  materialUrl: z.string().url(),
  materialSummary: z.string().optional().nullable(),
  quizTitle: z.string().min(2),
  quizDescription: z.string().optional().nullable(),
  quizQuestionCount: z.number().int().min(0),
  quizTimeLimitMinutes: z.number().int().min(1),
  quizPassPercentage: z.number().int().min(0).max(100),
  questions: z.array(questionSchema).optional().default([])
});

export async function POST(request: NextRequest) {
  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured" }, { status: 503 });
  }

  const session = await getDemoSession();

  if (!isAdminRole(session.user.role) || !session.activeClient) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const activeClientId = session.activeClient.id;

  const parsed = payloadSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please fix the highlighted lesson fields.",
        issues: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message
        }))
      },
      { status: 400 }
    );
  }

  const payload = parsed.data;
  const baseSlug = slugify(payload.title);
  try {
    const supabase = createSupabaseAdminClient();
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", payload.courseId)
      .eq("client_id", activeClientId)
      .maybeSingle();

    if (courseError) throw courseError;
    if (!course) {
      return NextResponse.json({ error: "Course not found in the active client workspace" }, { status: 404 });
    }

    const { data: existingRows, error: existingError } = await supabase
      .from("lessons")
      .select("slug, position")
      .eq("course_id", payload.courseId)
      .eq("client_id", activeClientId);

    if (existingError) throw existingError;

    const slugMatches = (existingRows ?? []).filter((r) => r.slug === baseSlug || r.slug?.startsWith(`${baseSlug}-`));
    const nextPosition = (existingRows ?? []).reduce((max, r) => Math.max(max, r.position ?? 0), 0) + 1;

    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .insert({
        client_id: activeClientId,
        course_id: payload.courseId,
        title: payload.title,
        slug: slugMatches.length ? `${baseSlug}-${slugMatches.length + 1}` : baseSlug,
        description: payload.description,
        position: nextPosition,
        duration_minutes: payload.durationMinutes,
        video_url: payload.videoUrl
      })
      .select("*")
      .single();

    if (lessonError) throw lessonError;

    const { error: materialError } = await supabase.from("lesson_materials").insert({
      client_id: activeClientId,
      lesson_id: lesson.id,
      title: payload.materialTitle,
      type: payload.materialType,
      url: payload.materialUrl,
      summary: payload.materialSummary || null
    });

    if (materialError) {
      await supabase.from("lessons").delete().eq("id", lesson.id);
      throw materialError;
    }

    const { data: quiz, error: quizError } = await supabase.from("lesson_quizzes").insert({
      client_id: activeClientId,
      lesson_id: lesson.id,
      title: payload.quizTitle,
      description: payload.quizDescription || null,
      question_count: payload.quizQuestionCount,
      time_limit_minutes: payload.quizTimeLimitMinutes,
      pass_percentage: payload.quizPassPercentage
    }).select("*").single();

    if (quizError) {
      await supabase.from("lessons").delete().eq("id", lesson.id);
      throw quizError;
    }

    if (payload.questions.length > 0) {
      const { error: questionsError } = await supabase.from("quiz_questions").insert(
        payload.questions.map((q, index) => ({
          client_id: activeClientId,
          quiz_id: quiz.id,
          question: q.question,
          option_a: q.optionA,
          option_b: q.optionB,
          option_c: q.optionC,
          option_d: q.optionD,
          correct_option: q.correctOption,
          position: index + 1
        }))
      );

      if (questionsError) {
        await supabase.from("lessons").delete().eq("id", lesson.id);
        throw questionsError;
      }
    }

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error && "message" in error && typeof error.message === "string"
          ? error.message
          : "Unable to create lesson";

    const details =
      typeof error === "object" && error && "details" in error && typeof error.details === "string"
        ? error.details
        : undefined;

    return NextResponse.json({ error: message, details }, { status: 500 });
  }
}
