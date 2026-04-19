import { Search } from "lucide-react";

import { CourseCard } from "@/components/marketplace/course-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getDemoSession } from "@/lib/demo-session";
import { getCatalogCourses } from "@/lib/lms-data";

export default async function MarketplacePage() {
  const session = await getDemoSession();
  const courses = await getCatalogCourses(session);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <Badge>Course marketplace</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">Explore flagship cohorts, self-paced tracks, and premium certifications</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Premium catalog design with clean search, pricing, urgency, and offer surfaces inspired by modern fintech products.
            </p>
            <div className="relative mt-6 max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-11" placeholder="Search by course, topic, or instructor" />
            </div>
          </div>
          <div className="rounded-[32px] bg-gradient-to-br from-blue-600 to-cyan-500 p-6 text-white shadow-glow">
            <p className="text-sm text-white/70">Flash promotion</p>
            <h3 className="mt-4 text-3xl font-semibold">Save 25% before the cohort window closes</h3>
            <p className="mt-3 text-white/75">Use code LIMITED25 on any flagship program.</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        {["All", "AI Systems", "Engineering", "Product Design", "Leadership", "Data"].map((filter) => (
          <Badge key={filter} variant={filter === "All" ? "default" : "secondary"} className="px-4 py-2 text-sm">
            {filter}
          </Badge>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}
