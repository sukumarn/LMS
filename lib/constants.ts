import {
  BarChart3,
  BookOpen,
  LayoutDashboard,
  ShieldCheck,
  ShoppingBag
} from "lucide-react";

export const navigation = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, adminOnly: false },
  { title: "Marketplace", href: "/marketplace", icon: ShoppingBag, adminOnly: false },
  { title: "Learning", href: "/learn", icon: BookOpen, adminOnly: false },
  { title: "Analytics", href: "/analytics", icon: BarChart3, adminOnly: false },
  { title: "Admin", href: "/admin", icon: ShieldCheck, adminOnly: true }
];
