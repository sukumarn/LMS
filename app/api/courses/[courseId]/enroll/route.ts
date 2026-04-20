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
  const normalizedEmail = email.trim().toLowerCase();

  // First, check if user already exists by exact or case-insensitive email.
  const { data: existingUser, error: existingUserError } = await supabase
    .from("users")
    .select("id")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (existingUserError) {
    console.error("[enroll] user lookup error:", existingUserError);
    return { userId: null, error: existingUserError };
  }

  if (existingUser) {
    const { error: updateError } = await supabase
      .from("users")
      .update({
        email: normalizedEmail,
        name,
        image: image ?? null
      })
      .eq("id", existingUser.id);

    if (updateError) {
      console.error("[enroll] user update error:", updateError);
      return { userId: null, error: updateError };
    }

    return { userId: existingUser.id, error: null };
  }

  // User doesn't exist yet — upsert by unique email so repeated registration attempts are safe.
  const { data: newUser, error: upsertError } = await supabase
    .from("users")
    .upsert({
      email: normalizedEmail,
      name,
      image: image ?? null
    }, { onConflict: "email" })
    .select("id")
    .single();

  if (upsertError) {
    // A concurrent request may still win before the response returns. Retry one lookup before failing.
    const { data: recoveredUser } = await supabase
      .from("users")
      .select("id")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (recoveredUser?.id) {
      return { userId: recoveredUser.id, error: null };
    }

    console.error("[enroll] user upsert error:", upsertError);
    return { userId: null, error: upsertError };
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
    return NextResponse.json(
      {
        error: "Unable to prepare learner profile",
        details:
          typeof userError === "object" && userError && "message" in userError && typeof userError.message === "string"
            ? userError.message
            : undefined
      },
      { status: 500 }
    );
  }

  activeClientId = activeClientId ?? DEFAULT_CLIENT_ID;

  // Ensure the learner has an active membership in the client they are registering under.
  const { error: membershipError } = await supabase.from("client_memberships").upsert(
    {
      client_id: activeClientId,
      user_id: internalUserId,
      role: "LEARNER",
      status: "ACTIVE"
    },
    { onConflict: "client_id,user_id" }
  );

  if (membershipError) {
    console.error("[enroll] membership upsert error:", membershipError);
    return NextResponse.json({ error: "Unable to prepare learner membership" }, { status: 500 });
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
