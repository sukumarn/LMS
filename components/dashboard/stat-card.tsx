import { ArrowUpRight, Minus } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatCompactNumber } from "@/lib/utils";

export function StatCard({
  label,
  value,
  delta,
  tone,
  suffix
}: {
  label: string;
  value: number;
  delta?: string;
  tone: "positive" | "neutral";
  suffix?: string;
}) {
  const isPositive = tone === "positive";

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <h3 className="mt-4 text-3xl font-semibold tracking-tight">
              {suffix ? `${value}${suffix}` : formatCompactNumber(value)}
            </h3>
          </div>
          <div
            className={`rounded-2xl p-3 ${
              isPositive
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-white/10 text-muted-foreground"
            }`}
          >
            {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{delta ? `${delta} vs previous month` : "Live data"}</p>
      </CardContent>
    </Card>
  );
}
