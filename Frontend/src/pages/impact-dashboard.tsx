import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { HeroStatsBar } from '@/components/impact/HeroStatsBar'
import { InteractiveMap } from '@/components/impact/InteractiveMap'
import { StoriesOfTransformationSection } from '@/components/impact/StoriesOfTransformationSection'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { listPublicImpactJourneyStories } from '@/lib/publicResidentStories'
import { usePageTitle } from '@/hooks/usePageTitle'

const CHART_COLORS = [
  'oklch(0.45 0.18 280)',
  'oklch(0.55 0.15 280)',
  'oklch(0.65 0.12 280)',
  'oklch(0.75 0.08 280)',
  'oklch(0.35 0.12 280)',
]

// API response types
interface ImpactSnapshot {
  snapshotId: number
  snapshotDate: string
  headline: string
  summaryText: string
  metricPayloadJson: string
  isPublished: boolean
  publishedAt: string | null
}

interface AllocationBreakdown {
  Education?: number
  Operations?: number
  Wellbeing?: number
  Maintenance?: number
  Transport?: number
  Outreach?: number
}

interface MetricPayload {
  // snapshot type discriminator
  type?: 'monthly' | 'annual_summary'
  // monthly fields
  month?: string
  total_residents?: number
  totalResidentsServed?: number
  activeResidents?: number
  counselingSessions?: number
  avgHealthScore?: number
  avg_health_score?: number
  homeVisitations?: number
  educationCompletions?: number
  residentsReintegrated?: number
  // funding fields (enriched)
  donations_total_php?: number
  monthly_operating_cost_php?: number
  funding_coverage_pct?: number
  funding_gap_php?: number
  allocation_breakdown?: AllocationBreakdown
  capacity_total?: number
  capacity_utilization_pct?: number
  new_admissions?: number
  incidents_total?: number
  challenge?: string
  // annual summary fields
  year?: number
  annual_operating_budget_php?: number
  months_below_50pct_funding?: number
  best_funding_month?: string
  worst_funding_month?: string
  peak_residents?: number
  // Education program data that may be embedded
  educationPrograms?: { name: string; enrolled: number; completed: number }[]
  // Health metrics that may be embedded
  healthMetrics?: { name: string; value: number; description: string }[]
  // Reintegration outcomes
  reintegrationOutcomes?: { type: string; count: number; percentage: number }[]
}

interface ImpactStats {
  girlsServed: number
  activeResidents: number
  safehousesOperating: number
  regionsServed: number
  totalCounselingSessions: number
  totalHomeVisitations: number
  reintegrationRate: number
  totalDonationAmount: number
  totalDonors: number
}

