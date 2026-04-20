import { NextRequest, NextResponse } from "next/server";
import { getDemoSession } from "@/lib/demo-session";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const session = await getDemoSession();
  if (!session.user.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { quizId, scorePercent, passed, questionCount, correctCount, timeTakenSeconds, isSimulated } = body;

  if (typeof scorePercent !== "number" || typeof passed !== "boolean" || typeof questionCount !== "number") {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // Resolve internal user ID by email to handle OAuth UUID mismatch
  const { data: userRow } = await supabase
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .maybeSingle();
  const userId = userRow?.id ?? session.user.id;

  // Resolve active client from session or fall back to user's first membership
  let activeClientId = session.activeClient?.id;
  if (!activeClientId && userId) {
    const { data: membership } = await supabase
      .from("client_memberships")
      .select("client_id")
      .eq("user_id", userId)
      .eq("status", "ACTIVE")
      .maybeSingle();
    activeClientId = membership?.client_id ?? undefined;
  }

  if (!activeClientId) {
    return NextResponse.json({ error: "No active client" }, { status: 400 });
  }

  const { error } = await supabase.from("quiz_attempts").insert({
    client_id: activeClientId,
    user_id: userId,
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
