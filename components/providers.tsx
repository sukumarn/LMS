"use client";

import { useEffect, type ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-provider";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    const reloadKey = "nova-chunk-reload";

    function shouldRecover(message: string) {
      return message.includes("ChunkLoadError") || message.includes("/_next/static/chunks/");
    }

    function reloadOnce() {
      if (sessionStorage.getItem(reloadKey) === "1") {
        sessionStorage.removeItem(reloadKey);
        return;
      }

      sessionStorage.setItem(reloadKey, "1");
      window.location.reload();
    }

    function handleError(event: ErrorEvent) {
      const message = event.message || event.error?.message || "";
      if (shouldRecover(message)) {
        reloadOnce();
      }
    }

    function handleRejection(event: PromiseRejectionEvent) {
      const reason =
        typeof event.reason === "string"
          ? event.reason
          : event.reason?.message || String(event.reason ?? "");

      if (shouldRecover(reason)) {
        reloadOnce();
      }
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <SessionProvider>
        <AuthProvider>
          {children}
          <Toaster richColors closeButton position="top-right" />
        </AuthProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
