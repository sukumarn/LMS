"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signInWithGoogle: async () => ({ error: null }),
  signOut: async () => {},
  isConfigured: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseLoading, setSupabaseLoading] = useState(true);
  const { data: nextAuthSession, status: nextAuthStatus } = useSession();

  useEffect(() => {
    if (!supabase) {
      setSupabaseLoading(false);
      return undefined;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session || null);
      setSupabaseLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loading = supabaseLoading || nextAuthStatus === "loading";

  async function signInWithGoogle(): Promise<{ error: Error | null }> {
    if (!supabase) {
      return { error: new Error("Supabase auth is not configured.") };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    return { error: error ?? null };
  }

  async function signOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    await nextAuthSignOut({ redirect: false });
  }

  const supabaseUser = session?.user || null;
  // When logged in via NextAuth credentials, synthesize a minimal user object
  const nextAuthUser = !supabaseUser && nextAuthSession?.user
    ? ({ id: (nextAuthSession.user as any).id, email: nextAuthSession.user.email } as unknown as User)
    : null;

  return (
    <AuthContext.Provider
      value={{
        user: supabaseUser || nextAuthUser,
        session,
        loading,
        signInWithGoogle,
        signOut,
        isConfigured: isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
