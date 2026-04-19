import { Sparkles } from "lucide-react";

import { getDemoSession } from "@/lib/demo-session";
import { getDashboardOverview } from "@/lib/lms-data";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { StatCard } from "@/components/dashboard/stat-card";
import { CohortChart } from "@/components/analytics/cohort-chart";
import { RevenueChart } from "@/components/analytics/revenue-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await getDemoSession();
  const overview = await getDashboardOverview(session);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-8 p-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
          <div>
            <Badge>Personalized dashboard</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">Your learning and revenue cockpit</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Monitor cohort health, learner velocity, revenue trends, and platform activity from a single operating view.
            </p>
          </div>
          <div className="flex items-center justify-start gap-3 lg:justify-end">
            <Button variant="outline">Export report</Button>
            <Button>
              <Sparkles className="h-4 w-4" />
              Generate AI summary
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overview.stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <RevenueChart data={overview.revenueSeries} />
        <ActivityTimeline items={overview.activityFeed} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <CohortChart data={overview.cohortSeries} />
        <Card>
          <CardContent className="grid gap-4 p-6 md:grid-cols-2">
            <div className="rounded-[28px] border border-white/10 bg-white/50 p-5 dark:bg-white/5">
              <p className="text-sm text-muted-foreground">Next milestone</p>
              <h3 className="mt-3 text-2xl font-semibold">Launch AI recommendation engine</h3>
              <p className="mt-3 text-sm text-muted-foreground">Predict learner drop-off, surface the next best lesson, and personalize upsells.</p>
            </div>
            <div className="rounded-[28px] bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 p-5 text-white">
              <p className="text-sm text-white/70">Workspace summary</p>
              <h3 className="mt-3 text-2xl font-semibold">
                {session.activeClient ? session.activeClient.name : "No active client selected"}
              </h3>
              <p className="mt-3 text-sm text-white/70">
                Analytics on this page now reflect live course, enrollment, and quiz activity only.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
