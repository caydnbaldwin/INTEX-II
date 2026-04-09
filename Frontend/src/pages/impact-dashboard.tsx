import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Heart,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { HeroStatsBar } from '@/components/impact/HeroStatsBar'
import { InteractiveMap } from '@/components/impact/InteractiveMap'
import { ImpactTimeline } from '@/components/impact/ImpactTimeline'
import { ResidentStoryCard } from '@/components/impact/ResidentStoryCard'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
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

interface SafehouseOccupancy {
  safehouseId: number
  name: string
  region: string
  capacityGirls: number
  currentOccupancy: number
}

// Fallback data for sections that may not have API equivalents
const fallbackEducationPrograms = [
  { name: 'Secondary Education', enrolled: 24, completed: 15 },
  { name: 'Bridge Program', enrolled: 18, completed: 12 },
  { name: 'Vocational Training', enrolled: 12, completed: 8 },
  { name: 'Literacy Program', enrolled: 6, completed: 4 },
]

const fallbackReintegrationOutcomes = [
  { type: 'Family Reunification', count: 12, percentage: 63 },
  { type: 'Foster Care', count: 4, percentage: 21 },
  { type: 'Independent Living', count: 2, percentage: 11 },
  { type: 'Adoption', count: 1, percentage: 5 },
]

const fallbackHealthMetrics = [
  { name: 'Nutrition Score', value: 82, description: 'Based on BMI and diet tracking' },
  { name: 'Sleep Quality', value: 78, description: 'Average hours and quality rating' },
  { name: 'Energy Level', value: 85, description: 'Self-reported daily energy' },
  { name: 'Emotional Wellbeing', value: 76, description: 'Tracked through counseling' },
]

const VALID_TABS = ['overview', 'education', 'health', 'safehouses'] as const
type TabValue = typeof VALID_TABS[number]

