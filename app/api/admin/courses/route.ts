import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getDemoSession, isAdminRole } from "@/lib/demo-session";
import { slugify } from "@/lib/slug";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/server";

const payloadSchema = z.object({
  title: z.string().min(3),
  shortDescription: z.string().min(8),
  description: z.string().min(20),
  category: z.string().min(2),
  level: z.string().min(2),
  instructorName: z.string().min(2),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  priceInCents: z.number().int().min(0),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"])
});

export async function POST(request: NextRequest) {
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
          error: "Please fix the highlighted course fields.",
          issues: parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    const payload = parsed.data;
    const baseSlug = slugify(payload.title);
    const supabase = createSupabaseAdminClient();
    let createdById = session.user.id;

    const normalizedEmail = session.user.email.trim().toLowerCase();
    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("id")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (existingUserError) throw existingUserError;

    if (existingUser?.id) {
      createdById = existingUser.id;
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({
          name: session.user.name,
          image: session.user.image ?? null
        })
        .eq("id", existingUser.id);

      if (userUpdateError) throw userUpdateError;
    } else {
      const { data: insertedUser, error: userInsertError } = await supabase
        .from("users")
        .insert({
          id: session.user.id,
          email: normalizedEmail,
          name: session.user.name,
          image: session.user.image ?? null
        })
        .select("id")
        .single();

      if (userInsertError) throw userInsertError;
      createdById = insertedUser.id;
    }

    const { data: existingRows, error: existingError } = await supabase
      .from("courses")
      .select("slug")
      .eq("client_id", activeClientId)
      .ilike("slug", `${baseSlug}%`);

    if (existingError) throw existingError;

    const existingCount = existingRows?.length ?? 0;
    const { data: course, error } = await supabase
      .from("courses")
      .insert({
        client_id: activeClientId,
        title: payload.title,
        slug: existingCount ? `${baseSlug}-${existingCount + 1}` : baseSlug,
        short_description: payload.shortDescription,
        description: payload.description,
        category: payload.category,
        level: payload.level,
        instructor_name: payload.instructorName,
        thumbnail_url: payload.thumbnailUrl || null,
        price_in_cents: payload.priceInCents,
        status: payload.status,
        created_by_id: createdById
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    const serialized = serializeError(error);

    return NextResponse.json(serialized, { status: 500 });
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
      error: typeof record.message === "string" ? record.message : "Unable to create course",
      details: typeof record.details === "string" ? record.details : undefined,
      code: typeof record.code === "string" ? record.code : undefined,
      hint: typeof record.hint === "string" ? record.hint : undefined
    };
  }

  return {
    error: "Unable to create course",
    details: undefined,
    code: undefined,
    hint: undefined
  };
}
