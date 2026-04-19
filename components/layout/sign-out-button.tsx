"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth-provider";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signOut } = useAuth();

  async function handleSignOut() {
    setIsLoading(true);
    await signOut();
    router.push("/login");
  }

  return (
    <Button size="icon" variant="outline" onClick={handleSignOut} disabled={isLoading}>
      <LogOut className="h-4 w-4" />
    </Button>
  );
}
