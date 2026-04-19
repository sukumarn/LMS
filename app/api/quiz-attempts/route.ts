import { NextRequest, NextResponse } from "next/server";
import { getDemoSession } from "@/lib/demo-session";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const session = await getDemoSession();
  if (!session.activeClient) {
    return NextResponse.json({ error: "No active client selected" }, { status: 400 });
  }
  const activeClientId = session.activeClient.id;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { quizId, scorePercent, passed, questionCount, correctCount, timeTakenSeconds, isSimulated } = body;

  if (typeof scorePercent !== "number" || typeof passed !== "boolean" || typeof questionCount !== "number") {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("quiz_attempts").insert({
    client_id: activeClientId,
    user_id: session.user.id,
    quiz_id: quizId ?? null,
    score_percent: scorePercent,
    passed,
    question_count: questionCount,
    correct_count: correctCount ?? 0,
    time_taken_seconds: timeTakenSeconds ?? null,
    is_simulated: isSimulated ?? false
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
