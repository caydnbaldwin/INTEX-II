"use client";

import { useState } from "react";
import { PublicNavbar } from "@/components/public-navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Heart, Check } from "lucide-react";

const donationAmounts = [
  { value: 25, label: "$25", description: "Provides school supplies" },
  { value: 50, label: "$50", description: "Covers a counseling session" },
  { value: 100, label: "$100", description: "Supports one week of meals" },
  { value: 200, label: "$200", description: "Funds educational materials" },
];

export default function DonationAmountPage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustom(false);
    setCustomAmount("");
  };

  const handleCustomSelect = () => {
    setIsCustom(true);
    setSelectedAmount(null);
  };

  const activeAmount = isCustom ? Number(customAmount) || 0 : selectedAmount;

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <Heart className="h-8 w-8 text-accent" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Choose Your Impact
            </h1>
            <p className="mt-3 text-muted-foreground">
              Select an amount to support our mission
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {donationAmounts.map((amount) => (
              <button
                key={amount.value}
                onClick={() => handleAmountSelect(amount.value)}
                className={cn(
                  "relative rounded-xl border-2 p-6 text-left transition-all hover:border-accent",
                  selectedAmount === amount.value && !isCustom
                    ? "border-accent bg-accent/5"
                    : "border-border bg-card"
                )}
              >
                {selectedAmount === amount.value && !isCustom && (
                  <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-accent">
                    <Check className="h-4 w-4 text-accent-foreground" />
                  </div>
                )}
                <div className="text-2xl font-bold text-foreground">
                  {amount.label}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {amount.description}
                </div>
              </button>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="mt-4">
            <button
              onClick={handleCustomSelect}
              className={cn(
                "w-full rounded-xl border-2 p-6 text-left transition-all hover:border-accent",
                isCustom ? "border-accent bg-accent/5" : "border-border bg-card"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-foreground">
                    Other Amount
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Enter a custom donation amount
                  </div>
                </div>
                {isCustom && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent">
                    <Check className="h-4 w-4 text-accent-foreground" />
                  </div>
                )}
              </div>
              {isCustom && (
                <div className="mt-4">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="pl-7"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              )}
            </button>
          </div>

          {/* Impact Message */}
          <div className="mt-8 rounded-xl bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Your donation provides housing, counseling, and education to young
              girls in need.
            </p>
          </div>

          {/* CTA Button */}
          <Button
            size="lg"
            className="mt-6 w-full"
            disabled={!activeAmount || activeAmount <= 0}
          >
            Make an Impact
            {activeAmount && activeAmount > 0 && ` - $${activeAmount}`}
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Secure payment powered by Stripe. Your donation is tax-deductible.
          </p>
        </div>
      </main>
    </div>
  );
}