export function ImpactDashboard() {
  usePageTitle('Our Impact')
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab: TabValue = (VALID_TABS as readonly string[]).includes(tabParam ?? '') ? tabParam as TabValue : 'overview'

  const [snapshots, setSnapshots] = useState<ImpactSnapshot[]>([])
  const [stats, setStats] = useState<ImpactStats | null>(null)
  const [safehouses, setSafehouses] = useState<SafehouseOccupancy[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [snapshotsRes, statsRes] = await Promise.all([
          api.get<ImpactSnapshot[]>('/api/public/impact-snapshots'),
          api.get<ImpactStats>('/api/public/impact-stats'),
        ])
        setSnapshots(snapshotsRes)
        setStats(statsRes)

        // Try to fetch safehouse occupancy; it may require auth
        try {
          const safehouseRes = await api.get<SafehouseOccupancy[]>('/api/safehouses/occupancy')
          setSafehouses(safehouseRes)
        } catch {
          // Auth required or endpoint unavailable -- leave empty, will use stats fallback
        }
      } catch (err) {
        console.error('Failed to fetch impact data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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

  // Build chart data from monthly snapshots only
  const residentsOverTime = monthlySnapshots.map(s => ({
    month: new Date(s.snapshotDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    active: s.metrics.activeResidents ?? s.metrics.total_residents ?? 0,
    total: s.metrics.totalResidentsServed ?? s.metrics.total_residents ?? 0,
  }))

  const healthOverTime = monthlySnapshots.map(s => ({
    month: new Date(s.snapshotDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    healthScore: s.metrics.avgHealthScore ?? s.metrics.avg_health_score ?? 0,
    sessions: Math.round((s.metrics.counselingSessions ?? 0) / 10),
  }))

  // Get education programs from latest snapshot payload or fallback
  const latestParsed = monthlySnapshots[monthlySnapshots.length - 1]
  const educationPrograms = latestParsed?.metrics.educationPrograms ?? fallbackEducationPrograms
  const reintegrationOutcomes = latestParsed?.metrics.reintegrationOutcomes ?? fallbackReintegrationOutcomes
  const healthMetrics = latestParsed?.metrics.healthMetrics ?? fallbackHealthMetrics

  // Safehouse data for charts
  const safehouseData = safehouses.map(sh => ({
    name: sh.name.split(' ')[0],
    capacity: sh.capacityGirls,
    occupancy: sh.currentOccupancy,
  }))

  // Region distribution from safehouse data or stats
  const regionCounts: Record<string, number> = {}
  safehouses.forEach(s => {
    regionCounts[s.region] = (regionCounts[s.region] ?? 0) + 1
  })
  const regionData = Object.entries(regionCounts).map(([name, value]) => ({ name, value }))
  // If no safehouse data, use stats to show aggregate
  if (regionData.length === 0 && stats) {
    regionData.push({ name: 'All Regions', value: stats.safehousesOperating })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const impactStories = listPublicImpactJourneyStories()

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Stats Bar */}
      <HeroStatsBar stats={stats} />

      {/* Interactive Map Section */}
      <InteractiveMap />

      {/* Resident Stories Carousel */}
      <StoriesCarousel stories={impactStories} />

      {/* Impact Timeline */}
      <ImpactTimeline />

      {/* Detailed Dashboard */}
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-3">
            Deep Dive
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
            Detailed Metrics
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Explore our education, health, and safehouse data in detail.
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setSearchParams({ tab: v }, { replace: true })}
          className="mt-8"
        >
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
            <TabsTrigger value="safehouses">Safehouses</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-8 space-y-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Residents Over Time</CardTitle>
                  <CardDescription>Monthly snapshot of active and total residents served</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={residentsOverTime}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                        <YAxis className="text-xs fill-muted-foreground" />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                        <Legend />
                        <Line type="monotone" dataKey="total" name="Total Served" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ fill: CHART_COLORS[0] }} />
                        <Line type="monotone" dataKey="active" name="Active" stroke={CHART_COLORS[1]} strokeWidth={2} dot={{ fill: CHART_COLORS[1] }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Reintegration Outcomes</CardTitle>
                  <CardDescription>Distribution of successful reintegration pathways</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={reintegrationOutcomes} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                          {reintegrationOutcomes.map((_: unknown, index: number) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Regional Distribution</CardTitle>
                <CardDescription>Safehouse locations across the Philippines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-3">
                  {regionData.map((region, index) => (
                    <div key={region.name} className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-xl flex items-center justify-center text-2xl font-bold text-primary-foreground" style={{ backgroundColor: CHART_COLORS[index] }}>
                        {region.value}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{region.name}</div>
                        <div className="text-sm text-muted-foreground">{region.value} safehouses</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Representative journeys</CardTitle>
                <CardDescription>
                  Progress snapshots identified by privacy-safe labels only. Labels are pseudonyms, not real
                  names.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {listPublicImpactJourneyStories().map((story) => (
                  <div
                    key={story.residentId}
                    className="rounded-lg border border-border bg-card/50 p-4"
                  >
                    <div className="font-mono text-sm font-semibold text-primary">{story.pseudonym}</div>
                    <div className="mt-2 text-sm font-medium text-foreground">{story.headline}</div>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{story.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="education" className="mt-8 space-y-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Education Programs</CardTitle>
                  <CardDescription>Enrollment and completion rates by program type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={educationPrograms} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" className="text-xs fill-muted-foreground" />
                        <YAxis dataKey="name" type="category" width={120} className="text-xs fill-muted-foreground" />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                        <Legend />
                        <Bar dataKey="enrolled" name="Enrolled" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
                        <Bar dataKey="completed" name="Completed" fill={CHART_COLORS[2]} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Program Details</CardTitle>
                  <CardDescription>Completion rates for each education track</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {educationPrograms.map((program) => {
                    const completionRate = Math.round((program.completed / program.enrolled) * 100)
                    return (
                      <div key={program.name} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-foreground">{program.name}</span>
                          <span className="text-muted-foreground">{completionRate}% completion</span>
                        </div>
                        <Progress value={completionRate} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{program.enrolled} enrolled</span>
                          <span>{program.completed} completed</span>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Enrolled</CardDescription>
                  <CardTitle className="text-3xl">{educationPrograms.reduce((acc, p) => acc + p.enrolled, 0)}</CardTitle>
                </CardHeader>
                <CardContent><p className="text-xs text-muted-foreground">Across all programs</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Completed</CardDescription>
                  <CardTitle className="text-3xl">{educationPrograms.reduce((acc, p) => acc + p.completed, 0)}</CardTitle>
                </CardHeader>
                <CardContent><p className="text-xs text-muted-foreground">Successful completions</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Average Completion Rate</CardDescription>
                  <CardTitle className="text-3xl">{Math.round(educationPrograms.reduce((acc, p) => acc + (p.completed / p.enrolled) * 100, 0) / educationPrograms.length)}%</CardTitle>
                </CardHeader>
                <CardContent><p className="text-xs text-muted-foreground">Across all programs</p></CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="health" className="mt-8 space-y-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Health Score Trend</CardTitle>
                  <CardDescription>Average health scores and counseling activity over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={healthOverTime}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                        <YAxis className="text-xs fill-muted-foreground" />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                        <Legend />
                        <Line type="monotone" dataKey="healthScore" name="Health Score" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ fill: CHART_COLORS[0] }} />
                        <Line type="monotone" dataKey="sessions" name="Sessions (x10)" stroke={CHART_COLORS[2]} strokeWidth={2} strokeDasharray="5 5" dot={{ fill: CHART_COLORS[2] }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Health Metrics Tracked</CardTitle>
                  <CardDescription>Comprehensive wellbeing monitoring for all residents</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {healthMetrics.map((metric) => (
                    <div key={metric.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-foreground">{metric.name}</span>
                        <span className="text-muted-foreground">{metric.value}/100</span>
                      </div>
                      <Progress value={metric.value} className="h-2" />
                      <p className="text-xs text-muted-foreground">{metric.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="safehouses" className="mt-8 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Safehouse Capacity & Occupancy</CardTitle>
                <CardDescription>Current occupancy vs. capacity across all safehouses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={safehouseData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                      <YAxis className="text-xs fill-muted-foreground" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Legend />
                      <Bar dataKey="capacity" name="Capacity" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="occupancy" name="Occupancy" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {safehouses.map((safehouse) => (
                <Card key={safehouse.safehouseId}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{safehouse.name}</CardTitle>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{safehouse.region}</span>
                    </div>
                    <CardDescription>{safehouse.currentOccupancy} of {safehouse.capacityGirls} capacity</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress value={(safehouse.currentOccupancy / safehouse.capacityGirls) * 100} className="h-2" />
                  </CardContent>
                </Card>
              ))}
              {safehouses.length === 0 && (
                <Card className="sm:col-span-2 lg:col-span-3">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <p>Safehouse details are available to authenticated administrators.</p>
                    <p className="mt-1 text-sm">Overall: {stats?.safehousesOperating ?? '—'} safehouses operating across {stats?.regionsServed ?? '—'} regions.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Card className="mt-12 bg-primary/5 border-primary/20">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mt-6 text-2xl font-bold text-foreground">Support Our Mission</h3>
            <p className="mt-2 max-w-md text-muted-foreground">
              Your donations directly fund shelter, education, healthcare, and counseling
              for survivors. {stats?.totalDonors ?? '—'} recurring donors have already
              contributed over PHP {stats ? (stats.totalDonationAmount / 1000000).toFixed(1) : '—'}M.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StoriesCarousel({ stories }: { stories: ReturnType<typeof listPublicImpactJourneyStories> }) {
  const perPage = 3
  const totalPages = Math.ceil(stories.length / perPage)
  const [page, setPage] = useState(0)

  const goTo = useCallback((p: number) => {
    setPage(Math.max(0, Math.min(p, totalPages - 1)))
  }, [totalPages])

  const visible = stories.slice(page * perPage, page * perPage + perPage)

  return (
    <section className="pt-16 pb-10 sm:pt-20 sm:pb-12 bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-3">
              Real Progress
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
              Stories of Transformation
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl">
              Each name is a privacy-safe pseudonym. Each milestone is real.
            </p>
          </div>

          {/* Arrow buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => goTo(page - 1)}
              disabled={page === 0}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous stories"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => goTo(page + 1)}
              disabled={page >= totalPages - 1}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next stories"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 3-card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((story) => (
            <ResidentStoryCard key={story.residentId} story={story} />
          ))}
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-200 ${
                i === page ? 'w-6 bg-primary' : 'w-2 bg-border hover:bg-muted-foreground/40'
              }`}
              aria-label={`Page ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

