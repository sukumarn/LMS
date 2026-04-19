import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getDemoSession, isAdminRole } from "@/lib/demo-session";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/server";

const payloadSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"])
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    if (!hasSupabaseAdminEnv()) {
      return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured" }, { status: 503 });
    }

    const session = await getDemoSession();

    if (!isAdminRole(session.user.role) || !session.activeClient) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const activeClientId = session.activeClient.id;

    const parsed = payloadSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Please choose a valid course status.",
          issues: parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();
    const { data: course, error } = await supabase
      .from("courses")
      .update({ status: parsed.data.status })
      .eq("id", params.courseId)
      .eq("client_id", activeClientId)
      .select("id, status")
      .single();

    if (error) throw error;

    return NextResponse.json({ course });
  } catch (error) {
    return NextResponse.json(serializeError(error), { status: 500 });
  }
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      error: error.message,
      details: undefined,
      code: undefined,
      hint: undefined
    };
  }

  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;

    return {
      error: typeof record.message === "string" ? record.message : "Unable to update course",
      details: typeof record.details === "string" ? record.details : undefined,
      code: typeof record.code === "string" ? record.code : undefined,
      hint: typeof record.hint === "string" ? record.hint : undefined
    };
  }

  return {
    error: "Unable to update course",
    details: undefined,
    code: undefined,
    hint: undefined
  };
}
