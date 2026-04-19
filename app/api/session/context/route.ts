import { NextResponse } from "next/server";

import { getDemoSession } from "@/lib/demo-session";

export async function GET() {
  const session = await getDemoSession();

  return NextResponse.json({
    user: session.user,
    activeClient: session.activeClient,
    memberships: session.memberships,
    availableRoles: session.availableRoles
  });
}
