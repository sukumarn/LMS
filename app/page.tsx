import Link from "next/link";
import { ArrowRight, PlayCircle, Sparkles } from "lucide-react";

import { getDemoSession } from "@/lib/demo-session";
import { getCatalogCourses } from "@/lib/lms-data";
import { formatCurrencyFromCents } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function LandingPage() {
  const session = await getDemoSession();
  const courses = await getCatalogCourses(session);

  return (
    <main className="relative min-h-screen overflow-hidden bg-aurora-light px-4 py-6 dark:bg-aurora-dark">
      <div className="absolute inset-0 bg-mesh-gradient opacity-80" />
      <div className="container relative z-10">
        <section className="glass-panel gradient-border rounded-[36px] px-6 py-6 sm:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-glow">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nova LMS</p>
                <p className="font-semibold">Bridge-inspired learning OS</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link href="/marketplace">Marketplace</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard">
                  Enter platform
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-10 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <Badge>Fintech-grade LMS</Badge>
              <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
                Premium course delivery for modern operators, teams, and revenue-driven academies.
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
                Course commerce, cohort analytics, video learning, and admin tooling in one clean operating surface.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link href="/dashboard">
                    Launch dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href={courses[0] ? `/learn/${courses[0].slug}` : "/marketplace"}>
                    <PlayCircle className="h-4 w-4" />
                    Preview course player
                  </Link>
                </Button>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  {
                    label: "Client-scoped catalog",
                    detail: "Each tenant gets an isolated course catalog, enrollments, and progress data."
                  },
                  {
                    label: "Role-based operations",
                    detail: "Admins manage content for their own client while learners stay inside their assigned workspace."
                  },
                  {
                    label: "Supabase-backed LMS",
                    detail: "Courses, lessons, quizzes, and analytics now load from Postgres instead of in-memory fixtures."
                  }
                ].map((item) => (
                  <Card key={item.label}>
                    <CardContent className="p-5">
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <p className="mt-3 text-sm text-muted-foreground">{item.detail}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <Card className="overflow-hidden">
              <CardContent className="space-y-5 p-5">
                <div className="rounded-[28px] bg-gradient-to-br from-blue-600 to-cyan-500 p-6 text-white">
                  <p className="text-sm text-white/70">Live catalog</p>
                  <p className="mt-3 text-3xl font-semibold">{courses.length} courses available</p>
                  <p className="mt-2 text-white/75">Catalog visibility is now driven by the active client workspace and publish status.</p>
                </div>
                {courses.slice(0, 2).map((course) => (
                  <div key={course.id} className="rounded-[28px] border border-white/10 bg-white/60 p-5 dark:bg-white/5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{course.category}</p>
                        <h3 className="mt-1 text-xl font-semibold">{course.title}</h3>
                      </div>
                      <Badge variant="success">{course.lessonCount} lessons</Badge>
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">From</p>
                        <p className="text-2xl font-semibold">{formatCurrencyFromCents(course.priceInCents)}</p>
                      </div>
                      <Button variant="outline" asChild>
                        <Link href={`/learn/${course.slug}`}>Open</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
