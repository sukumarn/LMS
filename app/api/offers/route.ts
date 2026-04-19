import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "No active offers are configured" }, { status: 404 });
}
