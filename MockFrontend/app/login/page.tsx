"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { donors, admins } from "@/lib/mock-data";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate login delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check admin credentials
    const admin = admins.find(
      (a) => a.email === email && a.password === password
    );
    if (admin) {
      localStorage.setItem("userType", "admin");
      localStorage.setItem("userId", admin.id);
      router.push("/admin");
      return;
    }

    // Check donor credentials
    const donor = donors.find(
      (d) => d.email === email && d.password === password
    );
    if (donor) {
      localStorage.setItem("userType", "donor");
      localStorage.setItem("userId", donor.id);
      router.push("/dashboard");
      return;
    }

    // Invalid credentials
    setError("Invalid email or password. Please try again.");
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <span className="text-xl font-bold text-primary-foreground">
                L
              </span>
            </div>
          </Link>
          <h1 className="font-serif mt-4 text-2xl font-bold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to your Lunas account
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-accent hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 space-y-3 rounded-lg bg-muted/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Demo Credentials
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-md bg-background p-2">
                <div>
                  <p className="font-medium text-foreground">Admin</p>
                  <p className="text-muted-foreground">admin@lunas.org / admin123</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEmail("admin@lunas.org");
                    setPassword("admin123");
                  }}
                >
                  Use
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-md bg-background p-2">
                <div>
                  <p className="font-medium text-foreground">Donor (Sarah)</p>
                  <p className="text-muted-foreground">sarah@example.com / donor123</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEmail("sarah@example.com");
                    setPassword("donor123");
                  }}
                >
                  Use
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-md bg-background p-2">
                <div>
                  <p className="font-medium text-foreground">Donor (James)</p>
                  <p className="text-muted-foreground">james@example.com / donor123</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEmail("james@example.com");
                    setPassword("donor123");
                  }}
                >
                  Use
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Back to home */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
