import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  Calendar,
  FileText,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { usePageTitle } from '@/hooks/usePageTitle'

/* ── API types ── */

interface DonationSummaryResponse {
  totalCount: number
  totalAmount: number
  recurringCount: number
  campaigns: { campaignName: string; count: number; totalAmount: number }[]
}

interface DonationTrendResponse {
  month: number
  year: number
  totalAmount: number
  count: number
  recurringCount: number
}

interface ResidentRiskResult {
  pipelineResultId: number
  entityId: number
  score: number
  label: string
  detailsJson: string
  resident: {
    caseControlNo: string
    internalCode: string
    safehouseId: number
    caseStatus: string
    currentRiskLevel: string
    initialRiskLevel: string
  }
}

interface DonorChurnResult {
  pipelineResultId: number
  entityId: number
  score: number
  label: string
  supporter: {
    displayName: string
    email: string
    supporterType: string
    status: string
  }
}


interface CaseConference {
  planId: number
  residentId: number
  planCategory: string
  caseConferenceDate: string
}

interface DonationRecord {
  donationId: number
  supporterId: number
  donationDate: string
  donationType: string
  amount: number
  campaignName?: string
}

interface Resident {
  residentId: number
  reintegrationStatus?: string
  safehouseId: number
  caseStatus?: string
  [key: string]: unknown
}

