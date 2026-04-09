import { useEffect, useState } from 'react'
import {
  Users,
  Home,
  AlertTriangle,
  Heart,
  TrendingUp,
  Calendar,
  FileText,
  Activity,
  Brain,
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
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { api } from '@/lib/api'
import { usePageTitle } from '@/hooks/usePageTitle'

const CHART_COLORS = [
  'oklch(0.45 0.18 280)',
  'oklch(0.55 0.15 280)',
  'oklch(0.65 0.12 280)',
  'oklch(0.75 0.08 280)',
  'oklch(0.35 0.12 280)',
]

// API response types
interface SafehouseOccupancyResponse {
  safehouseId: number
  name: string
  region: string
  capacityGirls: number
  currentOccupancy: number
}

interface RiskDistributionResponse {
  currentRiskLevel: string
  count: number
}

interface IncidentSummaryResponse {
  unresolvedCount: number
  recentIncidents: {
    incidentId: number
    residentId: number
    safehouseId: number
    incidentDate: string
    incidentType: string
    severity: string
    resolved: boolean
  }[]
}

interface Resident {
  residentId: number
  [key: string]: unknown
}

interface Safehouse {
  safehouseId: number
  status: string
  [key: string]: unknown
}

interface DonationSummaryResponse {
  totalCount: number
  totalAmount: number
  recurringCount: number
  campaigns: { campaignName: string; count: number; totalAmount: number }[]
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

interface SafehousePerformanceResult {
  pipelineResultId: number
  entityId: number
  score: number
  label: string
  detailsJson: string
  safehouse: {
    name: string
    region: string
    capacityGirls: number
    currentOccupancy: number
  }
}

interface CaseConference {
  planId: number
  residentId: number
  planCategory: string
  caseConferenceDate: string
}

export function AdminDashboard() {
  usePageTitle('Dashboard')
  const [loading, setLoading] = useState(true)
  const [safehouseOccupancy, setSafehouseOccupancy] = useState<{ name: string; capacity: number; occupancy: number }[]>([])
  const [riskDistribution, setRiskDistribution] = useState<{ name: string; value: number }[]>([])
  const [recentIncidents, setRecentIncidents] = useState<{ id: number; type: string; resident: string; date: string; status: string }[]>([])
  const [unresolvedCount, setUnresolvedCount] = useState(0)
  const [totalResidents, setTotalResidents] = useState(0)
  const [activeSafehouses, setActiveSafehouses] = useState(0)
  const [totalCapacity, setTotalCapacity] = useState(0)
  const [totalOccupied, setTotalOccupied] = useState(0)
  const [riskAlerts, setRiskAlerts] = useState(0)
  const [riskAlertDesc, setRiskAlertDesc] = useState('')
  const [donationCount, setDonationCount] = useState(0)
  const [donationAmount, setDonationAmount] = useState(0)
  const [mlRiskAlerts, setMlRiskAlerts] = useState<ResidentRiskResult[]>([])
  const [mlSafehousePerf, setMlSafehousePerf] = useState<SafehousePerformanceResult[]>([])
  const [upcomingConferences, setUpcomingConferences] = useState<CaseConference[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const [occupancyData, riskData, incidentData, residents, safehouses, donationSummary] = await Promise.all([
          api.get<SafehouseOccupancyResponse[]>('/api/safehouses/occupancy'),
          api.get<RiskDistributionResponse[]>('/api/reports/risk-distribution'),
          api.get<IncidentSummaryResponse>('/api/reports/incident-summary'),
          api.get<Resident[]>('/api/residents'),
          api.get<Safehouse[]>('/api/safehouses'),
          api.get<DonationSummaryResponse>('/api/donations/summary'),
        ])

        // Safehouse occupancy chart
        setSafehouseOccupancy(
          occupancyData.map((s) => ({
            name: s.name,
            capacity: s.capacityGirls,
            occupancy: s.currentOccupancy,
          }))
        )

        // Capacity metrics from occupancy data
        const cap = occupancyData.reduce((sum, s) => sum + s.capacityGirls, 0)
        const occ = occupancyData.reduce((sum, s) => sum + s.currentOccupancy, 0)
        setTotalCapacity(cap)
        setTotalOccupied(occ)

        // Risk distribution chart
        setRiskDistribution(
          riskData.map((r) => ({
            name: r.currentRiskLevel,
            value: r.count,
          }))
        )

        // Risk alerts: sum of High + Critical
        const highCount = riskData.find((r) => r.currentRiskLevel === 'High')?.count ?? 0
        const criticalCount = riskData.find((r) => r.currentRiskLevel === 'Critical')?.count ?? 0
        setRiskAlerts(highCount + criticalCount)
        setRiskAlertDesc(`${highCount} high + ${criticalCount} critical`)

        // Recent incidents
        setUnresolvedCount(incidentData.unresolvedCount)
        setRecentIncidents(
          incidentData.recentIncidents.map((i) => ({
            id: i.incidentId,
            type: i.incidentType,
            resident: `R-${String(i.residentId).padStart(3, '0')}`,
            date: i.incidentDate.split('T')[0],
            status: i.resolved ? 'Resolved' : 'Unresolved',
          }))
        )

        // Total residents
        setTotalResidents(residents.length)

        // Active safehouses
        const active = safehouses.filter((s) => s.status === 'Active')
        setActiveSafehouses(active.length)

        // Donations
        setDonationCount(donationSummary.totalCount)
        setDonationAmount(donationSummary.totalAmount)

        // ML Pipeline data (fetched separately so failures don't break dashboard)
        try {
          const [riskResults, perfResults] = await Promise.all([
            api.get<ResidentRiskResult[]>('/api/pipeline-results/resident-risk'),
            api.get<SafehousePerformanceResult[]>('/api/pipeline-results/safehouse-performance'),
          ])
          setMlRiskAlerts(riskResults.slice(0, 5))
          setMlSafehousePerf(perfResults)
        } catch {
          console.warn('ML pipeline data unavailable')
        }

        // Upcoming case conferences from real API data
        try {
          const conferences = await api.get<CaseConference[]>('/api/residents/case-conferences')
          const today = new Date().toISOString().split('T')[0]
          const upcoming = conferences
            .filter((c) => c.caseConferenceDate && c.caseConferenceDate >= today)
            .slice(0, 5)
          setUpcomingConferences(upcoming)
        } catch {
          console.warn('Case conference data unavailable')
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
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of operations across all safehouses.</p>
        </div>
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading dashboard data...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of operations across all safehouses.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Residents" value={String(totalResidents)} description={`${totalOccupied} occupied across safehouses`} icon={Users} />
        <MetricCard title="Active Safehouses" value={String(activeSafehouses)} description={`${totalCapacity} total capacity, ${totalOccupied} occupied`} icon={Home} />
        <MetricCard title="Risk Alerts" value={String(riskAlerts)} description={riskAlertDesc} icon={AlertTriangle} trend="destructive" />
        <MetricCard title="Recent Donations" value={String(donationCount)} description={`This month — PHP ${(donationAmount / 1000).toFixed(0)}K`} icon={Heart} />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Safehouse Occupancy</CardTitle>
            <CardDescription>Current occupancy vs. capacity across all safehouses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={safehouseOccupancy} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs fill-muted-foreground" />
                  <YAxis dataKey="name" type="category" width={110} className="text-xs fill-muted-foreground" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="capacity" name="Capacity" fill={CHART_COLORS[3]} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="occupancy" name="Occupied" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Level Distribution</CardTitle>
            <CardDescription>Current risk levels across all active residents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {riskDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Unresolved Incidents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-destructive" />
                Recent Incidents
              </CardTitle>
              <CardDescription>{unresolvedCount} total unresolved incidents</CardDescription>
            </div>
            <Badge variant="destructive">{unresolvedCount} unresolved</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentIncidents.map((incident) => (
                <div key={incident.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <Badge variant={incident.status === 'Unresolved' ? 'destructive' : 'secondary'} className="text-xs">
                      {incident.type}
                    </Badge>
                    <span className="text-sm font-mono text-muted-foreground">{incident.resident}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{incident.date}</span>
                    <Badge variant={incident.status === 'Unresolved' ? 'outline' : 'secondary'} className="text-xs">
                      {incident.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Conferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Case Conferences
            </CardTitle>
            <CardDescription>Scheduled intervention reviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingConferences.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No upcoming conferences scheduled.</p>
              ) : (
                upcomingConferences.map((conf) => (
                  <div key={conf.planId} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-mono text-muted-foreground">R-{String(conf.residentId).padStart(3, '0')}</span>
                      <Badge variant="outline" className="text-xs">{conf.planCategory}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(conf.caseConferenceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                ))
              )}
            </div>

            <Separator className="my-4" />

            {/* OKR Metric */}
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Key Metric: Reintegration Success Rate</span>
              </div>
              <div className="text-3xl font-bold text-primary font-serif">63.3%</div>
              <p className="text-xs text-muted-foreground mt-1">19 of 30 completed cases successfully reintegrated</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                This is Lunas's primary OKR because it captures the ultimate outcome of every service we provide — shelter, counseling, education, and case management — in a single metric. A higher rate means more girls are leaving our care with the support systems needed to thrive independently.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ML Pipeline Insights */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ML Risk Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              ML Risk Alerts
            </CardTitle>
            <CardDescription>Top predicted high-risk residents from ML pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            {mlRiskAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pipeline data available</p>
            ) : (
              <div className="space-y-3">
                {mlRiskAlerts.map((r) => (
                  <div key={r.pipelineResultId} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-foreground">
                        {r.resident?.internalCode || r.resident?.caseControlNo || `ID-${r.entityId}`}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          r.label === 'Critical'
                            ? 'border-red-300 bg-red-50 text-red-700'
                            : r.label === 'High'
                              ? 'border-orange-300 bg-orange-50 text-orange-700'
                              : r.label === 'Medium'
                                ? 'border-yellow-300 bg-yellow-50 text-yellow-700'
                                : 'border-green-300 bg-green-50 text-green-700'
                        }
                      >
                        {r.label}
                      </Badge>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {(r.score * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Safehouse Performance (ML) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Safehouse Performance (ML)
            </CardTitle>
            <CardDescription>ML-ranked safehouse performance scores</CardDescription>
          </CardHeader>
          <CardContent>
            {mlSafehousePerf.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pipeline data available</p>
            ) : (
              <div className="space-y-3">
                {mlSafehousePerf.map((s) => (
                  <div key={s.pipelineResultId} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-foreground">
                          {s.safehouse?.name || `Safehouse ${s.entityId}`}
                        </span>
                        <span className="text-xs text-muted-foreground">{s.safehouse?.region}</span>
                        <Badge
                          variant="outline"
                          className={
                            s.label === 'HighPerforming'
                              ? 'border-green-300 bg-green-50 text-green-700'
                              : s.label === 'Average'
                                ? 'border-yellow-300 bg-yellow-50 text-yellow-700'
                                : 'border-red-300 bg-red-50 text-red-700'
                          }
                        >
                          {s.label === 'HighPerforming' ? 'High Performing' : s.label === 'NeedsAttention' ? 'Needs Attention' : s.label}
                        </Badge>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {(s.score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className={`h-2 rounded-full ${
                          s.label === 'HighPerforming'
                            ? 'bg-green-500'
                            : s.label === 'Average'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(s.score * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string
  value: string
  description: string
  icon: React.ElementType
  trend?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription className="text-xs uppercase tracking-wider">{title}</CardDescription>
        <Icon className={`h-4 w-4 ${trend === 'destructive' ? 'text-destructive' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}
