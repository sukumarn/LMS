import { NextResponse } from "next/server";

import { cloudinary } from "@/lib/cloudinary";
import { mux } from "@/lib/mux";

export async function POST() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.MUX_TOKEN_ID) {
    return NextResponse.json(
      { error: "Cloudinary and Mux are not configured for uploads." },
      { status: 503 }
    );
  }

  return NextResponse.json({
    mode: "live",
    cloudinary: cloudinary.config(),
    muxReady: Boolean(mux)
  });
}