interface Safehouse {
  safehouseId: number
  name: string
  region: string
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function AdminDashboard() {
  usePageTitle('Dashboard')
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  // Stat card data
  const [donationAmount, setDonationAmount] = useState(0)
  const [donationCount, setDonationCount] = useState(0)
  const [recurringCount, setRecurringCount] = useState(0)
  const [atRiskResidents, setAtRiskResidents] = useState(0)
  const [atRiskDesc, setAtRiskDesc] = useState('')
  const [donorsAtRisk, setDonorsAtRisk] = useState(0)
  const [reintegrationRate, setReintegrationRate] = useState(0)
  const [reintegrationDesc, setReintegrationDesc] = useState('')

  // Chart data
  const [donationTrend, setDonationTrend] = useState<{ label: string; amount: number; count: number }[]>([])

  // Secondary sections
  const [safehouseStats, setSafehouseStats] = useState<{ name: string; active: number; total: number }[]>([])
  const [upcomingConferences, setUpcomingConferences] = useState<CaseConference[]>([])
  const [recentDonations, setRecentDonations] = useState<DonationRecord[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        // Core data — all required
        const [donationSummary, residents, safehouses] = await Promise.all([
          api.get<DonationSummaryResponse>('/api/donations/summary'),
          api.get<Resident[]>('/api/residents'),
          api.get<Safehouse[]>('/api/safehouses'),
        ])

        // Donations
        setDonationAmount(donationSummary.totalAmount)
        setDonationCount(donationSummary.totalCount)
        setRecurringCount(donationSummary.recurringCount)

        // Reintegration rate
        const completed = residents.filter((r) => r.reintegrationStatus === 'Completed')
        const inProgress = residents.filter((r) => r.reintegrationStatus && r.reintegrationStatus !== 'Not Started')
        const rate = inProgress.length > 0 ? (completed.length / inProgress.length) * 100 : 0
        setReintegrationRate(Math.round(rate * 10) / 10)
        setReintegrationDesc(`${completed.length} of ${inProgress.length} cases`)

        // Safehouse overview
        const safehouseMap = new Map(safehouses.map((s) => [s.safehouseId, s.name]))
        const statsMap = new Map<string, { active: number; total: number }>()
        for (const s of safehouses) {
          statsMap.set(s.name, { active: 0, total: 0 })
        }
        for (const r of residents) {
          const name = safehouseMap.get(r.safehouseId) ?? `Safehouse ${r.safehouseId}`
          const entry = statsMap.get(name) ?? { active: 0, total: 0 }
          entry.total++
          if (r.caseStatus === 'Active') entry.active++
          statsMap.set(name, entry)
        }
        setSafehouseStats(
          Array.from(statsMap.entries())
            .map(([name, counts]) => ({ name, ...counts }))
            .sort((a, b) => b.total - a.total)
        )

        // Donation trends (real monthly data)
        try {
          const trends = await api.get<DonationTrendResponse[]>('/api/donations/trends')
          setDonationTrend(
            trends.map((t) => ({
              label: `${MONTH_LABELS[t.month - 1]} ${t.year}`,
              amount: Math.round(t.totalAmount / 1000),
              count: t.count,
            }))
          )
        } catch {
          console.warn('Donation trends unavailable')
        }

        // ML: Residents at risk (primary metric — uses ML predictions)
        try {
          const riskResults = await api.get<ResidentRiskResult[]>('/api/pipeline-results/resident-risk')
          const highRisk = riskResults.filter((r) => r.label === 'Critical' || r.label === 'High')
          setAtRiskResidents(highRisk.length)
          const critical = highRisk.filter((r) => r.label === 'Critical').length
          const high = highRisk.filter((r) => r.label === 'High').length
          setAtRiskDesc(`${critical} critical, ${high} high risk`)
        } catch {
          console.warn('ML risk data unavailable')
          setAtRiskDesc('Pipeline unavailable')
        }

        // ML: Donors at risk of churning
        try {
          const churnResults = await api.get<DonorChurnResult[]>('/api/pipeline-results/donor-churn')
          const atRisk = churnResults.filter((r) => r.label === 'AtRisk' || r.label === 'High' || r.score > 0.5)
          setDonorsAtRisk(atRisk.length)
        } catch {
          console.warn('Donor churn data unavailable')
        }

        // Upcoming case conferences
        try {
          const conferences = await api.get<CaseConference[]>('/api/residents/case-conferences')
          const today = new Date().toISOString().split('T')[0]
          setUpcomingConferences(
            conferences
              .filter((c) => c.caseConferenceDate && c.caseConferenceDate >= today)
              .slice(0, 5)
          )
        } catch {
          console.warn('Case conference data unavailable')
        }

        // Recent donations
        try {
          const donations = await api.get<DonationRecord[]>('/api/donations')
          setRecentDonations(
            [...donations]
              .sort((a, b) => b.donationDate.localeCompare(a.donationDate))
              .slice(0, 5)
          )
        } catch {
          console.warn('Recent donations unavailable')
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading dashboard data...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Stat Cards (3 pillars + OKR) ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pillar 1: Donor Funding */}
        <Card
          className="cursor-pointer transition-shadow hover:shadow-md hover:ring-1 hover:ring-primary/20"
          onClick={() => navigate('/admin/donors')}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium">Total Donations</CardDescription>
              <TrendBadge value={recurringCount} label={`${recurringCount} recurring`} positive />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              {formatPHP(donationAmount)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {donationCount} contributions · {donorsAtRisk > 0 ? `${donorsAtRisk} donors at risk` : 'Donor base stable'}
            </p>
          </CardContent>
        </Card>

        {/* Pillar 2: Residents at Risk (ML-driven) */}
        <Card
          className="cursor-pointer transition-shadow hover:shadow-md hover:ring-1 hover:ring-primary/20"
          onClick={() => navigate('/admin/caseload?risk=at-risk')}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium">Residents at Risk</CardDescription>
              <TrendBadge value={atRiskResidents} label={atRiskResidents > 0 ? 'Needs attention' : 'Stable'} positive={atRiskResidents === 0} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{atRiskResidents}</div>
            <p className="mt-1 text-xs text-muted-foreground">{atRiskDesc}</p>
          </CardContent>
        </Card>

        {/* Pillar 3: Donor Retention */}
        <Card
          className="cursor-pointer transition-shadow hover:shadow-md hover:ring-1 hover:ring-primary/20"
          onClick={() => navigate('/admin/donors')}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium">Donors at Risk</CardDescription>
              <TrendBadge value={donorsAtRisk} label={donorsAtRisk > 0 ? 'May churn' : 'Healthy'} positive={donorsAtRisk === 0} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{donorsAtRisk}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Predicted to lapse (ML)
            </p>
          </CardContent>
        </Card>

        {/* OKR: Reintegration */}
        <Card
          className="cursor-pointer transition-shadow hover:shadow-md hover:ring-1 hover:ring-primary/20"
          onClick={() => navigate('/admin/caseload?status=Active')}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium">Reintegration Rate</CardDescription>
              <TrendBadge value={reintegrationRate} label="OKR" positive />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{reintegrationRate}%</div>
            <p className="mt-1 text-xs text-muted-foreground">{reintegrationDesc}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Donation Trend Chart ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Donation Trends</CardTitle>
          <CardDescription>Monthly donations over time (₱ thousands)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {donationTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={donationTrend}>
                  <defs>
                    <linearGradient id="donationGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.45 0.18 280)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.45 0.18 280)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis
                    dataKey="label"
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value, name) => [
                      name === 'amount' ? `₱${value}K` : value,
                      name === 'amount' ? 'Amount' : 'Donations',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="oklch(0.45 0.18 280)"
                    strokeWidth={2}
                    fill="url(#donationGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No trend data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Secondary: ML Alerts, Conferences, Recent Donations ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Safehouse Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" />
              Safehouse Overview
            </CardTitle>
            <CardDescription>Active residents across safehouses</CardDescription>
          </CardHeader>
          <CardContent>
            {safehouseStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">No safehouse data available</p>
            ) : (
              <div className="space-y-2">
                {safehouseStats.map((s) => (
                  <Link
                    key={s.name}
                    to="/admin/caseload"
                    className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-muted/50 rounded px-1 -mx-1 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                        {s.active} active
                      </Badge>
                      <span className="text-xs text-muted-foreground">{s.total} total</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" asChild className="w-full mt-3 text-xs">
              <Link to="/admin/caseload">View all residents →</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Case Conferences */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-primary" />
              Upcoming Conferences
            </CardTitle>
            <CardDescription>Scheduled intervention reviews</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingConferences.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming conferences</p>
            ) : (
              <div className="space-y-2">
                {upcomingConferences.map((conf) => (
                  <Link
                    key={conf.planId}
                    to="/admin/visitation"
                    className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-muted/50 rounded px-1 -mx-1 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-mono">R-{String(conf.residentId).padStart(3, '0')}</span>
                      <Badge variant="outline" className="text-xs">{conf.planCategory}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(conf.caseConferenceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" asChild className="w-full mt-3 text-xs">
              <Link to="/admin/visitation">View all →</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Donations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Recent Donations
            </CardTitle>
            <CardDescription>Latest contributions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentDonations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent donations</p>
            ) : (
              <div className="space-y-2">
                {recentDonations.map((d) => (
                  <Link
                    key={d.donationId}
                    to="/admin/donors"
                    className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-muted/50 rounded px-1 -mx-1 transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{d.donationType}</span>
                      <span className="text-xs text-muted-foreground">
                        {d.campaignName ?? d.donationDate?.split('T')[0] ?? ''}
                      </span>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatPHP(d.amount ?? 0)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" asChild className="w-full mt-3 text-xs">
              <Link to="/admin/donors">View all donors →</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ── Helpers ── */

function formatPHP(value: number): string {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `₱${(value / 1_000).toFixed(0)}K`
  return `₱${value.toLocaleString()}`
}

function TrendBadge({ label, positive }: { value: number; label: string; positive: boolean }) {
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
      {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {label}
    </span>
  )
}
