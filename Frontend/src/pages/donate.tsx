import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Heart,
  Shield,
  CheckCircle2,
  Pill,
  Utensils,
  Stethoscope,
  Users,
  Home,
  CreditCard,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent } from '@/components/ui/card'
import { usePageTitle } from '@/hooks/usePageTitle'

const donationTiers = [
  { amount: 15, label: '$15', description: 'Provides essential vitamins for a child', icon: Pill, iconLabel: 'Vitamins' },
  { amount: 50, label: '$50', description: 'Feeds a child for an entire month', icon: Utensils, iconLabel: 'Meals' },
  { amount: 100, label: '$100', description: 'Covers medical, dental, and educational needs', icon: Stethoscope, iconLabel: 'Healthcare' },
  { amount: 300, label: '$300', description: 'Employs a professional caregiver for many children', icon: Users, iconLabel: 'Caregivers' },
  { amount: 1500, label: '$1,500', description: 'Pays the mortgage that provides refuge for all children', icon: Home, iconLabel: 'Shelter' },
]

const trustSignals = [
  { label: '100% goes to the children', icon: Heart },
  { label: 'Verified 501(c)(3) nonprofit', icon: Shield },
  { label: 'Transparent reporting', icon: CheckCircle2 },
]

export function DonatePage() {
  usePageTitle('Donate')
  const [donationTier, setDonationTier] = useState(1)
  const [showComingSoon, setShowComingSoon] = useState(false)
  const currentTier = donationTiers[donationTier]
  const TierIcon = currentTier.icon

  function handleDonate() {
    setShowComingSoon(true)
    setTimeout(() => setShowComingSoon(false), 4000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative pt-20 pb-16 sm:pt-28 sm:pb-24 overflow-hidden">
        {/* Subtle gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-4">
              Make a Difference
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-foreground tracking-tight leading-[1.1]">
              Give a Girl Her Future Back
            </h1>
            <p className="mt-6 text-lg sm:text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              Every donation directly funds shelter, nutrition, education, and counseling
              for rescued children in the Philippines. Every penny goes to the children.
            </p>
          </div>
        </div>
      </section>

      {/* Donation Selection */}
      <section className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-8 sm:p-12">
                <div className="grid md:grid-cols-2 gap-10 items-center">
                  {/* Left: slider + amount */}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-6">
                      Choose Your Impact
                    </p>
                    <div className="mb-6">
                      <div className="text-5xl sm:text-6xl font-serif font-semibold text-foreground">
                        {currentTier.label}
                        <span className="text-lg font-sans font-normal text-muted-foreground ml-2">/ month</span>
                      </div>
                      <p className="mt-3 text-base text-muted-foreground">{currentTier.description}</p>
                    </div>

                    <Slider
                      value={[donationTier]}
                      onValueChange={(v) => setDonationTier(v[0])}
                      min={0}
                      max={donationTiers.length - 1}
                      step={1}
                      className="w-full [&_[data-slot=range]]:bg-primary [&_[data-slot=thumb]]:bg-white [&_[data-slot=thumb]]:border-primary"
                    />

                    <div className="flex justify-between mt-3 text-xs text-muted-foreground/60">
                      <span>$15</span>
                      <span>$1,500</span>
                    </div>

                    <p className="mt-6 text-xs text-muted-foreground/50">
                      Total monthly expenses are nearly $11,000.
                    </p>

                    {/* Donate button */}
                    <div className="mt-8 relative">
                      <Button
                        size="lg"
                        className="rounded-full px-8 font-medium w-full sm:w-auto"
                        onClick={handleDonate}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Donate {currentTier.label}/month with Stripe
                      </Button>

                      {/* Coming soon notification */}
                      {showComingSoon && (
                        <div className="absolute top-full left-0 sm:left-auto mt-3 w-full sm:w-auto">
                          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground animate-in fade-in slide-in-from-top-1 duration-200">
                            <p className="font-medium">Stripe integration coming soon</p>
                            <p className="text-muted-foreground text-xs mt-0.5">
                              Secure payment processing will be available shortly.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: tier icon card */}
                  <div className="hidden md:flex items-center justify-center">
                    <div className="relative">
                      <div className="h-48 w-48 rounded-3xl bg-primary/[0.06] flex items-center justify-center">
                        <TierIcon className="h-20 w-20 text-primary/70" strokeWidth={1.2} />
                      </div>
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
                        {currentTier.iconLabel}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust signals */}
                <div className="mt-12 pt-8 border-t border-border/60">
                  <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
                    {trustSignals.map((signal) => (
                      <div key={signal.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <signal.icon className="h-4 w-4 text-primary/60" />
                        <span>{signal.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tier breakdown */}
      <section className="pb-20 sm:pb-28 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-20">
          <div className="mx-auto max-w-3xl text-center mb-14">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-4">
              Where Your Money Goes
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
              Every Dollar Has a Purpose
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              We believe in full transparency. Here's exactly how each level of giving
              translates into care for the children.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {donationTiers.map((tier, i) => {
              const Icon = tier.icon
              const isActive = i === donationTier
              return (
                <button
                  key={tier.amount}
                  type="button"
                  onClick={() => setDonationTier(i)}
                  className={`group rounded-xl border p-6 text-left transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'border-primary/40 bg-primary/[0.04] shadow-sm'
                      : 'border-border/60 bg-background hover:border-border hover:shadow-sm'
                  }`}
                >
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                    isActive ? 'bg-primary/10' : 'bg-muted group-hover:bg-primary/5'
                  }`}>
                    <Icon className={`h-5 w-5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary/70'}`} />
                  </div>
                  <div className="mt-4 font-serif text-2xl font-semibold text-foreground">{tier.label}</div>
                  <p className="mt-1 text-xs text-muted-foreground/60">per month</p>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{tier.description}</p>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Card className="bg-primary/[0.04] border-primary/20">
            <CardContent className="flex flex-col items-center py-14 text-center px-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mt-6 font-serif text-2xl sm:text-3xl font-semibold text-foreground">
                Not Ready to Donate?
              </h3>
              <p className="mt-3 max-w-lg text-muted-foreground leading-relaxed">
                You can still make a difference. Explore our impact data, learn about our
                safehouses, or share our mission with others.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button variant="outline" asChild className="rounded-full px-6">
                  <Link to="/impact">
                    See Our Impact
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
