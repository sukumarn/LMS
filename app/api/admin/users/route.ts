import { NextResponse } from "next/server";

import { getDemoSession, isAdminRole } from "@/lib/demo-session";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/server";

export async function GET() {
  const session = await getDemoSession();

  if (!isAdminRole(session.user.role) || !session.activeClient) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }

  const admin = createSupabaseAdminClient();

  const [{ data: allUsers, error: usersError }, { data: memberships }] = await Promise.all([
    admin.from("users").select("id, email, name, image, created_at").order("created_at", { ascending: false }),
    admin.from("client_memberships").select("user_id, client_id, role, status"),
  ]);

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  const adminEmail = process.env.ADMIN_EMAIL;

  // Build a membership map keyed by user_id
  const membershipMap = new Map<string, { clientId: string; role: string; status: string }>();
  for (const m of memberships ?? []) {
    membershipMap.set((m as any).user_id, {
      clientId: (m as any).client_id,
      role: (m as any).role,
      status: (m as any).status,
    });
  }

  const users = (allUsers ?? [])
    .filter((u: any) => u.email !== adminEmail)
    .map((u: any) => {
      const membership = membershipMap.get(u.id);
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        image: u.image,
        created_at: u.created_at,
        currentRole: membership?.role ?? null,
        currentClientId: membership?.clientId ?? null,
        membershipStatus: membership?.status ?? null,
      };
    });

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

  // Upsert membership — inserts if new, updates role/client if existing
  const { error } = await admin.from("client_memberships").upsert(
    { user_id: userId, client_id: clientId, role, status: "ACTIVE" },
    { onConflict: "client_id,user_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
