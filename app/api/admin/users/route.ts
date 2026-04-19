import { NextResponse } from "next/server";

import { getDemoSession, isAdminRole } from "@/lib/demo-session";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/server";

export async function GET() {
  const session = await getDemoSession();

  if (!isAdminRole(session.user.role) || !session.activeClient) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ error: "Server not configured — add SUPABASE_SERVICE_ROLE_KEY to env" }, { status: 503 });
  }

  const admin = createSupabaseAdminClient();
  const adminEmail = process.env.ADMIN_EMAIL;

  // Fetch app users, memberships, and Supabase auth users in parallel
  const [
    { data: appUsers, error: usersError },
    { data: memberships },
    { data: authData, error: authError },
  ] = await Promise.all([
    admin.from("users").select("id, email, name, image, created_at"),
    admin.from("client_memberships").select("user_id, client_id, role, status"),
    admin.auth.admin.listUsers(),
  ]);

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  const membershipMap = new Map<string, { clientId: string; role: string; status: string }>();
  for (const m of memberships ?? []) {
    membershipMap.set((m as any).user_id, {
      clientId: (m as any).client_id,
      role: (m as any).role,
      status: (m as any).status,
    });
  }

  // Build a map of app users keyed by email for quick lookup
  const appUserByEmail = new Map<string, any>();
  for (const u of appUsers ?? []) {
    appUserByEmail.set((u as any).email, u);
  }

  // Merge: start with app users table rows
  const merged = new Map<string, any>();
  for (const u of appUsers ?? []) {
    if ((u as any).email === adminEmail) continue;
    merged.set((u as any).id, {
      id: (u as any).id,
      email: (u as any).email,
      name: (u as any).name,
      image: (u as any).image,
      created_at: (u as any).created_at,
    });
  }

  // Add Supabase Auth users who don't have a users table row yet
  if (!authError && authData?.users) {
    for (const authUser of authData.users) {
      if (!authUser.email || authUser.email === adminEmail) continue;
      if (!appUserByEmail.has(authUser.email)) {
        // This user signed in via OAuth but upsert never ran — show them anyway
        merged.set(authUser.id, {
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.full_name || authUser.email,
          image: authUser.user_metadata?.avatar_url ?? null,
          created_at: authUser.created_at,
        });
      }
    }
  }

  const users = Array.from(merged.values()).map((u) => {
    const membership = membershipMap.get(u.id);
    return {
      ...u,
      currentRole: membership?.role ?? null,
      currentClientId: membership?.clientId ?? null,
      membershipStatus: membership?.status ?? null,
    };
  });

  // Sort by created_at descending
  users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const session = await getDemoSession();

  if (!isAdminRole(session.user.role) || !session.activeClient) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }

  const body = await request.json();
  const { userId, clientId, role } = body as { userId: string; clientId: string; role: string };

  if (!userId || !clientId || !role) {
    return NextResponse.json({ error: "userId, clientId, and role are required" }, { status: 400 });
  }

  const validRoles = ["ADMIN", "INSTRUCTOR", "LEARNER"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Ensure user exists in the users table before creating membership
  const authUser = await admin.auth.admin.getUserById(userId);
  if (authUser.data?.user?.email) {
    const email = authUser.data.user.email;
    const name = authUser.data.user.user_metadata?.full_name || email;
    const image = authUser.data.user.user_metadata?.avatar_url ?? null;

    // Try LEARNER role first, fall back to USER for older schemas
    const { error: upsertErr } = await admin
      .from("users")
      .upsert({ email, name, image, role: "LEARNER" }, { onConflict: "email", ignoreDuplicates: true });

    if (upsertErr) {
      await admin
        .from("users")
        .upsert({ email, name, image, role: "USER" }, { onConflict: "email", ignoreDuplicates: true });
    }
  }

  // Get the internal user id (from users table, not auth UUID)
  const { data: userRow } = await admin
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  const internalUserId = userRow?.id ?? userId;

  const { error } = await admin.from("client_memberships").upsert(
    { user_id: internalUserId, client_id: clientId, role, status: "ACTIVE" },
    { onConflict: "client_id,user_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
