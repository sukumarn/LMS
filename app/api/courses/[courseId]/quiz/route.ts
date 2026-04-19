import { NextRequest, NextResponse } from "next/server";
import { getDemoSession } from "@/lib/demo-session";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/server";

export async function GET(_: NextRequest, { params }: { params: { courseId: string } }) {
  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const session = await getDemoSession();
  if (!session.activeClient) {
    return NextResponse.json({ error: "No active client selected" }, { status: 400 });
  }
  const activeClientId = session.activeClient.id;

  const supabase = createSupabaseAdminClient();

  // Get the course by slug to find its ID
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, title")
    .eq("slug", params.courseId)
    .eq("client_id", activeClientId)
    .maybeSingle();

  if (courseError) return NextResponse.json({ error: courseError.message }, { status: 500 });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  // Get all published lessons for this course
  const { data: lessons, error: lessonsError } = await supabase
    .from("lessons")
    .select("id, title, position")
    .eq("course_id", course.id)
    .eq("client_id", activeClientId)
    .order("position", { ascending: true });

  if (lessonsError) return NextResponse.json({ error: lessonsError.message }, { status: 500 });
  if (!lessons?.length) return NextResponse.json({ error: "No lessons found for this course" }, { status: 404 });

  const lessonIds = lessons.map((l) => l.id);

  // Get all quizzes for these lessons
  const { data: quizzes, error: quizzesError } = await supabase
    .from("lesson_quizzes")
    .select("id, lesson_id, title, pass_percentage, time_limit_minutes")
    .eq("client_id", activeClientId)
    .in("lesson_id", lessonIds);

  if (quizzesError) return NextResponse.json({ error: quizzesError.message }, { status: 500 });
  if (!quizzes?.length) return NextResponse.json({ error: "No quizzes found for this course" }, { status: 404 });

  const quizIds = quizzes.map((q) => q.id);

  // Get all questions for all quizzes
  const { data: questions, error: questionsError } = await supabase
    .from("quiz_questions")
    .select("id, quiz_id, question, option_a, option_b, option_c, option_d, correct_option, position")
    .eq("client_id", activeClientId)
    .in("quiz_id", quizIds)
    .order("position", { ascending: true });

  if (questionsError) return NextResponse.json({ error: questionsError.message }, { status: 500 });
  if (!questions?.length) return NextResponse.json({ error: "No questions found for this course" }, { status: 404 });

  // Build a map of quizId → lessonTitle for labelling
  const quizLessonMap = new Map(
    quizzes.map((q) => {
      const lesson = lessons.find((l) => l.id === q.lesson_id);
      return [q.id, lesson?.title ?? "Unknown lesson"];
    })
  );

  const avgPassPercentage = Math.round(
    quizzes.reduce((sum, q) => sum + q.pass_percentage, 0) / quizzes.length
  );

  const totalTimeMinutes = quizzes.reduce((sum, q) => sum + q.time_limit_minutes, 0);

  return NextResponse.json({
    courseTitle: course.title,
    totalQuestions: questions.length,
    passPercentage: avgPassPercentage,
    timeLimitMinutes: totalTimeMinutes,
    questions: questions.map((q) => ({
      id: q.id,
      question: q.question,
      lessonTitle: quizLessonMap.get(q.quiz_id) ?? "",
      options: { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d },
      correctOption: q.correct_option,
      position: q.position
    }))
  });
}
