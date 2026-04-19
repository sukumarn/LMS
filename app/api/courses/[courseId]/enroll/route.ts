import { NextResponse } from "next/server";

import { getDemoSession, isAdminRole } from "@/lib/demo-session";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/server";

export async function POST(_: Request, { params }: { params: { courseId: string } }) {
  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured" }, { status: 503 });
  }

  const session = await getDemoSession();

  if (isAdminRole(session.user.role) || !session.activeClient) {
    return NextResponse.json({ error: "Admin users cannot register courses" }, { status: 403 });
  }
  const activeClientId = session.activeClient.id;

  const supabase = createSupabaseAdminClient();
  const { error: userUpsertError } = await supabase.from("users").upsert(
    {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image ?? null
    },
    { onConflict: "id" }
  );

  if (userUpsertError) {
    return NextResponse.json({ error: "Unable to prepare learner profile" }, { status: 500 });
  }

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, status")
    .eq("slug", params.courseId)
    .eq("client_id", activeClientId)
    .maybeSingle();

  if (courseError) {
    return NextResponse.json({ error: "Unable to load course" }, { status: 500 });
  }

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  if (course.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Course is not open for registration" }, { status: 400 });
  }

  try {
    const { data: enrollment, error } = await supabase
      .from("enrollments")
      .upsert(
        {
          client_id: activeClientId,
          user_id: session.user.id,
          course_id: course.id,
          status: "ACTIVE"
        },
        { onConflict: "user_id,course_id" }
      )
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ enrollment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to register course" }, { status: 500 });
  }
}
