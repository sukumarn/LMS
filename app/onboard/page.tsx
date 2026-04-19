import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/server";
import { OnboardSignIn } from "./OnboardSignIn";

async function OnboardContent({ token }: { token: string }) {
  if (!hasSupabaseAdminEnv()) notFound();

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("onboarding_tokens")
    .select("org_name, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();

  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 sm:p-10">
          <div className="flex items-center gap-3 text-destructive">
            <Building2 className="h-6 w-6" />
            <h1 className="text-2xl font-semibold">Invalid link</h1>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            This onboarding link does not exist. Ask your product admin to generate a new one.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (data.used_at) {
    return (
      <Card>
        <CardContent className="p-8 sm:p-10">
          <div className="flex items-center gap-3 text-destructive">
            <Building2 className="h-6 w-6" />
            <h1 className="text-2xl font-semibold">Link already used</h1>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            This onboarding link has already been used to set up <strong>{data.org_name}</strong>. Sign in at the login page instead.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (new Date(data.expires_at) < new Date()) {
    return (
      <Card>
        <CardContent className="p-8 sm:p-10">
          <div className="flex items-center gap-3 text-destructive">
            <Building2 className="h-6 w-6" />
            <h1 className="text-2xl font-semibold">Link expired</h1>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            This onboarding link expired. Ask your product admin to generate a new one.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-8 sm:p-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            Nova LMS
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Welcome to {data.org_name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with Google to activate your admin workspace.
          </p>
        </div>

        <OnboardSignIn token={token} orgName={data.org_name} />
      </CardContent>
    </Card>
  );
}

export default function OnboardPage({
  searchParams
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;

  if (!token) notFound();

  return (
    <main className="min-h-screen overflow-hidden bg-aurora-light px-4 py-10 dark:bg-aurora-dark">
      <div className="absolute inset-0 bg-mesh-gradient opacity-80" />
      <div className="container relative z-10 mx-auto max-w-xl">
        <Suspense
          fallback={
            <div className="glass-panel gradient-border rounded-[36px] p-8 text-muted-foreground">
              Validating link...
            </div>
          }
        >
          <OnboardContent token={token} />
        </Suspense>
      </div>
    </main>
  );
}
