"use client";

import { useEffect, useState } from "react";
import { Globe2, AlertCircle, CheckCircle2 } from "lucide-react";

import { useAuth } from "@/lib/auth-provider";
import { Button } from "@/components/ui/button";

type Props = {
  token: string;
  orgName: string;
};

export function OnboardSignIn({ token, orgName }: Props) {
  const { signInWithGoogle, isConfigured } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Store token in cookie so the auth callback can pick it up
    document.cookie = `sb-onboarding-token=${token}; path=/; samesite=lax; max-age=3600`;
  }, [token]);

  async function handleSignIn() {
    setError(null);
    setIsLoading(true);
    const { error: authError } = await signInWithGoogle();
    if (authError) {
      setError(authError.message || "Google sign-in failed. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-2xl bg-primary/5 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm">
          You are setting up <span className="font-semibold">{orgName}</span>. After sign-in you will be the Admin of this workspace.
        </p>
      </div>

      {!isConfigured && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Supabase is not configured. Set <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your <code className="text-xs">.env.local</code>.</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Button
        size="lg"
        className="w-full"
        onClick={handleSignIn}
        disabled={isLoading || !isConfigured}
      >
        <Globe2 className="h-4 w-4" />
        {isLoading ? "Redirecting to Google..." : "Continue with Google"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        This link is single-use. Once you sign in, your account will be set up as Admin.
      </p>
    </div>
  );
}
