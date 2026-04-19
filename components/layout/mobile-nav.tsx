"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navigation } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="glass-panel fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] -translate-x-1/2 items-center justify-between rounded-[28px] px-4 py-3 lg:hidden">
      {navigation.map((item) => {
        const active = item.href === "/learn" ? pathname.startsWith("/learn") : pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] text-muted-foreground",
              active && "bg-white/10 text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </div>
  );
}
