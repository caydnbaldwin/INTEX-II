"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Heart, Building2, LogOut, Settings, CreditCard } from "lucide-react";
import { donors } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "My Impact", icon: Heart },
  { href: "/dashboard/organization", label: "Organization Impact", icon: Building2 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

type Donor = (typeof donors)[0];

export function DonorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [donor, setDonor] = useState<Donor | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const foundDonor = donors.find((d) => d.id === userId);
    if (foundDonor) {
      setDonor(foundDonor);
    } else {
      setDonor(donors[0]);
    }
  }, []);

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

      {/* User Info */}
      {donor && (
        <div className="border-b border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary text-lg font-bold text-sidebar-primary-foreground">
              {donor.firstName[0]}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {donor.firstName} {donor.lastName}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/60">
                {donor.email}
              </p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
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

        <Link
          href="/donate/amount"
          className="mt-2 flex items-center gap-3 rounded-lg bg-sidebar-primary px-4 py-3 text-sm font-medium text-sidebar-primary-foreground transition-colors hover:bg-sidebar-primary/90"
        >
          <CreditCard className="h-5 w-5" />
          Make a Donation
        </Link>
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
