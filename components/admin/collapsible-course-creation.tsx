"use client";

import { useState } from "react";
import { ChevronDown, Users } from "lucide-react";
import { CourseForm } from "@/components/admin/course-form";
import { Card, CardContent } from "@/components/ui/card";

export function CollapsibleCourseCreation() {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardContent className="p-0">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
        >
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Course creation</h2>
          </div>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <div className="border-t border-white/10 px-6 py-5">
            <CourseForm />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
