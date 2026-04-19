import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminCourseSummary } from "@/lib/lms-data";

export function CourseTable({ courses }: { courses: AdminCourseSummary[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Course inventory</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="pb-4 font-medium">Course</th>
              <th className="pb-4 font-medium">Slug</th>
              <th className="pb-4 font-medium">Status</th>
              <th className="pb-4 font-medium">Lessons</th>
              <th className="pb-4 font-medium">Enrollments</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id} className="border-t border-white/10">
                <td className="py-4 font-medium">{course.title}</td>
                <td className="py-4 text-muted-foreground">{course.slug}</td>
                <td className="py-4">
                  <Badge variant={course.status === "PUBLISHED" ? "success" : "secondary"}>{course.status}</Badge>
                </td>
                <td className="py-4 text-muted-foreground">{course.lessonCount}</td>
                <td className="py-4 text-muted-foreground">{course.enrollmentCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!courses.length && <p className="pt-4 text-sm text-muted-foreground">No courses in the database yet.</p>}
      </CardContent>
    </Card>
  );
}
