"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { QuizAnalytics } from "@/lib/lms-data";

type Props = { data: QuizAnalytics["leaderboard"] };

export function QuizLeaderboard({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quiz performance breakdown</CardTitle>
        <p className="text-sm text-muted-foreground">Attempts, average score, and pass rate per lesson quiz.</p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No quiz attempts recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 pr-6 font-medium">Quiz</th>
                  <th className="pb-3 pr-6 font-medium">Lesson</th>
                  <th className="pb-3 pr-6 font-medium text-right">Attempts</th>
                  <th className="pb-3 pr-6 font-medium text-right">Avg score</th>
                  <th className="pb-3 font-medium text-right">Pass rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.map((q) => (
                  <tr key={q.title}>
                    <td className="py-3 pr-6 font-medium">{q.title}</td>
                    <td className="py-3 pr-6 text-muted-foreground">{q.lesson}</td>
                    <td className="py-3 pr-6 text-right tabular-nums">{q.attempts.toLocaleString()}</td>
                    <td className="py-3 pr-6 text-right tabular-nums">
                      <span className={cn("font-semibold", q.avgScore >= 75 ? "text-emerald-400" : q.avgScore >= 60 ? "text-amber-400" : "text-rose-400")}>
                        {q.avgScore}%
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={cn("h-full rounded-full", q.passRate >= 75 ? "bg-emerald-400" : q.passRate >= 60 ? "bg-amber-400" : "bg-rose-400")}
                            style={{ width: `${q.passRate}%` }}
                          />
                        </div>
                        <span className={cn("w-10 text-right tabular-nums font-semibold", q.passRate >= 75 ? "text-emerald-400" : q.passRate >= 60 ? "text-amber-400" : "text-rose-400")}>
                          {q.passRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
