import Link from "next/link";
import { PublicNavbar } from "@/components/public-navbar";
import { Button } from "@/components/ui/button";
import { Heart, Star, Sparkles } from "lucide-react";

export default function DonatePage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left Column - Image */}
            <div className="order-2 lg:order-1">
              <div className="overflow-hidden rounded-2xl bg-muted">
                <div className="flex aspect-[4/5] items-center justify-center bg-gradient-to-br from-accent/30 to-primary/20">
                  <div className="text-center">
                    <Heart className="mx-auto h-20 w-20 text-accent" />
                    <p className="mt-6 px-8 text-lg font-medium text-muted-foreground">
                      Every donation creates ripples of change
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Content */}
            <div className="order-1 flex flex-col justify-center lg:order-2">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-accent">
                <Sparkles className="h-4 w-4" />
                Make a Difference
              </div>

              <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                Your Generosity Changes Lives
              </h1>

              <div className="mt-8 space-y-6">
                <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
                  When you donate to Lunas, you&apos;re not just giving money
                  &mdash; you&apos;re investing in a young girl&apos;s future.
                  Your contribution directly supports safe housing, trauma-
                  informed counseling, educational opportunities, and the
                  nurturing environment every child deserves.
                </p>

                <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
                  100% of your donation goes directly to our programs. We
                  believe in complete transparency and accountability, ensuring
                  your generosity creates the maximum possible impact.
                </p>

                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { value: "127", label: "Lives Changed" },
                    { value: "98%", label: "Success Rate" },
                    { value: "$38K", label: "Monthly Support" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-border bg-card p-4 text-center"
                    >
                      <div className="text-2xl font-bold text-foreground">
                        {stat.value}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-accent/10 p-4">
                  <Star className="h-5 w-5 shrink-0 text-accent" />
                  <p className="text-sm text-foreground">
                    <strong>Tax-deductible:</strong> All donations to Lunas are
                    fully tax-deductible under section 501(c)(3).
                  </p>
                </div>
              </div>

              <Button size="lg" className="mt-8 w-full sm:w-auto" asChild>
                <Link href="/donate/amount">Make an Impact</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