export function ImpactDashboard() {
  usePageTitle('Our Impact')
  const location = useLocation()

  const [snapshots, setSnapshots] = useState<ImpactSnapshot[]>([])
  const [stats, setStats] = useState<ImpactStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [snapshotsRes, statsRes] = await Promise.all([
          api.get<ImpactSnapshot[]>('/api/public/impact-snapshots'),
          api.get<ImpactStats>('/api/public/impact-stats'),
        ])
        setSnapshots(snapshotsRes)
        setStats(statsRes)
      } catch (err) {
        console.error('Failed to fetch impact data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Ensure deep links like /impact#top reliably land at the top even with lazy loading.
  useEffect(() => {
    if (location.hash !== '#top') return
    const t = window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }, 0)
    return () => window.clearTimeout(t)
  }, [location.hash])

  // Scroll to map after content loads (element missing while initial fetch spinner shows).
  useEffect(() => {
    if (loading || location.hash !== '#impact-map') return
    const t = window.setTimeout(() => {
      document.getElementById('impact-map')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
    return () => window.clearTimeout(t)
  }, [loading, location.hash])

  // Parse metric payloads from snapshots
  const parsedSnapshots = snapshots
    .filter(s => s.isPublished)
    .map(s => {
      let metrics: MetricPayload = {}
      try {
        metrics = JSON.parse(s.metricPayloadJson) as MetricPayload
      } catch {
        // malformed JSON -- use empty metrics
      }
      return { ...s, metrics }
    })
    .sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime())

  // Separate monthly vs annual summary snapshots
  const monthlySnapshots = parsedSnapshots.filter(s => s.metrics.type !== 'annual_summary')

  const now = new Date()
  const fundingOverTime = monthlySnapshots
    .filter(s => s.metrics.donations_total_php != null && new Date(s.snapshotDate) <= now)
    .map(s => ({
      month: new Date(s.snapshotDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      amount: Math.round((s.metrics.donations_total_php ?? 0) / 1000),
    }))

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const impactStories = listPublicImpactJourneyStories()

  return (
    <div className="min-h-screen bg-background" id="top">
      {/* Stats Bar */}
      <HeroStatsBar stats={stats} />

      {/* Interactive Map */}
      <InteractiveMap />

      {/* Stories of Transformation */}
      <StoriesOfTransformationSection stories={impactStories} />

      {/* CTA */}
      <section className="w-full border-y border-border bg-[#e8e2f4] dark:bg-[#2a1f3d]">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="flex flex-col items-stretch gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
            <div className="max-w-2xl text-left">
              <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Ready to change a life?
              </h2>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Your gift gives a girl a safe home and a future.
              </p>
            </div>
            <div className="flex shrink-0 lg:justify-end">
              <Button asChild className="h-12 w-full rounded-full px-7 text-base sm:w-auto">
                <Link to="/donate">Get involved</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Narrative: Restoring Futures ── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
                Outcomes
              </p>
              <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl" style={{ lineHeight: 1.08 }}>
                {stats ? `${stats.reintegrationRate}%` : '—'} Reintegration Rate
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Our goal isn&apos;t just rescue — it&apos;s restoration. Through counseling, education, and family support,{' '}
                <span className="font-medium text-foreground">
                  {stats ? `${stats.reintegrationRate}%` : '—'}
                </span>{' '}
                of girls who complete our program are successfully reintegrated with their families or placed in safe, permanent homes.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                With{' '}
                <span className="font-medium text-foreground">
                  {stats?.totalHomeVisitations?.toLocaleString() ?? '—'}
                </span>{' '}
                follow-up home visitations, we stay involved long after a girl leaves our care — because lasting change takes lasting commitment.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-8 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
                Care Delivered
              </p>
              <div className="mt-8 space-y-8">
                <div>
                  <div className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                    {stats?.totalCounselingSessions?.toLocaleString() ?? '—'}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Trauma-informed counseling sessions
                  </p>
                </div>
                <div className="border-t border-border pt-8">
                  <div className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                    {stats?.totalHomeVisitations?.toLocaleString() ?? '—'}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Follow-up home visitations
                  </p>
                </div>
                <div className="border-t border-border pt-8">
                  <div className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                    {stats?.activeResidents ?? '—'}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Girls currently in our care
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Narrative: Funded by Generosity ── */}
      <section className="border-y border-border bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="order-2 lg:order-1 rounded-2xl border border-border bg-background p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground">Monthly Donations</h3>
              <p className="mt-1 text-xs text-muted-foreground">Donor contributions over time (₱ thousands)</p>
              <div className="mt-4 h-[280px]">
                {fundingOverTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={fundingOverTime}>
                      <defs>
                        <linearGradient id="fundingGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                      <XAxis dataKey="month" className="text-xs fill-muted-foreground" tickLine={false} axisLine={false} />
                      <YAxis className="text-xs fill-muted-foreground" tickLine={false} axisLine={false} tickFormatter={(v) => `₱${v}K`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', color: '#111827', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [`₱${value}K`, 'Donations']}
                      />
                      <Area type="monotone" dataKey="amount" name="Donations" stroke={CHART_COLORS[0]} strokeWidth={2} fill="url(#fundingGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    No donation data available
                  </div>
                )}
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
                Community
              </p>
              <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl" style={{ lineHeight: 1.08 }}>
                {stats?.totalDonors?.toLocaleString() ?? '—'} Supporters Strong
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Every safehouse, every counseling session, every school uniform starts with a donation. A growing community of{' '}
                <span className="font-medium text-foreground">
                  {stats?.totalDonors?.toLocaleString() ?? '—'} donors
                </span>{' '}
                has contributed{' '}
                <span className="font-medium text-foreground">
                  {stats ? formatPHP(stats.totalDonationAmount) : '—'}
                </span>{' '}
                to fund our mission.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Your generosity doesn&apos;t just fund programs — it tells every girl in our care that someone out there believes she deserves a future.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}


function formatPHP(value: number): string {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `₱${(value / 1_000).toFixed(0)}K`
  return `₱${value.toLocaleString()}`
}
