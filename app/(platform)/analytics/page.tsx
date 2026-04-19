import { getDemoSession } from "@/lib/demo-session";
import { getQuizAnalytics } from "@/lib/lms-data";
import { QuizStatCards } from "@/components/analytics/quiz-stat-cards";
import { QuizPassRateChart } from "@/components/analytics/quiz-pass-rate-chart";
import { QuizScoreDistribution } from "@/components/analytics/quiz-score-distribution";
import { QuizAttemptsChart } from "@/components/analytics/quiz-attempts-chart";
import { QuizLeaderboard } from "@/components/analytics/quiz-leaderboard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function AnalyticsPage() {
  const session = await getDemoSession();
  const analytics = await getQuizAnalytics(session);

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="p-6">
          <Badge>Analytics</Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Quiz analytics</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Learner performance, score distribution, and pass rates across all lesson and course quizzes.
          </p>
        </CardContent>
      </Card>

      <QuizStatCards stats={analytics.stats} />

      <div className="grid gap-4 xl:grid-cols-2">
        <QuizAttemptsChart data={analytics.attemptsByMonth} />
        <QuizScoreDistribution data={analytics.scoreDistribution} />
      </div>

      <QuizPassRateChart data={analytics.passByLesson} />

      <QuizLeaderboard data={analytics.leaderboard} />
    </div>
  );
}
