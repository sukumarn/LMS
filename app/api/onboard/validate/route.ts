import { NextRequest, NextResponse } from "next/server";

import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ valid: false, reason: "missing_token" }, { status: 400 });
  }

  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ valid: false, reason: "server_not_configured" }, { status: 503 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("onboarding_tokens")
    .select("org_name, org_plan, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ valid: false, reason: "invalid_token" }, { status: 404 });
  }

  if (data.used_at) {
    return NextResponse.json({ valid: false, reason: "already_used" }, { status: 410 });
  }

  if (new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, reason: "expired" }, { status: 410 });
  }

  return NextResponse.json({
    valid: true,
    orgName: data.org_name,
    orgPlan: data.org_plan
  });
}
