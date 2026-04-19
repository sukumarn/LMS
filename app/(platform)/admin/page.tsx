import { BookPlus, Plus, Shield, UploadCloud, Users } from "lucide-react";

import { AdminAccessCta } from "@/components/admin/admin-access-cta";
import { CollapsibleCourseCreation } from "@/components/admin/collapsible-course-creation";
import { CourseLessonManager } from "@/components/admin/course-lesson-manager";
import { CourseTable } from "@/components/admin/course-table";
import { PendingUsers } from "@/components/admin/pending-users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDemoSession, isAdminRole } from "@/lib/demo-session";
import { getAdminCourseOptions, getAdminCourseSummaries } from "@/lib/lms-data";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/server";

export default async function AdminPage() {
  const session = await getDemoSession();
  const isAdmin = isAdminRole(session.user.role);
  const [courses, courseOptions, allClients] = await Promise.all([
    getAdminCourseSummaries(session),
    getAdminCourseOptions(session),
    hasSupabaseAdminEnv()
      ? createSupabaseAdminClient().from("clients").select("id, name").eq("status", "ACTIVE")
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-semibold">Admin access required</h1>
              <p className="text-sm text-muted-foreground">Switch to the Admin role in the top header to manage courses and lessons.</p>
            </div>
          </div>
          <div className="mt-6">
            <AdminAccessCta />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Badge>Admin panel</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">Manage courses, offers, uploads, and learner operations</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              This workspace centralizes content ops, media pipelines, pricing, and learner administration.
            </p>
            {session.activeClient ? (
              <p className="mt-3 text-sm text-primary">Active client workspace: {session.activeClient.name}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline">
              <UploadCloud className="h-4 w-4" />
              Upload video
            </Button>
            <Button>
              <Plus className="h-4 w-4" />
              New course
            </Button>
          </div>
        </CardContent>
      </Card>

      <CollapsibleCourseCreation />

      <Card>
        <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <BookPlus className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Publishing guidance</h2>
          </div>
          <p>Create the course first with title, category, level, instructor, and status.</p>
          <p>Use `Published` only when the course is ready to show in the user catalog.</p>
          <p>After that, add lessons with the video URL, material URL, and quiz metadata.</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center gap-3">
            <BookPlus className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Lesson management</h2>
              <p className="text-sm text-muted-foreground">Each course now exposes its own lesson editor directly on this page.</p>
            </div>
          </div>
          <CourseLessonManager courses={courses} courseOptions={courseOptions} />
        </CardContent>
      </Card>

      <CourseTable courses={courses} />

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">User management</h2>
              <p className="text-sm text-muted-foreground">Assign or update workspace and role for any user.</p>
            </div>
          </div>
          <PendingUsers
            clients={(allClients.data ?? []).map((c) => ({ id: c.id, name: c.name }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
