"use client";

import { ClipboardCheck, TrendingUp, Star, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { QuizAnalytics } from "@/lib/lms-data";

const ICONS = [ClipboardCheck, TrendingUp, Star, RefreshCw];
const COLORS = ["text-violet-400", "text-emerald-400", "text-amber-400", "text-cyan-400"];
const BG = ["bg-violet-400/10", "bg-emerald-400/10", "bg-amber-400/10", "bg-cyan-400/10"];

type Props = { stats: QuizAnalytics["stats"] };

export function QuizStatCards({ stats }: Props) {
  const items = [
    { label: "Quizzes attempted",  value: stats.totalAttempts.toLocaleString(), suffix: "" },
    { label: "Overall pass rate",  value: stats.passRate,                        suffix: "%" },
    { label: "Average score",      value: stats.avgScore,                        suffix: "%" },
    { label: "Avg attempts to pass", value: stats.avgAttemptsToPass,             suffix: "x" }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, i) => {
        const Icon = ICONS[i];
        return (
          <Card key={item.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", BG[i])}>
                  <Icon className={cn("h-4 w-4", COLORS[i])} />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold">
                {item.value}{item.suffix}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
