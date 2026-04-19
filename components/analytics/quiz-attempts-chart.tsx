"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuizAnalytics } from "@/lib/lms-data";

type Props = { data: QuizAnalytics["attemptsByMonth"] };

export function QuizAttemptsChart({ data }: Props) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Quiz attempts over time</CardTitle>
        <p className="text-sm text-muted-foreground">Monthly attempt volume across all quizzes.</p>
      </CardHeader>
      <CardContent className="h-[320px]">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No attempt data yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="attempts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.12)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,23,42,0.92)", color: "white", fontSize: 13 }}
                formatter={(v: number) => [v, "Attempts"]}
              />
              <Area type="monotone" dataKey="attempts" stroke="#a78bfa" fill="url(#attempts)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
