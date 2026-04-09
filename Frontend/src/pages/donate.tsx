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
} from 'lucide-react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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

const AREA_COLORS: Record<string, string> = {
  Education:   'oklch(0.45 0.18 280)',
  Operations:  'oklch(0.55 0.15 280)',
  Wellbeing:   'oklch(0.35 0.12 280)',
  Maintenance: 'oklch(0.65 0.10 280)',
  Transport:   'oklch(0.70 0.08 280)',
  Outreach:    'oklch(0.75 0.06 280)',
}

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
  { label: '100% goes to the children', icon: Heart },
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

interface FundingPoint { month: string; donated: number; target: number }
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
  const [fundingOverTime, setFundingOverTime] = useState<FundingPoint[]>([])
  const [allocationData, setAllocationData]   = useState<AllocationPoint[]>([])
  const [annualSnapshots, setAnnualSnapshots] = useState<ParsedSnapshot[]>([])
  const [latestAnnual, setLatestAnnual]       = useState<MetricPayload | null>(null)

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
        const annual  = parsed.filter(s => s.metrics.type === 'annual_summary')
          .sort((a, b) => (a.metrics.year ?? 0) - (b.metrics.year ?? 0))

        setAnnualSnapshots(annual)
        if (annual.length > 0) setLatestAnnual(annual[annual.length - 1].metrics)

        setFundingOverTime(
          monthly
            .filter(s => s.metrics.donations_total_php !== undefined)
            .map(s => ({
              month: new Date(s.snapshotDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
              donated: Math.round(s.metrics.donations_total_php ?? 0),
              target:  s.metrics.monthly_operating_cost_php ?? 11000,
            }))
        )

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
      <div className="flex flex-col items-center text-center gap-6 py-2">

        {/* Logo + org name */}
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

        {/* Big editable amount */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative flex items-center">
            <span className="text-4xl font-serif font-semibold text-foreground mr-1">$</span>
            <input
              type="number"
              min="1"
              step="1"
              value={amountInput}
              onChange={e => setAmountInput(e.target.value)}
              placeholder="0"
              className="w-36 text-center text-5xl font-serif font-semibold text-foreground bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-foreground/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <span className="text-sm font-medium tracking-widest text-muted-foreground">USD</span>
        </div>

        {/* Monthly checkbox */}
        <label className="flex items-center gap-2.5 cursor-pointer text-sm text-muted-foreground select-none">
          <input
            type="checkbox"
            checked={isMonthly}
            onChange={e => setIsMonthly(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
          />
          Make this a monthly donation
        </label>

        {intentError && <p className="text-sm text-destructive">{intentError}</p>}

        {/* Donate button */}
        <div className="w-full flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full rounded-full font-medium py-6 text-base"
            onClick={handleContinueToPayment}
            disabled={isCreating || amountUsd < 0.5}
          >
            <Heart className="mr-2 h-4 w-4" />
            {isCreating ? 'Preparing…' : 'Donate with Card'}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground/50">
          Secured by Stripe · Test mode — no real charges
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Section 1: Hero + Stripe (split panel) ── */}
      <section className="pt-20 pb-16 sm:pt-28 sm:pb-24 bg-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-[2fr_3fr] gap-12 items-start">

            {/* Left: emotional copy */}
            <div className="pt-4">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-4">
                Make a Difference
              </p>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-5xl font-semibold text-foreground tracking-tight leading-[1.1] whitespace-nowrap">
                Provide Healing.
              </h1>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                Your support funds the healing these children need. Every penny reaches them directly.
              </p>

              {/* Trust signals */}
              <div className="mt-8 flex flex-col gap-3">
                {trustSignals.map(signal => (
                  <div key={signal.label} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <signal.icon className="h-4 w-4 text-primary/60 flex-shrink-0" />
                    <span>{signal.label}</span>
                  </div>
                ))}
              </div>


            </div>

            {/* Right: payment widget */}
            <div>
              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-8">
                  {renderRightPanel()}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Tier breakdown ── */}
      <section className="pb-20 sm:pb-28 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-20">
          <div className="mx-auto max-w-3xl text-center mb-14">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-4">
              Your Impact
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
              Where Your Money Goes
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              We break down what each dollar funds so you always know your direct impact.
            </p>
          </div>

          {/* Slider tier selector + payment widget */}
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
                <CardContent className="p-8">
                  {renderSliderPanel()}
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </section>

      {/* ── Section 4: Funding charts ── */}
      {(fundingOverTime.length > 0 || allocationData.length > 0 || annualSnapshots.length > 0) && (
        <section className="py-20 sm:py-28 bg-background">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center mb-14">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-4">
                Funding Progress
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                Help Close the Gap
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                ₱11,000 is needed each month to fully fund all 9 safehouses.
                Every donation moves the bar.
              </p>
            </div>

            <div className="space-y-8">
              {/* Monthly donations vs target */}
              {fundingOverTime.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Donations vs. Operating Target</CardTitle>
                    <CardDescription>
                      The gap between the bars is what limits services for the children.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={fundingOverTime} barGap={2}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="month" className="text-xs fill-muted-foreground" interval={2} />
                          <YAxis className="text-xs fill-muted-foreground" tickFormatter={(v: number) => `₱${(v / 1000).toFixed(0)}k`} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                            formatter={(value) => [`₱${Number(value).toLocaleString()}`, '']}
                          />
                          <Legend />
                          <Bar dataKey="target"  name="Monthly Target (₱11,000)" fill={CHART_COLORS[3]} radius={[4,4,0,0]} opacity={0.4} />
                          <Bar dataKey="donated" name="Donated"                   fill={CHART_COLORS[0]} radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Allocation + breakdown */}
              {allocationData.length > 0 && (
                <div className="grid gap-8 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Where Donations Go</CardTitle>
                      <CardDescription>Cumulative allocation across all months — every peso tracked.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={allocationData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              label={({ name, percent }: { name?: string; percent?: number }) =>
                                `${(name ?? '').split(' ')[0]} ${((percent ?? 0) * 100).toFixed(0)}%`
                              }
                              labelLine={false}
                            >
                              {allocationData.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                              formatter={(value) => [`₱${Number(value).toLocaleString()}`, '']}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Program Area Breakdown</CardTitle>
                      <CardDescription>Total allocated per area across all recorded months</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(() => {
                        const total = allocationData.reduce((sum, d) => sum + d.value, 0)
                        return allocationData.map((area, index) => (
                          <div key={area.name} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium text-foreground">{area.name}</span>
                              <span className="text-muted-foreground">
                                ₱{area.value.toLocaleString()} · {((area.value / total) * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${(area.value / total) * 100}%`,
                                  backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                                }}
                              />
                            </div>
                          </div>
                        ))
                      })()}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Annual report cards */}
              {annualSnapshots.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Annual Reports</h3>
                  <div className="grid gap-6 lg:grid-cols-3">
                    {annualSnapshots.map(snap => {
                      const m        = snap.metrics
                      const pct      = m.funding_coverage_pct ?? 0
                      const gap      = m.funding_gap_php ?? 0
                      const hard     = m.months_below_50pct_funding ?? 0
                      const color    = pct >= 85 ? 'text-green-600'   : pct >= 60 ? 'text-amber-600'   : 'text-red-600'
                      const bgColor  = pct >= 85 ? 'bg-green-50 border-green-200' : pct >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
                      return (
                        <Card key={snap.snapshotId} className={`border ${bgColor}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-baseline justify-between">
                              <CardTitle className="text-xl">{m.year}</CardTitle>
                              <span className={`text-2xl font-bold font-serif ${color}`}>{pct.toFixed(0)}%</span>
                            </div>
                            <CardDescription>of ₱{((m.annual_operating_budget_php ?? 132000) / 1000).toFixed(0)}k annual budget funded</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(pct, 100)}%`,
                                  backgroundColor: pct >= 85 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626',
                                }}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">Funding gap</p>
                                <p className="font-semibold text-foreground">₱{Math.round(gap).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Hard months</p>
                                <p className="font-semibold text-foreground">{hard} / 12</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">New admissions</p>
                                <p className="font-semibold text-foreground">{m.new_admissions ?? '—'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Peak residents</p>
                                <p className="font-semibold text-foreground">{m.peak_residents ?? '—'}</p>
                              </div>
                            </div>
                            {m.challenge && (
                              <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
                                {m.challenge}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Section 3: Financial Transparency ── */}
      {latestAnnual && (
        <section className="py-16 sm:py-20 bg-foreground text-background">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-start">

              {/* Left: allocation bar */}
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-background/50 mb-4">
                  Financial Transparency
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-background tracking-tight">
                  Every peso, accounted for
                </h2>
                <p className="mt-4 text-base text-background/70 leading-relaxed">
                  In {latestAnnual.year} we raised{' '}
                  <span className="font-semibold text-background">{latestAnnual.funding_coverage_pct?.toFixed(0)}%</span>{' '}
                  of our annual operating budget. Here is exactly where every donated peso went.
                </p>

                {latestAnnual.allocation_breakdown && (
                  <div className="mt-8 space-y-3">
                    <div className="flex h-6 w-full rounded-full overflow-hidden gap-px">
                      {Object.entries(latestAnnual.allocation_breakdown)
                        .sort(([, a], [, b]) => b - a)
                        .map(([key, value]) => {
                          const total = Object.values(latestAnnual.allocation_breakdown!).reduce((s, v) => s + v, 0)
                          const pct   = (value / total) * 100
                          return (
                            <div
                              key={key}
                              title={`${AREA_LABELS[key] ?? key}: ${pct.toFixed(0)}%`}
                              style={{ width: `${pct}%`, backgroundColor: AREA_COLORS[key] ?? 'oklch(0.5 0.1 280)' }}
                            />
                          )
                        })}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                      {Object.entries(latestAnnual.allocation_breakdown)
                        .sort(([, a], [, b]) => b - a)
                        .map(([key, value]) => {
                          const total = Object.values(latestAnnual.allocation_breakdown!).reduce((s, v) => s + v, 0)
                          return (
                            <div key={key} className="flex items-center gap-1.5 text-xs text-background/70">
                              <span className="inline-block h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: AREA_COLORS[key] ?? 'oklch(0.5 0.1 280)' }} />
                              {AREA_LABELS[key] ?? key}{' '}
                              <span className="text-background/50">{((value / total) * 100).toFixed(0)}%</span>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: challenge quote + CTA */}
              <div className="flex flex-col gap-6">
                {latestAnnual.challenge && (
                  <div className="rounded-2xl border border-background/10 bg-background/5 p-6">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-background/40 mb-3">
                      {latestAnnual.year} — What the gap cost us
                    </p>
                    <blockquote className="text-base leading-relaxed text-background/80 italic">
                      "{latestAnnual.challenge}"
                    </blockquote>
                  </div>
                )}
                <Button
                  size="lg"
                  className="bg-background text-foreground hover:bg-background/90 font-medium rounded-full w-fit"
                  onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                >
                  <Heart className="mr-2 h-4 w-4" />
                  Donate Now
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  )
}
