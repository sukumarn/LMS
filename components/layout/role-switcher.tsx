"use client";

import { useTransition } from "react";
import { Building2, Shield, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import type { AppRole } from "@/lib/demo-session";
import { cn } from "@/lib/utils";

const roleMeta: Record<AppRole, { label: string; icon: typeof Shield }> = {
  PRODUCT_ADMIN: { label: "Platform Admin", icon: Shield },
  CLIENT_ADMIN: { label: "Admin", icon: Shield },
  INSTRUCTOR: { label: "Instructor", icon: Building2 },
  LEARNER: { label: "Learner", icon: UserRound }
};

export function RoleSwitcher({
  role,
  roles,
  onRoleChange
}: {
  role: AppRole;
  roles: AppRole[];
  onRoleChange?: (role: AppRole) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function updateRole(nextRole: AppRole) {
    startTransition(async () => {
      await fetch("/api/session/role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role: nextRole })
      });
      onRoleChange?.(nextRole);
      router.refresh();
    });
  }

  if (roles.length <= 1) return null;

  return (
    <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/60 p-1 dark:bg-white/5">
      {roles.map((value) => {
        const option = roleMeta[value];
        const active = value === role;
        return (
          <button
            key={value}
            type="button"
            disabled={isPending}
            onClick={() => updateRole(value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition",
              active ? "bg-white text-foreground shadow-sm dark:bg-white/10" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <option.icon className="h-3.5 w-3.5" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
