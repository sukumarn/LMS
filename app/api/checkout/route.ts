import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  createSupabaseServerClient,
  hasSupabasePublicEnv
} from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

const payloadSchema = z.object({
  courseId: z.string(),
  couponCode: z.string().optional()
});

export async function POST(request: NextRequest) {
  const payload = payloadSchema.parse(await request.json());

  if (!hasSupabasePublicEnv()) {
    return NextResponse.json({ error: "Supabase public environment is not configured" }, { status: 503 });
  }

  const supabase = createSupabaseServerClient();
  const { data: course, error } = await supabase
    .from("courses")
    .select("id, slug, title, description, price_in_cents")
    .or(`id.eq.${payload.courseId},slug.eq.${payload.courseId}`)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Unable to load course" }, { status: 500 });
  }

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured. Set STRIPE_SECRET_KEY to enable live checkout." },
      { status: 503 }
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXTAUTH_URL}/marketplace?checkout=cancelled`,
    allow_promotion_codes: true,
    metadata: payload.couponCode ? { requestedCouponCode: payload.couponCode } : undefined,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: course.price_in_cents,
          product_data: {
            name: course.title,
            description: course.description
          }
        },
        quantity: 1
      }
    ]
  });

  return NextResponse.json({ mode: "stripe", checkoutUrl: session.url });
}
