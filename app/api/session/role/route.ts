import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const payloadSchema = z.object({
  role: z.enum(["PRODUCT_ADMIN", "CLIENT_ADMIN", "ADMIN", "INSTRUCTOR", "LEARNER"]).optional().nullable(),
  clientId: z.string().uuid().optional().nullable()
});

function withSessionCookies(response: NextResponse, payload: { role?: string | null; clientId?: string | null }) {
  if (payload.role) {
    response.cookies.set("nova-role", payload.role, {
      httpOnly: true,
      sameSite: "lax",
      path: "/"
    });
  }

  if (payload.clientId) {
    response.cookies.set("nova-client", payload.clientId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/"
    });
  }

  return response;
}

export async function POST(request: NextRequest) {
  const payload = payloadSchema.parse(await request.json());
  const response = NextResponse.json({ ok: true, role: payload.role ?? null, clientId: payload.clientId ?? null });

  return withSessionCookies(response, payload);
}

export async function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get("role");
  const clientId = request.nextUrl.searchParams.get("clientId");
  const redirectTo = request.nextUrl.searchParams.get("redirect") || "/admin";
  const payload = payloadSchema.parse({ role, clientId });
  const response = NextResponse.redirect(new URL(redirectTo, request.url));

  return withSessionCookies(response, payload);
}
