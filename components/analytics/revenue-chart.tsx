"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RevenueChart({
  data
}: {
  data: { name: string; revenue: number; learners: number }[];
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Revenue velocity</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        {!data.length ? (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">
            No revenue history for this workspace yet.
          </div>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5c8cff" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#5c8cff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="learners" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1ee1c0" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#1ee1c0" stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <Area type="monotone" dataKey="revenue" stroke="#5c8cff" fill="url(#revenue)" strokeWidth={3} />
            <Area type="monotone" dataKey="learners" stroke="#1ee1c0" fill="url(#learners)" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
