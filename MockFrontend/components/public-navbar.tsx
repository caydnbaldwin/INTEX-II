"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
            <span className="text-lg font-bold text-primary-foreground">L</span>
          </div>
          <span className="text-xl font-semibold tracking-tight text-foreground">
            Lunas
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/donate">Donate</Link>
          </Button>
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
