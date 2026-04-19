"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Globe2, LogIn } from "lucide-react";

import { useAuth } from "@/lib/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, signInWithGoogle, isConfigured } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  useEffect(() => {
    const authError = searchParams.get("error");
    if (authError) {
      setError("Authentication failed. Please try again.");
    }
  }, [searchParams]);

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setIsLoading(false);
    } else {
      router.replace("/dashboard");
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setIsGoogleLoading(true);
    const { error: authError } = await signInWithGoogle();
    if (authError) {
      setError(authError.message || "Google sign-in failed.");
      setIsGoogleLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen overflow-hidden bg-aurora-light px-4 py-10 dark:bg-aurora-dark">
        <div className="absolute inset-0 bg-mesh-gradient opacity-80" />
        <div className="container relative z-10 mx-auto flex min-h-screen items-center justify-center">
          <div className="glass-panel gradient-border rounded-[36px] p-8 text-muted-foreground">
            Checking account...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-aurora-light px-4 py-10 dark:bg-aurora-dark">
      <div className="absolute inset-0 bg-mesh-gradient opacity-80" />
      <div className="container relative z-10 mx-auto max-w-3xl">
        <Card className="overflow-hidden">
          <CardContent className="p-8 sm:p-10">
            <div className="mb-8">
              <p className="text-sm text-muted-foreground">Nova LMS</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">Sign in</h1>
            </div>

            {error && (
              <div className="mb-6 rounded-3xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Admin credentials form */}
            <form onSubmit={handleCredentialsLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                <LogIn className="h-4 w-4" />
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            {isConfigured && (
              <>
                <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="h-px flex-1 bg-border" />
                  or
                  <div className="h-px flex-1 bg-border" />
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                >
                  <Globe2 className="h-4 w-4" />
                  {isGoogleLoading ? "Redirecting..." : "Continue with Google"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen overflow-hidden bg-aurora-light px-4 py-10 dark:bg-aurora-dark">
          <div className="absolute inset-0 bg-mesh-gradient opacity-80" />
          <div className="container relative z-10 mx-auto flex min-h-screen items-center justify-center">
            <div className="glass-panel gradient-border rounded-[36px] p-8 text-muted-foreground">
              Loading...
            </div>
          </div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
