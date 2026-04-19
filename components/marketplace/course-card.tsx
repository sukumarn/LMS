import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

import type { CatalogCourse } from "@/lib/lms-data";
import { formatCurrencyFromCents } from "@/lib/utils";
import { EnrollButton } from "@/components/learning/enroll-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function CourseCard({ course }: { course: CatalogCourse }) {
  const statusVariant = course.status === "PUBLISHED" ? "success" : course.status === "DRAFT" ? "warning" : "secondary";

  return (
    <Card className="overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-glow">
      <div className="relative h-56">
        <Image
          src={
            course.thumbnailUrl ??
            "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
          }
          alt={course.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
        <div className="absolute left-4 top-4 flex gap-2">
          <Badge variant="secondary">{course.category}</Badge>
          <Badge variant={course.isEnrolled ? "success" : "secondary"}>{course.isEnrolled ? "Registered" : course.level}</Badge>
          <Badge variant={statusVariant}>{course.status}</Badge>
        </div>
      </div>
      <CardContent className="space-y-4 p-5">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{course.title}</h3>
          <p className="text-sm text-muted-foreground">{course.shortDescription}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-amber-400">
          <Star className="h-4 w-4 fill-current" />
          <span>{course.lessonCount}</span>
          <span className="text-muted-foreground">lessons</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pricing</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl font-semibold">{formatCurrencyFromCents(course.priceInCents)}</span>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href={`/learn/${course.slug}`}>
              Open course
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <EnrollButton courseSlug={course.slug} enrolled={course.isEnrolled} className="w-full" />
      </CardContent>
    </Card>
  );
}
