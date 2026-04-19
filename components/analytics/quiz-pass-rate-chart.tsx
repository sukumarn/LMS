"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuizAnalytics } from "@/lib/lms-data";

type Props = { data: QuizAnalytics["passByLesson"] };

export function QuizPassRateChart({ data }: Props) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Pass vs fail by lesson quiz</CardTitle>
        <p className="text-sm text-muted-foreground">Total attempts broken down by outcome per lesson.</p>
      </CardHeader>
      <CardContent className="h-[320px]">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No lesson quiz attempts yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.12)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={48} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,23,42,0.92)", color: "white", fontSize: 13 }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Bar dataKey="passed" name="Passed" radius={[8, 8, 0, 0]} fill="#34d399" />
              <Bar dataKey="failed" name="Failed"  radius={[8, 8, 0, 0]} fill="#f87171" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
