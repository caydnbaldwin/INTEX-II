import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import {
  Heart,
  Shield,
  CheckCircle2,
  Pill,
  Utensils,
  Stethoscope,
  Users,
  Home,
  LogIn,
  ChevronLeft,
  ChevronDown,
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePageTitle } from '@/hooks/usePageTitle'

// ── Stripe setup ──────────────────────────────────────────────────────────────
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string)

// ── Constants ─────────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_BASE_URL as string

const CHART_COLORS = [
  'oklch(0.45 0.18 280)',
  'oklch(0.55 0.15 280)',
  'oklch(0.65 0.12 280)',
  'oklch(0.75 0.08 280)',
  'oklch(0.35 0.12 280)',
]

const AREA_LABELS: Record<string, string> = {
  Education:   'Education',
  Operations:  'Operations',
  Wellbeing:   'Counseling',
  Maintenance: 'Maintenance',
  Transport:   'Transport',
  Outreach:    'Outreach',
}

const donationTiers = [
  { amount: 15,   label: '$15',    description: 'Provides essential vitamins for a child',            icon: Pill,        iconLabel: 'Vitamins'   },
  { amount: 50,   label: '$50',    description: 'Feeds a child for an entire month',                  icon: Utensils,    iconLabel: 'Meals'      },
  { amount: 100,  label: '$100',   description: 'Covers medical, dental, and education',      icon: Stethoscope, iconLabel: 'Healthcare' },
  { amount: 300,  label: '$300',   description: 'Employs a professional caregiver', icon: Users,       iconLabel: 'Caregivers' },
  { amount: 1500, label: '$1,500', description: 'Pays the mortgage that provides refuge', icon: Home,   iconLabel: 'Shelter'    },
]

const trustSignals = [
  { label: 'Verified 501(c)(3) nonprofit', icon: Shield },
  { label: 'Transparent reporting', icon: CheckCircle2 },
]

// ── Types ─────────────────────────────────────────────────────────────────────
interface MetricPayload {
  type?: 'monthly' | 'annual_summary'
  donations_total_php?: number
  monthly_operating_cost_php?: number
  allocation_breakdown?: Record<string, number>
  year?: number
  annual_operating_budget_php?: number
  funding_coverage_pct?: number
  funding_gap_php?: number
  months_below_50pct_funding?: number
  new_admissions?: number
  peak_residents?: number
  challenge?: string
}

interface ImpactSnapshot {
  snapshotId: number
  snapshotDate: string
  metricPayloadJson: string
  isPublished: boolean
}

interface ParsedSnapshot extends ImpactSnapshot {
  metrics: MetricPayload
}

interface AllocationPoint { name: string; value: number }

type DonateStep = 'amount' | 'payment' | 'success'

