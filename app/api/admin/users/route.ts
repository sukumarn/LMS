import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { createSupabaseAdminClient, createSupabaseServerClient, hasSupabaseAdminEnv, hasSupabasePublicEnv } from "@/lib/supabase/server";

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

async function getRequestUserEmail(): Promise<string | null> {
  // Try NextAuth first
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) return session.user.email;
  } catch {}

  // Fall back to Supabase Auth
  if (!hasSupabasePublicEnv()) return null;
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email ?? null;
  } catch {}

  return null;
}

async function assertAdminAccess() {
  const email = await getRequestUserEmail();
  if (!email) return false;

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && email === adminEmail) return true;

  // Also allow users with ADMIN or INSTRUCTOR role in client_memberships
  if (!hasSupabaseAdminEnv()) return false;
  try {
    const admin = createSupabaseAdminClient();
    const { data: userRow } = await admin.from("users").select("id").eq("email", email).maybeSingle();
    if (!userRow) return false;
    const { data: membership } = await admin
      .from("client_memberships")
      .select("role")
      .eq("user_id", userRow.id)
      .in("role", ["ADMIN", "INSTRUCTOR"])
      .eq("status", "ACTIVE")
      .maybeSingle();
    return !!membership;
  } catch {}

  return false;
}

export async function GET() {
  if (!(await assertAdminAccess())) {
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
  if (!(await assertAdminAccess())) {
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
