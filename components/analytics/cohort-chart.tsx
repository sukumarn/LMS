"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CohortChart({
  data
}: {
  data: { name: string; completion: number; engagement: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cohort retention</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        {!data.length ? (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">
            No cohort trend data for this workspace yet.
          </div>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid vertical={false} stroke="rgba(148, 163, 184, 0.12)" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(15,23,42,0.92)",
                color: "white"
              }}
            />
            <Bar dataKey="completion" radius={[10, 10, 0, 0]} fill="#5c8cff" />
            <Bar dataKey="engagement" radius={[10, 10, 0, 0]} fill="#1ee1c0" />
          </BarChart>
        </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
