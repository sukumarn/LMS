import { NextResponse } from "next/server";

import { getDemoSession, isAdminRole } from "@/lib/demo-session";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/server";

const DEFAULT_CLIENT_ID = "b1776b77-2994-49fb-bb10-6db11ad1f001"; // Operator Campus

async function ensureUserExists(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  email: string,
  name: string,
  image: string | null
) {
  // First, check if user already exists by email
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingUser) {
    return { userId: existingUser.id, error: null };
  }

  // User doesn't exist — insert with role set explicitly to LEARNER
  const { data: newUser, error: insertError } = await supabase
    .from("users")
    .insert({
      email,
      name,
      image: image ?? null,
      role: "LEARNER",
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("[enroll] user insert error:", insertError);
    return { userId: null, error: insertError };
  }

  return { userId: newUser.id, error: null };
}

export async function POST(_: Request, { params }: { params: { courseId: string } }) {
  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured" }, { status: 503 });
  }

  const session = await getDemoSession();

  if (isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Admin users cannot register courses" }, { status: 403 });
  }

  if (!session.user.email) {
    return NextResponse.json({ error: "No authenticated user" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  // Resolve the active client — if missing, auto-assign to default client
  let activeClientId = session.activeClient?.id;

  // Ensure user exists in the users table
  const { userId: internalUserId, error: userError } = await ensureUserExists(
    supabase,
    session.user.email,
    session.user.name,
    session.user.image ?? null
  );

  if (userError || !internalUserId) {
    return NextResponse.json({ error: "Unable to prepare learner profile" }, { status: 500 });
  }

  if (!activeClientId) {
    // Auto-create a LEARNER membership for the default client
    const { error: membershipError } = await supabase.from("client_memberships").upsert(
      {
        client_id: DEFAULT_CLIENT_ID,
        user_id: internalUserId,
        role: "LEARNER",
        status: "ACTIVE",
      },
      { onConflict: "client_id,user_id" }
    );

    if (membershipError) {
      console.error("[enroll] membership upsert error:", membershipError);
    }

    activeClientId = DEFAULT_CLIENT_ID;
  }

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, status")
    .eq("slug", params.courseId)
    .eq("client_id", activeClientId)
    .maybeSingle();

  if (courseError) {
    console.error("[enroll] course lookup error:", courseError);
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
          user_id: internalUserId,
          course_id: course.id,
          status: "ACTIVE",
        },
        { onConflict: "user_id,course_id" }
      )
      .select("*")
      .single();

    if (error) {
      console.error("[enroll] enrollment upsert error:", error);
      throw error;
    }

    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (err) {
    console.error("[enroll] enrollment failed:", err);
    return NextResponse.json({ error: "Unable to register course" }, { status: 500 });
  }
}
