"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Search, Sparkles } from "lucide-react";

import { useAuth } from "@/lib/auth-provider";
import { useLMSStore } from "@/store/lms-store";
import { ThemeToggle } from "@/components/theme-toggle";
import { ClientSwitcher } from "@/components/layout/client-switcher";
import { AvatarChip } from "@/components/layout/profile-chip";
import { RoleSwitcher } from "@/components/layout/role-switcher";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AppRole, SessionMembership } from "@/lib/demo-session";

type SessionContext = {
  user: {
    role: AppRole;
  };
  activeClient: {
    id: string;
    name: string;
    slug: string;
  } | null;
  memberships: SessionMembership[];
  availableRoles: AppRole[];
};

export function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const setUserRole = useLMSStore((s) => s.setUserRole);
  const [sessionContext, setSessionContext] = useState<SessionContext | null>(null);

  const displayName = (user as any)?.user_metadata?.full_name || user?.email || "User";
  const avatarUrl = (user as any)?.user_metadata?.avatar_url;

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  useEffect(() => {
    let cancelled = false;

    fetch("/api/session/context")
      .then((response) => response.json())
      .then((payload: SessionContext) => {
        if (!cancelled) {
          setSessionContext(payload);
          setUserRole(payload?.user?.role ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSessionContext(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className="glass-panel gradient-border sticky top-4 z-30 flex flex-col gap-4 rounded-[28px] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-11" placeholder="Search courses, learners, analytics..." />
      </div>
      <div className="flex items-center gap-3">
        {sessionContext ? (
          <>
            <ClientSwitcher
              activeClientId={sessionContext.activeClient?.id ?? null}
              activeClientName={sessionContext.activeClient?.name ?? null}
              clients={sessionContext.memberships.map((membership) => ({
                clientId: membership.clientId,
                clientName: membership.clientName,
                clientSlug: membership.clientSlug
              }))}
              onClientChange={(clientId) =>
                setSessionContext((current) =>
                  current
                    ? {
                        ...current,
                        activeClient:
                          current.memberships.find((membership) => membership.clientId === clientId)
                            ? {
                                id: clientId,
                                name:
                                  current.memberships.find((membership) => membership.clientId === clientId)?.clientName ??
                                  current.activeClient?.name ??
                                  "Workspace",
                                slug:
                                  current.memberships.find((membership) => membership.clientId === clientId)?.clientSlug ??
                                  current.activeClient?.slug ??
                                  "workspace"
                              }
                            : current.activeClient
                      }
                    : current
                )
              }
            />
            <RoleSwitcher
              role={sessionContext.user.role}
              roles={sessionContext.availableRoles}
              onRoleChange={(role) =>
                setSessionContext((current) =>
                  current
                    ? {
                        ...current,
                        user: {
                          ...current.user,
                          role
                        }
                      }
                    : current
                )
              }
            />
          </>
        ) : null}
        <Button variant="outline" className="hidden sm:inline-flex">
          <Sparkles className="h-4 w-4" />
          Smart insights
        </Button>
        <Button size="icon" variant="outline">
          <Bell className="h-4 w-4" />
        </Button>
        <ThemeToggle />
        <AvatarChip name={displayName} avatarUrl={avatarUrl} />
        <Button
          size="icon"
          variant="outline"
          onClick={handleSignOut}
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
