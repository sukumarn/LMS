import { NextResponse } from "next/server";

import { getDemoSession } from "@/lib/demo-session";
import { getCatalogCourses } from "@/lib/lms-data";

export async function GET() {
  const session = await getDemoSession();
  const courses = await getCatalogCourses(session);
  return NextResponse.json({ courses });
}
