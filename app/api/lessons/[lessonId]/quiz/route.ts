import { NextRequest, NextResponse } from "next/server";

import { getDemoSession } from "@/lib/demo-session";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/server";

export async function GET(_: NextRequest, { params }: { params: { lessonId: string } }) {
  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const session = await getDemoSession();
  if (!session.activeClient) {
    return NextResponse.json({ error: "No active client selected" }, { status: 400 });
  }
  const activeClientId = session.activeClient.id;

  const supabase = createSupabaseAdminClient();
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id")
    .eq("id", params.lessonId)
    .eq("client_id", activeClientId)
    .maybeSingle();

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found in the active client workspace" }, { status: 404 });
  }

  const { data: quiz, error: quizError } = await supabase
    .from("lesson_quizzes")
    .select("id, title, description, question_count, time_limit_minutes, pass_percentage")
    .eq("lesson_id", params.lessonId)
    .eq("client_id", activeClientId)
    .maybeSingle();

  if (quizError) return NextResponse.json({ error: quizError.message }, { status: 500 });
  if (!quiz) return NextResponse.json({ error: "No quiz found for this lesson" }, { status: 404 });

  const { data: questions, error: questionsError } = await supabase
    .from("quiz_questions")
    .select("id, question, option_a, option_b, option_c, option_d, correct_option, position")
    .eq("quiz_id", quiz.id)
    .eq("client_id", activeClientId)
    .order("position", { ascending: true });

  if (questionsError) return NextResponse.json({ error: questionsError.message }, { status: 500 });

  return NextResponse.json({
    quiz: {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      questionCount: quiz.question_count,
      timeLimitMinutes: quiz.time_limit_minutes,
      passPercentage: quiz.pass_percentage
    },
    questions: (questions ?? []).map((q) => ({
      id: q.id,
      question: q.question,
      options: { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d },
      correctOption: q.correct_option,
      position: q.position
    }))
  });
}
