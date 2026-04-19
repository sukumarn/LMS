import { Clock, GraduationCap } from "lucide-react";

import { CourseLibrary } from "@/components/learning/course-library";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getDemoSession } from "@/lib/demo-session";
import { getCatalogCourses } from "@/lib/lms-data";

export default async function LearningLibraryPage() {
  const session = await getDemoSession();

  if (!session.activeClient) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Access pending</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your account is waiting for an admin to assign you a role. You will be able to view courses once access is granted.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const courses = await getCatalogCourses(session);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <Badge>Learning library</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">Courses, lessons, videos, materials, and quizzes in one workspace</h1>
            <p className="mt-3 max-w-3xl text-muted-foreground">
              Every course in Learning now carries a structured lesson list. Each lesson includes a lesson video, lesson material, and a quiz.
            </p>
          </div>
          <div className="rounded-[28px] bg-white/60 p-5 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available now</p>
                <p className="text-2xl font-semibold">{courses.length} courses</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{courses.reduce((count, course) => count + course.lessonCount, 0)} lessons are currently mapped with learning resources.</p>
          </div>
        </CardContent>
      </Card>

      <CourseLibrary courses={courses} />
    </div>
  );
}
