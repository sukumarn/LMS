"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function AdminAccessCta() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchToAdmin() {
    startTransition(async () => {
      await fetch("/api/session/role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role: "CLIENT_ADMIN" })
      });

      router.refresh();
    });
  }

  return (
    <Button onClick={switchToAdmin} disabled={isPending}>
      {isPending ? "Switching..." : "Switch to Admin"}
    </Button>
  );
}
