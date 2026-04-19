import { cookies } from "next/headers";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  hasSupabaseAdminEnv,
  hasSupabasePublicEnv
} from "@/lib/supabase/server";

export type AppRole = "ADMIN" | "INSTRUCTOR" | "LEARNER";

export type SessionMembership = {
  clientId: string;
  clientName: string;
  clientSlug: string;
  clientStatus: string;
  role: AppRole;
  status: string;
};

export type AppSession = {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    role: AppRole;
  };
  activeClient: {
    id: string;
    name: string;
    slug: string;
    status: string;
  } | null;
  memberships: SessionMembership[];
  availableRoles: AppRole[];
};

export async function getDemoSession(): Promise<AppSession> {
  const cookieStore = cookies();
  const roleCookie = cookieStore.get("nova-role")?.value as AppRole | undefined;
  const clientCookie = cookieStore.get("nova-client")?.value;

  const authUser = await resolveAuthenticatedUser();

  if (authUser) {
    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdminEmail = !!(adminEmail && authUser.email === adminEmail);

    const dbContext = await resolveUserContextFromDatabase(authUser.id, authUser.email, clientCookie, roleCookie);

    if (dbContext) {
      // Admin email always keeps ADMIN role regardless of what's stored in DB
      const role: AppRole = isAdminEmail ? "ADMIN" : dbContext.role;
      return {
        user: { id: authUser.id, email: authUser.email, name: authUser.name, image: authUser.image ?? null, role },
        activeClient: dbContext.activeClient,
        memberships: dbContext.memberships,
        availableRoles: isAdminEmail ? ["ADMIN"] : dbContext.availableRoles
      };
    }

    // Admin email gets access even with no DB membership
    if (isAdminEmail) {
      return {
        user: { id: authUser.id, email: authUser.email, name: authUser.name, image: authUser.image ?? null, role: "ADMIN" },
        activeClient: null,
        memberships: [],
        availableRoles: ["ADMIN"]
      };
    }

    // Authenticated but no membership assigned yet — pending state
    return {
      user: { id: authUser.id, email: authUser.email, name: authUser.name, image: authUser.image ?? null, role: "LEARNER" },
      activeClient: null,
      memberships: [],
      availableRoles: []
    };
  }

  return {
    user: {
      id: "",
      email: "",
      name: "Guest",
      image: null,
      role: "LEARNER"
    },
    activeClient: null,
    memberships: [],
    availableRoles: []
  };
}

async function resolveAuthenticatedUser() {
  // 1. Check NextAuth session (email/password login)
  try {
    const session = await getServerSession(authOptions);
    if (session?.user && (session.user as any).id) {
      return {
        id: (session.user as any).id as string,
        email: session.user.email || "unknown@email.com",
        name: session.user.name || "User",
        image: session.user.image ?? null
      };
    }
  } catch {}

  // 2. Fall back to Supabase Auth (Google OAuth)
  if (!hasSupabasePublicEnv()) return null;

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return null;

    return {
      id: user.id,
      email: user.email || "unknown@email.com",
      name: user.user_metadata?.full_name || user.email || "User",
      image: user.user_metadata?.avatar_url ?? null
    };
  } catch {
    return null;
  }
}

async function resolveUserContextFromDatabase(
  userId: string,
  userEmail: string,
  clientCookie?: string,
  roleCookie?: AppRole
) {
  if (!hasSupabaseAdminEnv()) return null;

  try {
    const supabase = createSupabaseAdminClient();

    // Resolve internal user ID by email — handles Google OAuth UUID mismatch
    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .eq("email", userEmail)
      .maybeSingle();

    const internalUserId = userRow?.id ?? userId;

    const { data: membershipRows } = await supabase
      .from("client_memberships")
      .select("client_id, role, status, clients(id, name, slug, status)")
      .eq("user_id", internalUserId)
      .eq("status", "ACTIVE");

    const memberships = ((membershipRows ?? []) as Array<Record<string, any>>)
      .map((membership) => ({
        clientId: membership.client_id as string,
        clientName: membership.clients?.name as string,
        clientSlug: membership.clients?.slug as string,
        clientStatus: membership.clients?.status as string,
        role: membership.role as AppRole,
        status: membership.status as string
      }))
      .filter((m) => m.clientId && m.clientName);

    if (!memberships.length) return null;

    const activeMembership =
      memberships.find((m) => m.clientId === clientCookie) ?? memberships[0];

    const availableRoles: AppRole[] = [activeMembership.role];
    const role = roleCookie && availableRoles.includes(roleCookie) ? roleCookie : availableRoles[0];

    return {
      role,
      activeClient: {
        id: activeMembership.clientId,
        name: activeMembership.clientName,
        slug: activeMembership.clientSlug,
        status: activeMembership.clientStatus
      },
      memberships,
      availableRoles
    };
  } catch {
    return null;
  }
}

export function isAdminRole(role: AppRole) {
  return role === "ADMIN" || role === "INSTRUCTOR";
}

export function isLearnerRole(role: AppRole) {
  return role === "LEARNER";
}
