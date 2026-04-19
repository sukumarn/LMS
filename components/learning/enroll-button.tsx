"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function EnrollButton({
  courseSlug,
  enrolled,
  className
}: {
  courseSlug: string;
  enrolled: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      className={className}
      disabled={enrolled || isPending}
      onClick={() =>
        startTransition(async () => {
          const response = await fetch(`/api/courses/${courseSlug}/enroll`, {
            method: "POST"
          });

          if (!response.ok) {
            const payload = await response.json().catch(() => null);
            toast.error(payload?.error ?? "Unable to register course");
            return;
          }

          toast.success("Course registered");
          router.refresh();
        })
      }
    >
      {enrolled ? "Registered" : isPending ? "Registering..." : "Register course"}
    </Button>
  );
}
