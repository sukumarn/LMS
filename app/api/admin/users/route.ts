import { NextResponse } from "next/server";

import { canManageUsers, getDemoSession, normalizeAppRole } from "@/lib/demo-session";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/server";

async function listAllAuthUsers(admin: ReturnType<typeof createSupabaseAdminClient>) {
  const users: Array<Record<string, any>> = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      return { users, error };
    }

    const pageUsers = data?.users ?? [];
    users.push(...pageUsers);

    if (pageUsers.length < perPage) {
      return { users, error: null };
    }

    page += 1;
  }
}

export async function GET() {
  const session = await getDemoSession();
  if (!canManageUsers(session.user.role)) {
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
    authUsersResult,
  ] = await Promise.all([
    admin.from("users").select("id, email, name, image, created_at"),
    admin.from("client_memberships").select("user_id, client_id, role, status"),
    listAllAuthUsers(admin),
  ]);

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  const membershipMap = new Map<string, { clientId: string | null; role: string | null; status: string | null; rank: number }>();
  for (const m of memberships ?? []) {
    const row = m as any;
    const nextRank = row.status === "ACTIVE" ? 2 : row.status === "INVITED" ? 1 : 0;
    const current = membershipMap.get(row.user_id);
    if (!current || nextRank >= current.rank) {
      membershipMap.set(row.user_id, {
        clientId: row.client_id ?? null,
        role: row.role ?? null,
        status: row.status ?? null,
        rank: nextRank,
      });
    }
  }

  // Build a map of app users keyed by email for quick lookup
  const appUserByEmail = new Map<string, any>();
  for (const u of appUsers ?? []) {
    const email = ((u as any).email as string).toLowerCase();
    appUserByEmail.set(email, u);
  }

  // Merge: start with app users table rows
  const merged = new Map<string, any>();
  for (const u of appUsers ?? []) {
    const email = ((u as any).email as string).toLowerCase();
    if (adminEmail && email === adminEmail.toLowerCase()) continue;
    merged.set((u as any).id, {
      id: (u as any).id,
      email,
      name: (u as any).name,
      image: (u as any).image,
      created_at: (u as any).created_at,
    });
  }

  // Add Supabase Auth users who don't have a users table row yet
  if (!authUsersResult.error) {
    for (const authUser of authUsersResult.users) {
      const email = authUser.email?.toLowerCase();
      if (!email) continue;
      if (adminEmail && email === adminEmail.toLowerCase()) continue;

      const existingAppUser = appUserByEmail.get(email);
      if (existingAppUser) {
        const existing = merged.get(existingAppUser.id);
        if (existing) {
          merged.set(existingAppUser.id, {
            ...existing,
            name: existing.name || authUser.user_metadata?.full_name || email,
            image: existing.image ?? authUser.user_metadata?.avatar_url ?? null,
          });
        }
      } else {
        // This user signed in via OAuth but upsert never ran — show them anyway
        merged.set(authUser.id, {
          id: authUser.id,
          email,
          name: authUser.user_metadata?.full_name || email,
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
      currentRole: normalizeAppRole(membership?.role ?? null) ?? null,
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
  if (!canManageUsers(session.user.role)) {
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

  const normalizedRole = normalizeAppRole(role);
  const validRoles = ["CLIENT_ADMIN", "INSTRUCTOR", "LEARNER"];
  if (!normalizedRole || !validRoles.includes(normalizedRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Ensure user exists in the users table before creating membership
  let internalUserId = userId;
  const authUser = await admin.auth.admin.getUserById(userId);
  if (authUser.data?.user?.email) {
    const email = authUser.data.user.email.toLowerCase();
    const name = authUser.data.user.user_metadata?.full_name || email;
    const image = authUser.data.user.user_metadata?.avatar_url ?? null;

    const { data: existingUser } = await admin
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser?.id) {
      internalUserId = existingUser.id;
      await admin.from("users").update({ name, image }).eq("id", existingUser.id);
    } else {
      const { data: insertedUser, error: insertError } = await admin
        .from("users")
        .insert({ id: userId, email, name, image })
        .select("id")
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      internalUserId = insertedUser.id;
    }
  }

  const { error } = await admin.from("client_memberships").upsert(
    { user_id: internalUserId, client_id: clientId, role: normalizedRole, status: "ACTIVE" },
    { onConflict: "client_id,user_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
