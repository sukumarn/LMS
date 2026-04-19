"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth-provider";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";

export default function PlatformLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-aurora-light px-4 py-4 dark:bg-aurora-dark">
        <div className="absolute inset-0 bg-mesh-gradient opacity-70" />
        <div className="container relative z-10 flex min-h-screen items-center justify-center">
          <div className="glass-panel gradient-border rounded-[36px] p-8 text-muted-foreground">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-aurora-light px-4 py-4 dark:bg-aurora-dark">
      <div className="absolute inset-0 bg-mesh-gradient opacity-70" />
      <div className="container relative z-10 flex gap-4">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col gap-4 pb-24 lg:pb-4">
          <Header />
          <div className="flex-1">{children}</div>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
