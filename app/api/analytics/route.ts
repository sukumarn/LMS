import { NextResponse } from "next/server";

import { getDemoSession } from "@/lib/demo-session";
import { getDashboardOverview } from "@/lib/lms-data";

export async function GET() {
  const session = await getDemoSession();
  const overview = await getDashboardOverview(session);

  return NextResponse.json({
    stats: overview.stats,
    revenueSeries: overview.revenueSeries,
    cohortSeries: overview.cohortSeries
  });
}
