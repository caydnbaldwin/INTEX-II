import { Link } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { ArrowRight, ChevronDown, Heart, CheckCircle2, Pill, Utensils, Stethoscope, Users, Home, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { usePageTitle } from '@/hooks/usePageTitle'

const AREA_COLORS: Record<string, string> = {
  'Education':   'oklch(0.45 0.18 280)',
  'Operations':  'oklch(0.55 0.15 280)',
  'Wellbeing':   'oklch(0.35 0.12 280)',
  'Maintenance': 'oklch(0.65 0.10 280)',
  'Transport':   'oklch(0.70 0.08 280)',
  'Outreach':    'oklch(0.75 0.06 280)',
}
const AREA_LABELS: Record<string, string> = {
  Education:   'Education',
  Operations:  'Operations',
  Wellbeing:   'Counseling',
  Maintenance: 'Maintenance',
  Transport:   'Transport',
  Outreach:    'Outreach',
}

interface AnnualPayload {
  type: string
  year: number
  funding_coverage_pct: number
  funding_gap_php: number
  allocation_breakdown: Record<string, number>
  challenge: string
  months_below_50pct_funding: number
}

const donationTiers = [
  { amount: 15, label: '$15', description: 'Provides essential vitamins for a child', icon: Pill, iconLabel: 'Vitamins' },
  { amount: 50, label: '$50', description: 'Feeds a child for an entire month', icon: Utensils, iconLabel: 'Meals' },
  { amount: 100, label: '$100', description: 'Covers medical, dental, and educational needs', icon: Stethoscope, iconLabel: 'Healthcare' },
  { amount: 300, label: '$300', description: 'Employs a professional caregiver for many children', icon: Users, iconLabel: 'Caregivers' },
  { amount: 1500, label: '$1,500', description: 'Pays the mortgage that provides refuge for all children', icon: Home, iconLabel: 'Shelter' },
]

export function LandingPage() {
  usePageTitle('Home')
  const API = import.meta.env.VITE_API_BASE_URL as string
  const [backendStatus, setBackendStatus] = useState('')
  const [dbStatus, setDbStatus] = useState('')
  const [isCheckingBackend, setIsCheckingBackend] = useState(false)
  const [isCheckingDb, setIsCheckingDb] = useState(false)
  const [donationTier, setDonationTier] = useState(0)
  const [latestAnnual, setLatestAnnual] = useState<AnnualPayload | null>(null)

  useEffect(() => {
    fetch(`${API}/api/public/impact-snapshots`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then((snapshots: Array<{ metricPayloadJson: string }> | null) => {
        if (!snapshots) return
        const annual = snapshots
          .map(s => { try { return JSON.parse(s.metricPayloadJson) as AnnualPayload } catch { return null } })
          .filter((p): p is AnnualPayload => p?.type === 'annual_summary')
          .sort((a, b) => b.year - a.year)
        if (annual.length > 0) setLatestAnnual(annual[0])
      })
      .catch(() => { /* non-critical — transparency strip stays hidden */ })
  }, [API])

  async function verifyBackend() {
    setBackendStatus('Checking backend...')
    setIsCheckingBackend(true)
    try {
      const response = await fetch(`${API}/api/health`, { method: 'GET', credentials: 'include' })
      if (!response.ok) { setBackendStatus(`Backend check failed (${response.status}).`); return }
      const data = await response.json() as { message?: string }
      setBackendStatus(data.message ?? 'Backend reachable.')
    } catch {
      setBackendStatus('Unable to reach backend.')
    } finally {
      setIsCheckingBackend(false)
    }
  }

  async function verifyDatabase() {
    setDbStatus('Checking database...')
    setIsCheckingDb(true)
    try {
      const response = await fetch(`${API}/api/dbcheck`, { method: 'GET', credentials: 'include' })
      if (!response.ok) { setDbStatus(`Database check failed (${response.status}).`); return }
      const data = await response.json() as Record<string, unknown>
      setDbStatus(`Database check succeeded (${Object.keys(data).length} tables verified).`)
    } catch {
      setDbStatus('Unable to reach database check endpoint.')
    } finally {
      setIsCheckingDb(false)
    }
  }

  const scrollToContent = () => {
    document.getElementById('crisis')?.scrollIntoView({ behavior: 'smooth' })
  }

  const currentTier = donationTiers[donationTier]

  return (
    <div className="flex flex-col">
      {/* ───────────────── Hero ───────────────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/images/hero-bg.jpg)' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, oklch(0.15 0.08 280 / 0.15), oklch(0.15 0.08 280 / 0.45), oklch(0.15 0.08 280 / 0.75))',
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 py-24 w-full flex justify-end">
          <div className="max-w-2xl text-right">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-sm text-white/90">
              <span>Restoring Hope in the Philippines</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl text-white leading-[1.08]">
              <span className="font-serif italic font-normal">Your Healing,</span>
              <br />
              <span className="font-serif font-bold">Our Mission</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl leading-relaxed text-white/80 max-w-xl text-pretty ml-auto">
              We provide holistic care, education, counseling, and a path toward healing
              for survivors of abuse and trafficking in the Philippines.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-end justify-end gap-4">
              <Button size="lg" asChild className="bg-white text-black hover:bg-white/90 font-medium">
                <Link to="/impact">
                  See Our Impact
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white hover:border-white/60"
              >
                <Link to="/donate">
                  <Heart className="mr-2 h-4 w-4" />
                  Contribute / Donate
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <button
          onClick={scrollToContent}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/60 hover:text-white transition-colors cursor-pointer"
          aria-label="Scroll to content"
        >
          <span className="text-xs uppercase tracking-widest">Explore</span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </button>
      </section>

      {/* ───────────────── The Crisis: 1-in-5 + COVID + Map ───────────────── */}
      <section id="crisis" className="py-20 sm:py-28 bg-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 space-y-20 lg:space-y-24">

          {/* Row 1: 1-in-5 graphic (left) + crisis text (right) */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <img
                src="/images/1_5GirlsGraphic.png"
                alt="1 in 5 girls in the Philippines face sexual abuse"
                className="w-full max-w-sm"
              />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-4">
                The Crisis
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground tracking-tight">
                A Crisis Hiding<br />in Plain Sight
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">1 in 5 girls</span> in the
                Philippines will experience sexual abuse before turning 18. The country is widely
                considered a global hotspot for online sexual exploitation of children.
              </p>
              <p className="mt-4 text-base text-muted-foreground/70 leading-relaxed">
                For many of these children, there is no support system, no safe place to turn,
                and no path toward justice or healing.
              </p>
            </div>
          </div>

          {/* Row 2: COVID text + 265% stat (left) + chart (right) */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-4">
                The Pandemic Effect
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                COVID Made It Worse
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                When lockdowns forced children indoors with their abusers and onto screens,
                online sexual exploitation surged dramatically.
              </p>
              <div className="mt-8 flex items-baseline gap-3">
                <span className="text-6xl font-serif font-bold text-primary">265%</span>
                <span className="text-sm text-muted-foreground leading-tight max-w-[10rem]">
                  increase in online<br />sexual abuse cases in 2021
                </span>
              </div>
              <p className="mt-6 text-xs text-muted-foreground/50">
                Source: Philippine Internet Crimes Against Children Center (PICACC) &amp; IJM reports
              </p>
            </div>

            <div>
              <CovidImpactChart />
            </div>
          </div>

          {/* Row 3: Map (left) + safe houses text (right) */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <img
                src="/images/locationsMap.png"
                alt="Map of the Philippines showing 9 Lunas safehouse locations"
                className="w-full max-w-sm rounded-2xl"
              />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-4">
                Until Now
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                There Were None.<br />Now There Are Nine.
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                In many regions of the Philippines, there were{' '}
                <span className="font-semibold text-foreground">no safe houses</span> for
                survivors of sexual abuse — no shelter, no professional support, no path to healing.
              </p>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                Lunas changed that. We established nine shelters across Luzon, Visayas, and
                Mindanao — each providing 24/7 trauma-informed care, education, and a real
                chance at a new beginning.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ───────────────── Donate CTA ───────────────── */}
      <section className="pt-10 sm:pt-14 pb-20 sm:pb-28 bg-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-14">
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground tracking-tight">
              Give a Girl Her Future Back
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              The holistic healing provided to the children of Lunas is only possible with
              your financial help. Every penny goes directly to the children.
            </p>
          </div>

          {/* Donation Slider — side-by-side layout */}
          <div className="mx-auto max-w-4xl grid md:grid-cols-2 gap-10 items-center">
            {/* Left: slider + amount */}
            <div>
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

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button size="lg" asChild className="rounded-full px-8 font-medium">
                  <Link to="/donate">
                    Donate Now
                    <Heart className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="rounded-full px-8">
                  <Link to="/login">Become a Partner</Link>
                </Button>
              </div>
            </div>

            {/* Right: animated icon card */}
            <DonationIconCard tier={donationTier} />
          </div>
        </div>
      </section>

      {/* ───────────────── Impact: Bento Grid ───────────────── */}
      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-14">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-4">
              Our Impact
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground tracking-tight">
              Transforming Lives Every Day
            </h2>
          </div>

          {/* Bento grid: mixed stat cards + images */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {/* Stat card */}
            <div className="bg-primary rounded-2xl p-6 flex flex-col justify-end text-white">
              <Heart className="h-6 w-6 mb-4 text-white/60" />
              <div className="text-4xl font-serif font-bold">150+</div>
              <div className="mt-1 text-sm text-white/80">survivors served with holistic, trauma-informed care</div>
            </div>

            {/* Image */}
            <div className="rounded-2xl overflow-hidden">
              <img
                src="/images/otherImages/GirlWithSquash1.png"
                alt="Girl in the garden"
                className="h-full w-full object-cover"
              />
            </div>

            {/* Tall image spanning 2 rows */}
            <div className="row-span-2 rounded-2xl overflow-hidden">
              <img
                src="/images/otherImages/GirlStandingInHouseYard.png"
                alt="Girl standing at safehouse"
                className="h-full w-full object-cover"
              />
            </div>

            {/* Stat card */}
            <div className="bg-foreground rounded-2xl p-6 flex flex-col justify-end text-background">
              <div className="text-4xl font-serif font-bold">9</div>
              <div className="mt-1 text-sm opacity-70">shelters operating across the Philippines</div>
            </div>

            {/* Stat card */}
            <div className="bg-primary/10 rounded-2xl p-6 flex flex-col justify-end">
              <div className="text-4xl font-serif font-bold text-primary">8+</div>
              <div className="mt-1 text-sm text-muted-foreground">years of continuous service</div>
            </div>

            {/* Image */}
            <div className="rounded-2xl overflow-hidden">
              <img
                src="/images/otherImages/GroupTalking.png"
                alt="Group therapy session"
                className="h-full w-full object-cover"
              />
            </div>

            {/* Stat card - wide */}
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 flex flex-col justify-end">
              <div className="text-4xl font-serif font-bold text-foreground">1,000+</div>
              <div className="mt-1 text-sm text-muted-foreground">counseling sessions completed</div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── Transparency Strip ───────────────── */}
      {latestAnnual && (
        <section className="py-16 sm:py-20 bg-foreground text-background">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-start">

              {/* Left: heading + allocation bar */}
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-background/50 mb-4">
                  Financial Transparency
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-background tracking-tight">
                  Every peso, accounted for
                </h2>
                <p className="mt-4 text-base text-background/70 leading-relaxed">
                  In {latestAnnual.year} we raised{' '}
                  <span className="font-semibold text-background">{latestAnnual.funding_coverage_pct.toFixed(0)}%</span>{' '}
                  of our annual operating budget.{' '}
                  Here is exactly where every donated peso went.
                </p>

                {/* Segmented allocation bar */}
                <div className="mt-8 space-y-3">
                  <div className="flex h-6 w-full rounded-full overflow-hidden gap-px">
                    {Object.entries(latestAnnual.allocation_breakdown)
                      .sort(([, a], [, b]) => b - a)
                      .map(([key, value]) => {
                        const total = Object.values(latestAnnual.allocation_breakdown).reduce((s, v) => s + v, 0)
                        const pct = (value / total) * 100
                        return (
                          <div
                            key={key}
                            title={`${AREA_LABELS[key] ?? key}: ${pct.toFixed(0)}%`}
                            style={{ width: `${pct}%`, backgroundColor: AREA_COLORS[key] ?? 'oklch(0.5 0.1 280)' }}
                          />
                        )
                      })}
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                    {Object.entries(latestAnnual.allocation_breakdown)
                      .sort(([, a], [, b]) => b - a)
                      .map(([key, value]) => {
                        const total = Object.values(latestAnnual.allocation_breakdown).reduce((s, v) => s + v, 0)
                        return (
                          <div key={key} className="flex items-center gap-1.5 text-xs text-background/70">
                            <span
                              className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: AREA_COLORS[key] ?? 'oklch(0.5 0.1 280)' }}
                            />
                            {AREA_LABELS[key] ?? key}{' '}
                            <span className="text-background/50">{((value / total) * 100).toFixed(0)}%</span>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>

              {/* Right: challenge callout + CTA */}
              <div className="flex flex-col gap-6">
                <div className="rounded-2xl border border-background/10 bg-background/5 p-6">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-background/40 mb-3">
                    {latestAnnual.year} — What the gap cost us
                  </p>
                  <blockquote className="text-base leading-relaxed text-background/80 italic">
                    "{latestAnnual.challenge}"
                  </blockquote>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    asChild
                    className="bg-background text-foreground hover:bg-background/90 font-medium rounded-full"
                  >
                    <Link to="/impact?tab=funding">
                      See Full Financial Report
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="border-background/30 text-background bg-transparent hover:bg-background/10 hover:text-background rounded-full"
                  >
                    <Link to="/login">
                      <Heart className="mr-2 h-4 w-4" />
                      Close the Gap
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ───────────────── Education: Text + Overlapping Images ───────────────── */}
      <section className="py-20 sm:py-28 bg-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Text side */}
            <div className="lg:col-span-5">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-4">
                Education & Growth
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                Every Child Deserves to Learn
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Each girl in our care receives access to bridge programs, secondary education,
                vocational training, and literacy support.
              </p>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                From paper crafts to formal schooling,
                we meet every child where they are and help them build the future they deserve.
              </p>
              <Button variant="outline" size="lg" asChild className="mt-8 rounded-full">
                <Link to="/impact">
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Image collage side */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-12 grid-rows-6 gap-3 h-[28rem] sm:h-[32rem]">
                {/* Large main image */}
                <div className="col-span-7 row-span-6 rounded-2xl overflow-hidden">
                  <img
                    src="/images/otherImages/GirlStudyingOnWall1.png"
                    alt="Girl studying"
                    className="h-full w-full object-cover"
                  />
                </div>
                {/* Top-right image */}
                <div className="col-span-5 row-span-3 rounded-2xl overflow-hidden">
                  <img
                    src="/images/otherImages/GirlPaperCraft.png"
                    alt="Girl doing paper crafts"
                    className="h-full w-full object-cover"
                  />
                </div>
                {/* Bottom-right image */}
                <div className="col-span-5 row-span-3 rounded-2xl overflow-hidden">
                  <img
                    src="/images/otherImages/3GirlsSittingOnAWall.png"
                    alt="Girls sitting together"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── Community & Healing: Reversed layout ───────────────── */}
      <section className="py-20 sm:py-28 bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Image collage side */}
            <div className="lg:col-span-7 order-2 lg:order-1">
              <div className="grid grid-cols-12 grid-rows-6 gap-3 h-[28rem] sm:h-[32rem]">
                {/* Top-left image */}
                <div className="col-span-5 row-span-3 rounded-2xl overflow-hidden">
                  <img
                    src="/images/otherImages/ComfortingYoungChild.png"
                    alt="Caregiver comforting a child"
                    className="h-full w-full object-cover"
                  />
                </div>
                {/* Large main image */}
                <div className="col-span-7 row-span-6 rounded-2xl overflow-hidden">
                  <img
                    src="/images/otherImages/GroupTalking.png"
                    alt="Group therapy session"
                    className="h-full w-full object-cover"
                  />
                </div>
                {/* Bottom-left: stat overlay card */}
                <div className="col-span-5 row-span-3 bg-primary rounded-2xl p-5 flex flex-col justify-end text-white">
                  <div className="text-3xl font-serif font-bold">100%</div>
                  <div className="mt-1 text-sm text-white/80">of girls receive individualized counseling & health monitoring</div>
                </div>
              </div>
            </div>

            {/* Text side */}
            <div className="lg:col-span-5 order-1 lg:order-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-4">
                Community & Healing
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                Healing Happens Together
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Recovery is not a journey anyone should walk alone. Through group therapy,
                peer support, and a nurturing community of houseparents and counselors, our
                girls learn that they are not defined by their past.
              </p>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                Every child receives individualized counseling, nutritious meals, health
                monitoring, and a family that believes in them.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── Hope Image ───────────────── */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl">
            <img
              src="/images/otherImages/GirlSunset1.png"
              alt="Girl with arms spread at sunset — a symbol of hope and freedom"
              className="h-[28rem] sm:h-[32rem] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
              <p className="font-serif italic text-xl sm:text-2xl text-white/90 max-w-2xl">
                "She is not what happened to her. She is what she chooses to become."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── Trust Indicators ───────────────── */}
      <section className="py-12 bg-background border-t border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-muted-foreground">
            <TrustItem text="501(c)(3) Registered" />
            <span className="hidden sm:inline text-border">|</span>
            <TrustItem text="GDPR Compliant" />
            <span className="hidden sm:inline text-border">|</span>
            <TrustItem text="Transparent Reporting" />
            <span className="hidden sm:inline text-border">|</span>
            <TrustItem text="Annual Audits" />
          </div>
        </div>
      </section>

      {/* Connection verification links */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={verifyBackend}
          disabled={isCheckingBackend}
          className="hover:text-foreground transition-colors disabled:opacity-60"
        >
          {isCheckingBackend ? 'Verifying...' : 'Verify Backend'}
        </button>
        <span className="text-border">|</span>
        <button
          type="button"
          onClick={verifyDatabase}
          disabled={isCheckingDb}
          className="hover:text-foreground transition-colors disabled:opacity-60"
        >
          {isCheckingDb ? 'Verifying...' : 'Verify Database'}
        </button>
        {(backendStatus || dbStatus) && (
          <>
            <span className="text-border">|</span>
            <span>{backendStatus && `Backend: ${backendStatus}`}{backendStatus && dbStatus && ' · '}{dbStatus && `DB: ${dbStatus}`}</span>
          </>
        )}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────
   COVID Impact Chart — SVG bar chart (fixed axis labels)
   ────────────────────────────────────────────────────────── */
function CovidImpactChart() {
  const data = [
    { year: '2018', cases: 18, label: '~18K' },
    { year: '2019', cases: 22, label: '~22K' },
    { year: '2020', cases: 52, label: '~52K' },
    { year: '2021', cases: 83, label: '~83K' },
    { year: '2022', cases: 68, label: '~68K' },
    { year: '2023', cases: 60, label: '~60K' },
  ]
  const maxVal = 90
  const barWidth = 48
  const chartHeight = 260
  const gap = 16
  const leftPad = 50
  const totalWidth = data.length * (barWidth + gap) - gap
  const svgWidth = totalWidth + leftPad + 20
  const svgHeight = chartHeight + 60

  return (
    <div>
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-lg mx-auto"
          role="img"
          aria-label="Bar chart showing online sexual abuse cases in the Philippines from 2018 to 2023"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75].map((val) => {
            const y = chartHeight - (val / maxVal) * chartHeight + 10
            return (
              <g key={val}>
                <line
                  x1={leftPad} y1={y} x2={svgWidth - 10} y2={y}
                  stroke="currentColor" strokeOpacity={0.08} strokeDasharray="4 4"
                />
                <text x={leftPad - 8} y={y + 4} textAnchor="end" className="fill-muted-foreground" fontSize={10}>
                  {val}K
                </text>
              </g>
            )
          })}

          {data.map((d, i) => {
            const barH = (d.cases / maxVal) * chartHeight
            const x = leftPad + 4 + i * (barWidth + gap)
            const y = chartHeight - barH + 10
            const isSurge = d.year === '2020' || d.year === '2021'

            return (
              <g key={d.year}>
                <rect
                  x={x} y={y}
                  width={barWidth} height={barH}
                  rx={6}
                  className={isSurge ? 'fill-primary' : 'fill-primary/20'}
                />
                {/* Value label */}
                <text
                  x={x + barWidth / 2} y={y - 6}
                  textAnchor="middle"
                  className={isSurge ? 'fill-primary font-semibold' : 'fill-muted-foreground'}
                  fontSize={10}
                >
                  {d.label}
                </text>
                {/* Year label */}
                <text
                  x={x + barWidth / 2} y={chartHeight + 28}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  fontSize={11}
                >
                  {d.year}
                </text>
                {/* COVID marker */}
                {d.year === '2020' && (
                  <text
                    x={x + barWidth + gap / 2} y={chartHeight + 48}
                    textAnchor="middle"
                    className="fill-primary font-medium"
                    fontSize={9}
                  >
                    {'COVID-19 \u2192'}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────
   Philippines Map SVG with all 9 safehouse markers
   ────────────────────────────────────────────────────────── */
const safehouses = [
  // Luzon (2)
  { name: 'Quezon City', x: 218, y: 198, region: 'Luzon' },
  { name: 'Baguio', x: 192, y: 112, region: 'Luzon' },
  // Visayas (4)
  { name: 'Cebu City', x: 232, y: 290, region: 'Visayas' },
  { name: 'Iloilo City', x: 185, y: 288, region: 'Visayas' },
  { name: 'Bacolod', x: 195, y: 305, region: 'Visayas' },
  { name: 'Tacloban', x: 268, y: 282, region: 'Visayas' },
  // Mindanao (3)
  { name: 'Davao City', x: 255, y: 400, region: 'Mindanao' },
  { name: 'Cagayan de Oro', x: 218, y: 370, region: 'Mindanao' },
  { name: 'General Santos', x: 225, y: 445, region: 'Mindanao' },
]

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PhilippinesMap() {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div className="relative w-full max-w-md mx-auto">
      <svg
        viewBox="0 0 400 520"
        className="w-full h-auto"
        role="img"
        aria-label="Map of the Philippines showing 9 Lunas safehouse locations"
      >
        <defs>
          <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.40 0.18 280)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="oklch(0.40 0.18 280)" stopOpacity="0.06" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Luzon */}
        <path
          d="M180 40 L210 35 L240 50 L260 80 L270 120 L265 160 L250 190 L240 210 L225 220 L210 215 L195 230 L180 240 L160 235 L145 215 L135 190 L130 160 L140 120 L155 80 L170 55 Z"
          fill="url(#landGrad)" stroke="oklch(0.40 0.18 280)" strokeWidth="1.5" strokeOpacity="0.3"
        />

        {/* Visayas — Panay / Negros */}
        <path
          d="M155 270 L180 258 L200 260 L210 270 L205 290 L195 310 L175 315 L158 305 L148 288 Z"
          fill="url(#landGrad)" stroke="oklch(0.40 0.18 280)" strokeWidth="1.5" strokeOpacity="0.3"
        />
        {/* Cebu */}
        <path
          d="M220 262 L235 258 L242 270 L240 298 L232 310 L222 308 L218 290 L216 272 Z"
          fill="url(#landGrad)" stroke="oklch(0.40 0.18 280)" strokeWidth="1.5" strokeOpacity="0.3"
        />
        {/* Leyte / Samar */}
        <path
          d="M252 260 L275 255 L288 268 L285 295 L272 305 L255 300 L248 280 Z"
          fill="url(#landGrad)" stroke="oklch(0.40 0.18 280)" strokeWidth="1.5" strokeOpacity="0.3"
        />
        {/* Bohol */}
        <ellipse cx="242" cy="318" rx="14" ry="8" fill="url(#landGrad)" stroke="oklch(0.40 0.18 280)" strokeWidth="1.5" strokeOpacity="0.3" />

        {/* Mindanao */}
        <path
          d="M155 350 L185 340 L220 342 L255 350 L275 370 L280 400 L270 430 L250 455 L225 465 L195 460 L165 450 L145 430 L135 405 L140 375 Z"
          fill="url(#landGrad)" stroke="oklch(0.40 0.18 280)" strokeWidth="1.5" strokeOpacity="0.3"
        />

        {/* Palawan */}
        <path
          d="M80 180 L90 200 L95 240 L90 280 L85 320 L75 350 L65 360 L55 350 L60 310 L65 270 L70 230 L75 200 Z"
          fill="url(#landGrad)" stroke="oklch(0.40 0.18 280)" strokeWidth="1.5" strokeOpacity="0.3"
        />

        {/* Region labels */}
        <text x="200" y="130" textAnchor="middle" className="fill-muted-foreground/30" fontSize="12" fontWeight="300" letterSpacing="0.15em">LUZON</text>
        <text x="220" y="250" textAnchor="middle" className="fill-muted-foreground/30" fontSize="10" fontWeight="300" letterSpacing="0.15em">VISAYAS</text>
        <text x="210" y="395" textAnchor="middle" className="fill-muted-foreground/30" fontSize="12" fontWeight="300" letterSpacing="0.15em">MINDANAO</text>

        {/* Safehouse markers */}
        {safehouses.map((sh, i) => (
          <g
            key={sh.name}
            filter="url(#glow)"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className="cursor-pointer"
          >
            <circle cx={sh.x} cy={sh.y} r={hovered === i ? 10 : 6} fill="oklch(0.40 0.18 280)" className="transition-all duration-200" />
            <circle cx={sh.x} cy={sh.y} r={hovered === i ? 18 : 12} fill="oklch(0.40 0.18 280)" fillOpacity="0.15" className="transition-all duration-200" />
            {/* Tooltip on hover */}
            {hovered === i && (
              <g>
                <rect
                  x={sh.x + 14} y={sh.y - 14}
                  width={sh.name.length * 7 + 16} height={24}
                  rx={6}
                  fill="oklch(0.20 0.05 280)" fillOpacity="0.95"
                />
                <text x={sh.x + 22} y={sh.y + 1} className="fill-white" fontSize={10} fontWeight="500">
                  {sh.name}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>

      {/* Legend below map */}
      <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-foreground">Luzon</span> — 2 shelters
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-foreground">Visayas</span> — 4 shelters
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-foreground">Mindanao</span> — 3 shelters
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────
   Donation Icon Card — animated icon per tier
   ────────────────────────────────────────────────────────── */
function DonationIconCard({ tier }: { tier: number }) {
  const [displayTier, setDisplayTier] = useState(tier)
  const [animating, setAnimating] = useState(false)
  const prevTier = useRef(tier)

  useEffect(() => {
    if (tier !== prevTier.current) {
      setAnimating(true)
      const timeout = setTimeout(() => {
        setDisplayTier(tier)
        setAnimating(false)
      }, 200)
      prevTier.current = tier
      return () => clearTimeout(timeout)
    }
  }, [tier])

  const DisplayIcon = donationTiers[displayTier].icon
  const displayLabel = donationTiers[displayTier].iconLabel

  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div
          className={`transition-all duration-200 ${
            animating
              ? 'opacity-0 translate-y-4 scale-90'
              : 'opacity-100 translate-y-0 scale-100'
          }`}
        >
          <DisplayIcon className="h-28 w-28 sm:h-36 sm:w-36 text-primary" strokeWidth={1.2} />
        </div>
        <div
          className={`text-center transition-all duration-200 ${
            animating ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="text-2xl font-serif font-semibold text-foreground">{displayLabel}</div>
          <div className="text-base text-muted-foreground mt-1">{donationTiers[displayTier].label}/mo</div>
        </div>

        {/* Dots */}
        <div className="flex gap-1.5">
          {donationTiers.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === displayTier ? 'w-4 bg-primary' : 'w-1.5 bg-primary/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function TrustItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs uppercase tracking-widest">
      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
      <span>{text}</span>
    </div>
  )
}
