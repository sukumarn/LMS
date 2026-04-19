"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuizAnalytics } from "@/lib/lms-data";

const COLORS = ["#f87171", "#fb923c", "#facc15", "#34d399", "#22d3ee"];

type Props = { data: QuizAnalytics["scoreDistribution"] };

export function QuizScoreDistribution({ data }: Props) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Score distribution</CardTitle>
        <p className="text-sm text-muted-foreground">How learners are scoring across all quizzes.</p>
      </CardHeader>
      <CardContent className="h-[320px]">
        {data.every((d) => d.count === 0) ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No attempt data yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.12)" />
              <XAxis dataKey="range" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,23,42,0.92)", color: "white", fontSize: 13 }}
                formatter={(v: number) => [v, "Learners"]}
              />
              <Bar dataKey="count" name="Learners" radius={[8, 8, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
