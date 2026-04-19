import { PlayCircle } from "lucide-react";

import { Card } from "@/components/ui/card";

export function VideoShell() {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.32),transparent_24%),linear-gradient(135deg,#090d18_0%,#11172b_45%,#0c1020_100%)]">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(0,0,0,0.28)_100%)]" />
        <div className="absolute left-6 top-6 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/70 backdrop-blur">
          Mux stream ready
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur">
            <PlayCircle className="h-10 w-10" />
          </div>
          <p className="mt-4 text-2xl font-semibold">Workflow orchestration with LLMs</p>
          <p className="mt-2 max-w-md text-sm text-white/70">Drop your Mux playback ID or Cloudinary video URL into the lesson model to stream production video here.</p>
        </div>
      </div>
    </Card>
  );
}
