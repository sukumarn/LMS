import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: Record<string, unknown>) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] exchangeCodeForSession error:", error.message, error);
    }

    if (!error) {
      const onboardingToken = cookieStore.get("sb-onboarding-token")?.value;
      if (onboardingToken) {
        return NextResponse.redirect(`${origin}/onboard/complete`);
      }

      // Upsert user and check membership — wrapped so failures never break the OAuth flow
      if (hasSupabaseAdminEnv()) {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();

          if (authUser?.email) {
            const admin = createSupabaseAdminClient();

            // Ensure user exists in the users table — omit role so DB default applies
            // (avoids enum mismatch between USER/LEARNER across migrations)
            await admin.from("users").upsert(
              {
                email: authUser.email,
                name: authUser.user_metadata?.full_name || authUser.email,
                image: authUser.user_metadata?.avatar_url ?? null,
              },
              { onConflict: "email", ignoreDuplicates: true }
            );

            // Check if the user has any org membership
            const { data: userRow } = await admin
              .from("users")
              .select("id")
              .eq("email", authUser.email)
              .maybeSingle();

            // Admin email always gets through regardless of membership state
            const isAdmin = authUser.email === process.env.ADMIN_EMAIL;

            if (!isAdmin && userRow) {
              const { data: memberships } = await admin
                .from("client_memberships")
                .select("id")
                .eq("user_id", userRow.id)
                .eq("status", "ACTIVE")
                .limit(1);

              if (!memberships?.length) {
                return NextResponse.redirect(`${origin}/pending`);
              }
            }
          }
        } catch {
          // If the membership check fails for any reason, fall through to dashboard
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If there was an error or no code, redirect to login with an error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
