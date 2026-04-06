"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  Heart,
  DollarSign,
  Share2,
  UserCog,
  LayoutDashboard,
  LogOut,
  Shield,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/residents", label: "Residents", icon: Users },
  { href: "/admin/donors", label: "Donors", icon: Heart },
  { href: "/admin/donations", label: "Donations", icon: DollarSign },
  { href: "/admin/social", label: "Social Media Posts", icon: Share2 },
  { href: "/admin/users", label: "Users", icon: UserCog },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("userType");
    localStorage.removeItem("userId");
    router.push("/");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary">
          <span className="text-lg font-bold text-sidebar-primary-foreground">
            L
          </span>
        </div>
        <span className="text-xl font-semibold tracking-tight">Lunas</span>
      </div>

      {/* Admin Badge */}
      <div className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary">
            <Shield className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-sidebar-foreground">
              Admin Panel
            </p>
            <p className="text-xs text-sidebar-foreground/60">
              Full access
            </p>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-4">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
