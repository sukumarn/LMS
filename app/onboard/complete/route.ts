import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);
  const cookieStore = cookies();
  const token = cookieStore.get("sb-onboarding-token")?.value;

  if (!token) {
    return NextResponse.redirect(`${origin}/login?error=missing_onboarding_token`);
  }

  // Get the authenticated Supabase user
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          for (const cookie of cookiesToSet) {
            cookieStore.set(cookie);
          }
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=not_authenticated`);
  }

  const supabase = createSupabaseAdminClient();

  // Validate and claim the token
  const { data: tokenRow, error: tokenError } = await supabase
    .from("onboarding_tokens")
    .select("id, org_name, org_plan, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();

  if (tokenError || !tokenRow) {
    return NextResponse.redirect(`${origin}/login?error=invalid_onboarding_token`);
  }

  if (tokenRow.used_at || new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.redirect(`${origin}/login?error=onboarding_token_expired`);
  }

  // Create the organization
  const slug = tokenRow.org_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({ name: tokenRow.org_name, slug, plan: tokenRow.org_plan, status: "ACTIVE" })
    .select("id")
    .single();

  if (clientError) {
    console.error("Failed to create org:", clientError.message);
    return NextResponse.redirect(`${origin}/login?error=org_creation_failed`);
  }

  // Upsert the user into public.users
  await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      name: user.user_metadata?.full_name ?? user.email ?? "Admin",
      image: user.user_metadata?.avatar_url ?? null,
      role: "ADMIN"
    },
    { onConflict: "id" }
  );

  // Add user as ADMIN of the new org
  await supabase.from("client_memberships").insert({
    client_id: client.id,
    user_id: user.id,
    role: "ADMIN",
    status: "ACTIVE"
  });

  // Mark token as used
  await supabase
    .from("onboarding_tokens")
    .update({ used_at: new Date().toISOString(), used_by_user_id: user.id })
    .eq("id", tokenRow.id);

  // Clear the onboarding cookie and redirect to dashboard
  const response = NextResponse.redirect(`${origin}/dashboard`);
  response.cookies.delete("sb-onboarding-token");

  return response;
}