// ── Checkout form (must live inside <Elements>) ───────────────────────────────
function CheckoutForm({ amountUsd, onSuccess }: { amountUsd: number; onSuccess: () => void }) {
  const stripe   = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading]     = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setIsLoading(true)
    setErrorMessage(null)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/donate?success=true` },
      redirect: 'if_required',
    })

    if (error) {
      setErrorMessage(error.message ?? 'Payment failed. Please try again.')
      setIsLoading(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement options={{ layout: 'tabs' }} />
      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
      <Button
        type="submit"
        disabled={!stripe || isLoading}
        size="lg"
        className="w-full rounded-full font-medium"
      >
        <Heart className="mr-2 h-4 w-4" />
        {isLoading ? 'Processing…' : `Donate $${amountUsd.toFixed(2)}`}
      </Button>
      <p className="text-center text-xs text-muted-foreground/60">
        Secured by Stripe · Test mode — no real charges
      </p>
    </form>
  )
}

// ── Success state ─────────────────────────────────────────────────────────────
function SuccessPanel({ amountUsd, isMonthly }: { amountUsd: number; isMonthly: boolean }) {
  return (
    <div className="flex flex-col items-center text-center gap-5 py-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </div>
      <div>
        <h3 className="font-serif text-2xl font-semibold text-foreground">
          Thank you for your ${amountUsd.toFixed(2)}{isMonthly ? '/mo' : ''} gift!
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {isMonthly
            ? 'Your monthly donation is confirmed. You can cancel anytime from your donor portal.'
            : 'Your donation is confirmed. Every peso goes directly to the children.'}
        </p>
      </div>
      <div className="w-full rounded-xl border border-border/60 bg-muted/30 p-5 text-left">
        <p className="text-sm font-medium text-foreground mb-1">Want to track your donations?</p>
        <p className="text-xs text-muted-foreground mb-4">
          Create an account or sign in and we'll link this donation to your donor profile.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button size="sm" asChild className="rounded-full">
            <Link to="/login">
              <LogIn className="mr-2 h-3.5 w-3.5" />
              Sign In
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild className="rounded-full">
            <Link to="/login?register=true">Create Account</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function DonatePage() {
  usePageTitle('Donate')
  const [searchParams] = useSearchParams()

  // Stripe / payment state
  const [step, setStep]                   = useState<DonateStep>(searchParams.get('success') === 'true' ? 'success' : 'amount')
  const [amountInput, setAmountInput]     = useState('50')
  const [isMonthly, setIsMonthly]         = useState(true)
  const [clientSecret, setClientSecret]   = useState<string | null>(null)
  const [isCreating, setIsCreating]       = useState(false)
  const [intentError, setIntentError]     = useState<string | null>(null)

  // Tier card section state
  const [activeTierIndex, setActiveTierIndex] = useState(1)

  // Slider payment widget state (independent from top widget)
  const [sliderStep, setSliderStep]               = useState<DonateStep>('amount')
  const [sliderClientSecret, setSliderClientSecret] = useState<string | null>(null)
  const [sliderIsCreating, setSliderIsCreating]   = useState(false)
  const [sliderIntentError, setSliderIntentError] = useState<string | null>(null)
  const [sliderIsMonthly, setSliderIsMonthly]     = useState(true)

  // Impact data for lower sections
  const [allocationData, setAllocationData]   = useState<AllocationPoint[]>([])
  const [donated2026, setDonated2026]         = useState(0)
  const annualBudget = 132000

  useEffect(() => {
    fetch(`${API}/api/public/impact-snapshots`, { credentials: 'include' })
      .then(r => r.ok ? r.json() as Promise<ImpactSnapshot[]> : null)
      .then(raw => {
        if (!raw) return
        const parsed: ParsedSnapshot[] = raw
          .filter(s => s.isPublished)
          .map(s => {
            let metrics: MetricPayload = {}
            try { metrics = JSON.parse(s.metricPayloadJson) as MetricPayload } catch { /* ignore */ }
            return { ...s, metrics }
          })
          .sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime())

        const monthly = parsed.filter(s => s.metrics.type !== 'annual_summary')

        // Sum 2026 donations from monthly snapshots
        const total2026 = monthly
          .filter(s => s.snapshotDate.startsWith('2026'))
          .reduce((sum, s) => sum + (s.metrics.donations_total_php ?? 0), 0)
        setDonated2026(Math.round(total2026))

        const totals: Record<string, number> = {}
        monthly.forEach(s => {
          const bd = s.metrics.allocation_breakdown
          if (!bd) return
          Object.entries(bd).forEach(([k, v]) => { totals[k] = (totals[k] ?? 0) + (v ?? 0) })
        })
        setAllocationData(
          Object.entries(totals)
            .map(([key, value]) => ({ name: AREA_LABELS[key] ?? key, value: Math.round(value) }))
            .sort((a, b) => b.value - a.value)
        )
      })
      .catch(() => { /* non-critical */ })
  }, [])

  const amountUsd   = Math.max(0.5, parseFloat(amountInput) || 0)
  const amountCents = Math.round(amountUsd * 100)

  async function handleContinueToPayment() {
    setIsCreating(true)
    setIntentError(null)
    try {
      const res = await fetch(`${API}/api/payments/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amountCents, recurring: isMonthly }),
      })
      const data = await res.json() as { clientSecret?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to initialize payment.')
      setClientSecret(data.clientSecret ?? null)
      setStep('payment')
    } catch (err) {
      setIntentError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsCreating(false)
    }
  }

  // ── Slider payment widget handler ────────────────────────────────────────
  const sliderAmountUsd   = donationTiers[activeTierIndex].amount
  const sliderAmountCents = sliderAmountUsd * 100

  async function handleSliderContinueToPayment() {
    setSliderIsCreating(true)
    setSliderIntentError(null)
    try {
      const res = await fetch(`${API}/api/payments/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amountCents: sliderAmountCents, recurring: sliderIsMonthly }),
      })
      const data = await res.json() as { clientSecret?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to initialize payment.')
      setSliderClientSecret(data.clientSecret ?? null)
      setSliderStep('payment')
    } catch (err) {
      setSliderIntentError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSliderIsCreating(false)
    }
  }

  function renderSliderPanel() {
    if (sliderStep === 'success') {
      return <SuccessPanel amountUsd={sliderAmountUsd} isMonthly={sliderIsMonthly} />
    }

    if (sliderStep === 'payment' && sliderClientSecret) {
      return (
        <div className="flex flex-col items-center text-center gap-6 py-2">
          <div className="flex flex-col items-center gap-1">
            <p className="text-5xl font-serif font-semibold text-foreground">
              ${sliderAmountUsd.toLocaleString()}
            </p>
            <span className="text-sm font-medium tracking-widest text-muted-foreground">
              USD{sliderIsMonthly ? ' / month' : ''}
            </span>
          </div>
          <div className="w-full text-left">
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: sliderClientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: { colorPrimary: 'oklch(0.45 0.18 280)', borderRadius: '8px' },
                },
              }}
            >
              <CheckoutForm amountUsd={sliderAmountUsd} onSuccess={() => setSliderStep('success')} />
            </Elements>
          </div>
          <button
            onClick={() => setSliderStep('amount')}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Change amount
          </button>
        </div>
      )
    }

    // amount step
    return (
      <div className="flex flex-col items-center text-center gap-6 py-2">
        <div className="flex flex-col items-center gap-2">
          <img
            src="/images/TransparentPinwheelLogo.png"
            alt="Lunas Project logo"
            className="h-16 w-auto"
          />
          <div>
            <p className="text-xs text-muted-foreground">Donate to</p>
            <p className="text-lg font-semibold text-foreground flex items-center gap-1.5">
              The Lunas Project
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="relative flex items-center">
            <span className="text-4xl font-serif font-semibold text-foreground mr-1">$</span>
            <span className="text-5xl font-serif font-semibold text-foreground">
              {sliderAmountUsd.toLocaleString()}
            </span>
          </div>
          <span className="text-sm font-medium tracking-widest text-muted-foreground">USD</span>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer text-sm text-muted-foreground select-none">
          <input
            type="checkbox"
            checked={sliderIsMonthly}
            onChange={e => setSliderIsMonthly(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
          />
          Make this a monthly donation
        </label>

        {sliderIntentError && <p className="text-sm text-destructive">{sliderIntentError}</p>}

        <div className="w-full flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full rounded-full font-medium py-6 text-base"
            onClick={handleSliderContinueToPayment}
            disabled={sliderIsCreating}
          >
            <Heart className="mr-2 h-4 w-4" />
            {sliderIsCreating ? 'Preparing…' : 'Donate with Card'}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground/50">
          Secured by Stripe · Test mode — no real charges
        </p>
      </div>
    )
  }

  // ── Right panel content per step ──────────────────────────────────────────
  function renderRightPanel() {
    if (step === 'success') {
      return <SuccessPanel amountUsd={amountUsd} isMonthly={isMonthly} />
    }

    if (step === 'payment' && clientSecret) {
      return (
        <div className="flex flex-col items-center text-center gap-6 py-2">
          {/* Amount recap */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-5xl font-serif font-semibold text-foreground">
              ${amountUsd.toFixed(2)}
            </p>
            <span className="text-sm font-medium tracking-widest text-muted-foreground">
              USD{isMonthly ? ' / month' : ''}
            </span>
          </div>

          {/* Stripe form — left-aligned for readability */}
          <div className="w-full text-left">
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: { colorPrimary: 'oklch(0.45 0.18 280)', borderRadius: '8px' },
                },
              }}
            >
              <CheckoutForm amountUsd={amountUsd} onSuccess={() => setStep('success')} />
            </Elements>
          </div>

          <button
            onClick={() => setStep('amount')}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Change amount
          </button>
        </div>
      )
    }

    // amount step
    return (
      <div className="flex flex-col items-center text-center gap-4 py-1">

        {/* Logo + org name */}
        <div className="flex flex-col items-center gap-2">
          <img
            src="/images/TransparentPinwheelLogo.png"
            alt="Lunas Project logo"
            className="h-14 w-auto"
          />
          <div>
            <p className="text-sm text-muted-foreground">Donate to</p>
            <p className="text-xl font-semibold text-foreground flex items-center gap-1.5">
              The Lunas Project
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </p>
          </div>
        </div>

        {/* Big editable amount */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative flex items-center">
            <span className="text-5xl font-serif font-semibold text-foreground mr-1">$</span>
            <input
              type="number"
              min="1"
              step="1"
              value={amountInput}
              onChange={e => setAmountInput(e.target.value)}
              placeholder="0"
              className="w-40 text-center text-6xl font-serif font-semibold text-foreground bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-foreground/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <span className="text-base font-medium tracking-widest text-muted-foreground">USD</span>
        </div>

        {/* Monthly checkbox */}
        <label className="flex items-center gap-2.5 cursor-pointer text-base text-muted-foreground select-none">
          <input
            type="checkbox"
            checked={isMonthly}
            onChange={e => setIsMonthly(e.target.checked)}
            className="h-5 w-5 rounded border-border accent-primary cursor-pointer"
          />
          Make this a monthly donation
        </label>

        {intentError && <p className="text-base text-destructive">{intentError}</p>}

        {/* Donate button */}
        <div className="w-full flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full rounded-full font-medium py-6 text-lg"
            onClick={handleContinueToPayment}
            disabled={isCreating || amountUsd < 0.5}
          >
            <Heart className="mr-2 h-5 w-5" />
            {isCreating ? 'Preparing…' : 'Donate with Card'}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground/50">
          Secured by Stripe · Test mode — no real charges
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Section 1: Hero + Stripe (split panel) ── */}
      <section className="pb-16 pt-12 sm:pt-16 bg-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">

            {/* Left: emotional copy */}
            <div className="pt-4">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-4">
                Make a Difference
              </p>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-foreground tracking-tight leading-[1.08]">
                Provide Healing.
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Your support funds the healing these children need. Every penny reaches them directly.
              </p>

              {/* Trust signals */}
              <div className="mt-8 flex flex-col gap-3">
                {trustSignals.map(signal => (
                  <div key={signal.label} className="flex items-center gap-3 text-base text-muted-foreground">
                    <signal.icon className="h-5 w-5 text-primary/60 flex-shrink-0" />
                    <span>{signal.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: payment widget */}
            <div>
              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-5 sm:p-6">
                  {renderRightPanel()}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Where Your Money Goes — below the card */}
          <div className="mt-14 flex justify-center">
            <button
              type="button"
              onClick={() => document.getElementById('tier-breakdown')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex flex-col items-center gap-3 group cursor-pointer"
            >
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                Where Your Money Goes
              </h2>
              <p className="text-sm text-muted-foreground">
                See what each dollar funds.
              </p>
              <div className="flex items-center justify-center h-10 w-10 rounded-full border border-border text-muted-foreground group-hover:text-primary group-hover:border-primary transition-colors animate-bounce">
                <ChevronDown className="h-5 w-5" />
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ── Section 2: Tier breakdown slider ── */}
      <section id="tier-breakdown" className="py-20 sm:py-28 bg-muted/30 scroll-mt-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">

            {/* Left: slider */}
            <div>
              {(() => {
                const tier = donationTiers[activeTierIndex]
                const Icon = tier.icon
                return (
                  <div className="flex flex-col items-center text-center mb-10 gap-3">
                    <div className="transition-all duration-200">
                      <Icon className="h-20 w-20 text-primary/70" strokeWidth={1.2} />
                    </div>
                    <div className="font-serif text-5xl font-semibold text-foreground">{tier.label}</div>
                    <p className="text-sm text-muted-foreground/70 -mt-1">per month</p>
                    <p className="text-base text-muted-foreground leading-relaxed max-w-xs">{tier.description}</p>
                  </div>
                )
              })()}

              <div className="px-2">
                <input
                  type="range"
                  min={0}
                  max={donationTiers.length - 1}
                  step={1}
                  value={activeTierIndex}
                  onChange={e => {
                    const i = Number(e.target.value)
                    setActiveTierIndex(i)
                    setAmountInput(String(donationTiers[i].amount))
                    setSliderStep('amount')
                    setSliderClientSecret(null)
                  }}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
                  style={{
                    background: `linear-gradient(to right, oklch(0.45 0.18 280) ${(activeTierIndex / (donationTiers.length - 1)) * 100}%, oklch(0.92 0.01 280) ${(activeTierIndex / (donationTiers.length - 1)) * 100}%)`,
                  }}
                />
                <div className="flex justify-between mt-3 px-0.5">
                  {donationTiers.map((tier, i) => (
                    <button
                      key={tier.amount}
                      type="button"
                      onClick={() => {
                        setActiveTierIndex(i)
                        setAmountInput(String(tier.amount))
                        setSliderStep('amount')
                        setSliderClientSecret(null)
                      }}
                      className={`text-xs font-medium transition-colors cursor-pointer ${i === activeTierIndex ? 'text-primary font-semibold' : 'text-muted-foreground/50 hover:text-muted-foreground'}`}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: payment widget driven by slider */}
            <div>
              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-6 sm:p-8">
                  {renderSliderPanel()}
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </section>

      {/* ── Goal + Where It Goes ── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-start">

            {/* Left: 2026 Goal */}
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
                2026 Goal
              </p>
              <h2 className="mt-4 font-serif text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                Our Goal
              </h2>
              <div className="mt-6">
                <div className="font-serif text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
                  {Math.min(Math.round((donated2026 / annualBudget) * 100), 100)}%
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  ₱{donated2026.toLocaleString()} of ₱{(annualBudget / 1000).toFixed(0)}K raised
                </p>
              </div>
              <div className="mt-6 h-5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min((donated2026 / annualBudget) * 100, 100)}%`,
                    backgroundColor: 'oklch(0.45 0.18 280)',
                  }}
                />
              </div>
            </div>

            {/* Right: Where It Goes pie chart */}
            {allocationData.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
                  Transparency
                </p>
                <h2 className="mt-4 font-serif text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                  Where It Goes
                </h2>
                <div className="mt-6 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocationData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={50}
                      >
                        {allocationData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '13px',
                          color: '#111827',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                        formatter={(value: unknown, name: unknown) => [`₱${Number(value).toLocaleString()}`, String(name)]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-2">
                  {allocationData.map((area, index) => {
                    const total = allocationData.reduce((sum, d) => sum + d.value, 0)
                    const pct = (area.value / total) * 100
                    return (
                      <div key={area.name} className="flex items-center gap-2 text-sm">
                        <span
                          className="inline-block h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="text-foreground font-medium">{area.name}</span>
                        <span className="text-muted-foreground">{pct.toFixed(0)}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

    </div>
  )
}
