import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ActivityTimeline({
  items
}: {
  items: { id: string; title: string; detail: string; time: string }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Live activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {!items.length ? (
          <p className="text-sm text-muted-foreground">No recent activity in this workspace yet.</p>
        ) : null}
        {items.map((item) => (
          <div key={item.id} className="flex gap-4">
            <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_20px_rgba(79,139,255,0.8)]" />
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground/80">{item.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
