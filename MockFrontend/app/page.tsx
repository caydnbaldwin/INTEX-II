"use client";

import Link from "next/link";
import { PublicNavbar } from "@/components/public-navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Heart,
  Shield,
  BookOpen,
  Users,
  DollarSign,
  TrendingUp,
  Home,
  Sparkles,
} from "lucide-react";
import {
  donationTrends,
  impactMetrics,
  fundAllocation,
  adminStats,
} from "@/lib/mock-data";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="font-serif text-balance text-5xl font-bold tracking-tight text-foreground md:text-7xl lg:text-8xl">
              Lunas
            </h1>
            <p className="mt-6 text-pretty text-lg text-muted-foreground md:text-xl">
              Providing safety, healing, and long-term support for young girls
              in shelters. Every child deserves a chance to thrive.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="min-w-[160px]" asChild>
                <Link href="/donate">Make a Donation</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="min-w-[160px]"
                asChild
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        <div className="container mx-auto px-4 pb-16">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-muted">
            <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-accent/20 to-primary/10">
              <div className="text-center">
                <Heart className="mx-auto h-16 w-16 text-accent" />
                <p className="mt-4 text-lg font-medium text-muted-foreground">
                  Transforming Lives Together
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Statistics */}
      <section className="border-t border-border bg-card py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-serif mb-10 text-center text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Our Impact
          </h2>
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <Home className="h-6 w-6 text-accent" />
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {adminStats[0].value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Girls Currently Housed
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <Heart className="h-6 w-6 text-accent" />
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {adminStats[1].value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Active Donors
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <DollarSign className="h-6 w-6 text-accent" />
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {adminStats[2].value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Monthly Donations
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <Sparkles className="h-6 w-6 text-accent" />
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {adminStats[3].value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Success Stories
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Donation Trends Chart */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <h2 className="font-serif mb-10 text-center text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Donation Growth
            </h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  Monthly Donations Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={donationTrends}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-border"
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      />
                      <YAxis
                        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          `$${value.toLocaleString()}`,
                          "Donations",
                        ]}
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="var(--chart-1)"
                        fill="var(--chart-1)"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How Funds Are Used */}
      <section className="border-t border-border bg-card py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-serif mb-10 text-center text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            How Your Donations Help
          </h2>
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
            {/* Impact by Category Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Impact by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={impactMetrics} layout="vertical">
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-border"
                      />
                      <XAxis
                        type="number"
                        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                        width={80}
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          `$${value.toLocaleString()}`,
                          "Impact",
                        ]}
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="value" fill="var(--chart-2)" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Fund Allocation Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fund Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={fundAllocation}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                        labelLine={false}
                      >
                        {fundAllocation.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value}%`, "Allocation"]}
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                  {fundAllocation.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[index] }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Our Mission
            </h2>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
              At Lunas, we believe every young girl deserves a safe haven where
              she can heal, grow, and dream. Our comprehensive approach combines
              safe housing, professional counseling, education support, and
              life-skills training to help each resident build a foundation for
              a brighter future.
            </p>
          </div>
        </div>
      </section>

      {/* Impact Areas */}
      <section className="border-t border-border bg-card py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-serif mb-12 text-center text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            How We Help
          </h2>
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Shield,
                title: "Safe Housing",
                description:
                  "Secure, nurturing environments where girls can feel protected and at peace.",
              },
              {
                icon: Heart,
                title: "Counseling",
                description:
                  "Professional trauma-informed therapy to support emotional healing.",
              },
              {
                icon: BookOpen,
                title: "Education",
                description:
                  "Academic support and scholarships to unlock future opportunities.",
              },
              {
                icon: Users,
                title: "Community",
                description:
                  "Building lasting connections and support networks for lifelong success.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group rounded-xl border border-border bg-background p-6 transition-all hover:border-accent hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <item.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-primary-foreground md:text-4xl">
            Join Us in Making a Difference
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-primary-foreground/80">
            Your support helps us provide safety, healing, and hope to young
            girls who need it most.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" variant="secondary" className="min-w-[180px]" asChild>
              <Link href="/donate">Donate Now</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="min-w-[180px] border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link href="/login">Sign In to Your Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                <span className="text-sm font-bold text-primary-foreground">
                  L
                </span>
              </div>
              <span className="text-lg font-semibold text-foreground">
                Lunas
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              2024 Lunas Foundation. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
