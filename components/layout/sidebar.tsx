"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { motion } from "framer-motion";

import { navigation } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useLMSStore } from "@/store/lms-store";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, userRole } = useLMSStore();
  const isAdmin = userRole === "ADMIN" || userRole === "INSTRUCTOR";
  const visibleNav = navigation.filter((item) => !item.adminOnly || isAdmin);

  return (
    <motion.aside
      layout
      className={cn(
        "glass-panel gradient-border sticky top-4 hidden h-[calc(100vh-2rem)] rounded-[30px] p-4 lg:flex lg:flex-col",
        sidebarCollapsed ? "w-24" : "w-[280px]"
      )}
    >
      <div className="flex items-center justify-between gap-3 pb-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-glow">
            <GraduationCap className="h-5 w-5" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <p className="text-sm text-muted-foreground">Nova LMS</p>
              <p className="text-lg font-semibold">Operator Campus</p>
            </div>
          )}
        </div>
        <Button size="icon" variant="ghost" onClick={toggleSidebar}>
          {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="space-y-2">
        {visibleNav.map((item) => {
          const active = item.href === "/learn" ? pathname.startsWith("/learn") : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition",
                active
                  ? "bg-white/90 text-foreground shadow-sm dark:bg-white/10"
                  : "text-muted-foreground hover:bg-white/60 hover:text-foreground dark:hover:bg-white/5"
              )}
            >
              <item.icon className="h-5 w-5" />
              {!sidebarCollapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[28px] bg-gradient-to-br from-blue-600/90 to-cyan-500/80 p-5 text-white shadow-glow">
        {!sidebarCollapsed && (
          <>
            <p className="text-sm text-white/70">Upgrade cohort</p>
            <h3 className="mt-2 text-xl font-semibold">Unlock team analytics and AI recommendations</h3>
            <p className="mt-2 text-sm text-white/75">Enterprise controls, SSO, private cohorts, and branded classrooms.</p>
          </>
        )}
      </div>
    </motion.aside>
  );
}
