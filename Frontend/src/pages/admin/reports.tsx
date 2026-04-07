import { useEffect, useState } from 'react'
import {
  TrendingUp,
  DollarSign,
  Users,
  Share2,
  Loader2,
  Building,
  Brain,
} from 'lucide-react'
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
  Legend,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { api } from '@/lib/api'

const CHART_COLORS = [
  'oklch(0.45 0.18 280)',
  'oklch(0.55 0.15 280)',
  'oklch(0.65 0.12 280)',
  'oklch(0.75 0.08 280)',
  'oklch(0.35 0.12 280)',
]

// API response types
interface DonationSummary {
  totalCount: number
  totalAmount: number
  recurringCount: number
  campaigns: { campaignName: string; count: number; totalAmount: number }[]
}

interface DonationTrend {
  month: number
  year: number
  totalAmount: number
  count: number
  recurringCount: number
}

interface DonationChannel {
  channel: string
  count: number
  totalAmount: number
}

interface ReintegrationOutcome {
  reintegrationType: string
  count: number
}

interface SocialMediaPlatform {
  platform: string
  postCount: number
  totalReferrals: number
  totalEstimatedValue: number
  avgEngagementRate: number
}

// ML Pipeline result types
interface PipelineResult {
  pipelineResultId: number
  entityId: number
  score: number
  label: string
  detailsJson: string
}

interface EducationPipelineResult extends PipelineResult {
  resident: { caseControlNo: string; internalCode: string; safehouseId: number }
}

interface SafehousePipelineResult {
  score: number
  label: string
  detailsJson: string
  safehouse: { name: string; region: string; capacityGirls: number; currentOccupancy: number }
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`
  return amount.toLocaleString()
}

export function ReportsAnalytics() {
  const [summary, setSummary] = useState<DonationSummary | null>(null)
  const [trends, setTrends] = useState<DonationTrend[]>([])
  const [channels, setChannels] = useState<DonationChannel[]>([])
  const [reintegration, setReintegration] = useState<ReintegrationOutcome[]>([])
  const [socialMedia, setSocialMedia] = useState<SocialMediaPlatform[]>([])
  const [loading, setLoading] = useState(true)

  // ML pipeline state
  const [campaignRoi, setCampaignRoi] = useState<PipelineResult[]>([])
  const [socialDrivers, setSocialDrivers] = useState<PipelineResult[]>([])
  const [educationRisk, setEducationRisk] = useState<EducationPipelineResult[]>([])
  const [safehousePerf, setSafehousePerf] = useState<SafehousePipelineResult[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryRes, trendsRes, channelsRes, reintegrationRes, socialRes, campaignRoiRes, socialDriversRes, educationRes, safehouseRes] = await Promise.all([
          api.get<DonationSummary>('/api/donations/summary'),
          api.get<DonationTrend[]>('/api/donations/trends'),
          api.get<DonationChannel[]>('/api/donations/channels'),
          api.get<ReintegrationOutcome[]>('/api/reports/outcomes/reintegration'),
          api.get<SocialMediaPlatform[]>('/api/reports/social-media/effectiveness'),
          api.get<PipelineResult[]>('/api/pipeline-results/campaign-roi').catch(() => [] as PipelineResult[]),
          api.get<PipelineResult[]>('/api/pipeline-results/social-media-drivers').catch(() => [] as PipelineResult[]),
          api.get<EducationPipelineResult[]>('/api/pipeline-results/education-progress').catch(() => [] as EducationPipelineResult[]),
          api.get<SafehousePipelineResult[]>('/api/pipeline-results/safehouse-performance').catch(() => [] as SafehousePipelineResult[]),
        ])
        setSummary(summaryRes)
        setTrends(trendsRes)
        setChannels(channelsRes)
        setReintegration(reintegrationRes)
        setSocialMedia(socialRes)
        setCampaignRoi(campaignRoiRes)
        setSocialDrivers(socialDriversRes)
        setEducationRisk(educationRes)
        setSafehousePerf(safehouseRes)
      } catch (err) {
        console.error('Failed to fetch report data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Map API data to chart formats
  const donationTrends = trends.map(t => ({
    month: MONTH_NAMES[t.month - 1] ?? `${t.month}`,
    totalAmount: t.totalAmount,
    count: t.count,
    recurringCount: t.recurringCount,
  }))

  const campaignPerformance = (summary?.campaigns ?? []).map(c => ({
    name: c.campaignName,
    donations: c.count,
    amount: c.totalAmount,
  }))

  const channelSources = channels.map(c => ({
    name: c.channel,
    value: c.count,
  }))

  const reintegrationData = reintegration.map(r => ({
    type: r.reintegrationType,
    count: r.count,
  }))

  const socialMediaEffectiveness = socialMedia.map(s => ({
    platform: s.platform,
    posts: s.postCount,
    referrals: s.totalReferrals,
    estValue: s.totalEstimatedValue,
  }))

  // ML pipeline data transformations
  const campaignRoiData = campaignRoi
    .map((r) => {
      let details: Record<string, unknown> = {}
      try { details = JSON.parse(r.detailsJson || '{}') } catch { /* ignore */ }
      return {
        name: (details.campaignName as string) || `Campaign ${r.entityId}`,
        score: r.score,
        label: r.label,
      }
    })
    .sort((a, b) => b.score - a.score)

  const socialDriversData = socialDrivers
    .map((r) => {
      let details: Record<string, unknown> = {}
      try { details = JSON.parse(r.detailsJson || '{}') } catch { /* ignore */ }
      return {
        feature: (details.featureName as string) || (details.feature as string) || `Feature ${r.entityId}`,
        importance: r.score,
        coefficient: (details.coefficient as number) ?? r.score,
      }
    })
    .sort((a, b) => b.importance - a.importance)

  const educationRiskData = [...educationRisk].sort((a, b) => b.score - a.score)

  const safehousePerfData = [...safehousePerf].sort((a, b) => b.score - a.score)

  const recurringRate = summary && summary.totalCount > 0
    ? ((summary.recurringCount / summary.totalCount) * 100).toFixed(1)
    : '0'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">Insights and trends to support decision-making.</p>
      </div>

      <Tabs defaultValue="donations">
        <TabsList>
          <TabsTrigger value="donations">
            <DollarSign className="h-4 w-4 mr-1" />
            Donations
          </TabsTrigger>
          <TabsTrigger value="outcomes">
            <Users className="h-4 w-4 mr-1" />
            Outcomes
          </TabsTrigger>
          <TabsTrigger value="social">
            <Share2 className="h-4 w-4 mr-1" />
            Social Media
          </TabsTrigger>
          <TabsTrigger value="safehouses">
            <Building className="h-4 w-4 mr-1" />
            Safehouses
          </TabsTrigger>
        </TabsList>

        {/* Donations Tab */}
        <TabsContent value="donations" className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Donations</CardDescription>
                <CardTitle className="text-3xl">{summary?.totalCount.toLocaleString() ?? '—'}</CardTitle>
              </CardHeader>
              <CardContent><p className="text-xs text-muted-foreground">{summary?.recurringCount ?? 0} recurring, {(summary?.totalCount ?? 0) - (summary?.recurringCount ?? 0)} one-time</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Amount (PHP)</CardDescription>
                <CardTitle className="text-3xl">{summary ? formatCurrency(summary.totalAmount) : '—'}</CardTitle>
              </CardHeader>
              <CardContent><p className="text-xs text-muted-foreground">Across all donation types</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Recurring Rate</CardDescription>
                <CardTitle className="text-3xl">{recurringRate}%</CardTitle>
              </CardHeader>
              <CardContent><p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3 text-primary" />Growing steadily</p></CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Donation Trends</CardTitle>
                <CardDescription>Monthly donation volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={donationTrends}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                      <YAxis className="text-xs fill-muted-foreground" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="totalAmount" name="Total Amount" stroke={CHART_COLORS[0]} strokeWidth={2} />
                      <Line type="monotone" dataKey="recurringCount" name="Recurring" stroke={CHART_COLORS[1]} strokeWidth={2} strokeDasharray="5 5" />
                      <Line type="monotone" dataKey="count" name="Count" stroke={CHART_COLORS[2]} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>Donations per named campaign</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={campaignPerformance}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                      <YAxis className="text-xs fill-muted-foreground" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Bar dataKey="donations" name="# Donations" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Acquisition Channels</CardTitle>
              <CardDescription>How donors found the organization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={channelSources} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                      {channelSources.map((_, index) => (
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
          {/* Campaign ROI Analysis (ML) */}
          {campaignRoiData.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-violet-600" />
                  <CardTitle>Campaign ROI Analysis (ML)</CardTitle>
                </div>
                <CardDescription>ML-ranked campaigns by predicted return on investment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={campaignRoiData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" className="text-xs fill-muted-foreground" />
                      <YAxis type="category" dataKey="name" width={140} className="text-xs fill-muted-foreground" />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        formatter={(value: number, _name: string, props: { payload: { label: string } }) => {
                          const label = props.payload.label
                          return [`${value.toFixed(2)} (${label})`, 'ROI Score']
                        }}
                      />
                      <Bar dataKey="score" name="ROI Score" radius={[0, 4, 4, 0]}>
                        {campaignRoiData.map((entry, index) => (
                          <Cell
                            key={`roi-${index}`}
                            fill={
                              entry.label === 'HighROI'
                                ? 'oklch(0.55 0.15 145)'
                                : entry.label === 'MediumROI'
                                  ? 'oklch(0.65 0.15 85)'
                                  : 'oklch(0.55 0.18 25)'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Outcomes Tab */}
        <TabsContent value="outcomes" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reintegration Success</CardTitle>
              <CardDescription>Outcomes for completed cases ({reintegrationData.reduce((sum, r) => sum + r.count, 0)} total)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={reintegrationData} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                      {reintegrationData.map((_, index) => (
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
          {/* Education Completion Risk (ML) */}
          {educationRiskData.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-violet-600" />
                  <CardTitle>Education Completion Risk (ML)</CardTitle>
                </div>
                <CardDescription>Residents at risk of non-completion, ranked by ML risk score</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Resident Code</TableHead>
                      <TableHead className="text-muted-foreground">Risk Score</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {educationRiskData.map((r) => (
                      <TableRow key={r.pipelineResultId}>
                        <TableCell className="font-medium">
                          {r.resident?.internalCode || r.resident?.caseControlNo || `ID ${r.entityId}`}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-semibold ${
                              r.score >= 0.7 ? 'text-red-600' : r.score >= 0.4 ? 'text-amber-600' : 'text-emerald-600'
                            }`}
                          >
                            {Math.round(r.score * 100)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              r.label === 'AtRisk'
                                ? 'border-red-200 bg-red-50 text-red-700'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            }
                          >
                            {r.label === 'AtRisk' ? 'At Risk' : 'On Track'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Social Media Tab */}
        <TabsContent value="social" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Effectiveness</CardTitle>
              <CardDescription>Which platforms drive actual donations vs. just engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={socialMediaEffectiveness}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="platform" className="text-xs fill-muted-foreground" />
                    <YAxis className="text-xs fill-muted-foreground" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                    <Bar dataKey="posts" name="Posts" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="referrals" name="Donation Referrals" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          {/* Donation Drivers (ML) */}
          {socialDriversData.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-violet-600" />
                  <CardTitle>Donation Drivers (ML)</CardTitle>
                </div>
                <CardDescription>Which post characteristics drive the most donations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={socialDriversData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" className="text-xs fill-muted-foreground" />
                      <YAxis type="category" dataKey="feature" width={160} className="text-xs fill-muted-foreground" />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      />
                      <Bar dataKey="importance" name="Feature Importance" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Safehouses Tab */}
        <TabsContent value="safehouses" className="mt-6 space-y-6">
          {safehousePerfData.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {safehousePerfData.map((sh, i) => {
                let details: Record<string, unknown> = {}
                try { details = JSON.parse(sh.detailsJson || '{}') } catch { /* ignore */ }
                const occupancyPct = sh.safehouse.capacityGirls > 0
                  ? Math.round((sh.safehouse.currentOccupancy / sh.safehouse.capacityGirls) * 100)
                  : 0
                return (
                  <Card key={i} className="relative overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{sh.safehouse.name}</CardTitle>
                        <Badge
                          variant="outline"
                          className={
                            sh.label === 'HighPerformance'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : sh.label === 'Average'
                                ? 'border-amber-200 bg-amber-50 text-amber-700'
                                : 'border-red-200 bg-red-50 text-red-700'
                          }
                        >
                          {sh.label === 'HighPerformance' ? 'High' : sh.label === 'Average' ? 'Average' : 'Needs Attention'}
                        </Badge>
                      </div>
                      <CardDescription>{sh.safehouse.region}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-end gap-1">
                        <span className="text-3xl font-bold text-zinc-900">{(sh.score * 100).toFixed(0)}</span>
                        <span className="mb-1 text-sm text-muted-foreground">/ 100</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Occupancy</span>
                          <span className="font-medium text-zinc-700">{sh.safehouse.currentOccupancy} / {sh.safehouse.capacityGirls} ({occupancyPct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-zinc-100">
                          <div
                            className={`h-2 rounded-full ${
                              occupancyPct > 90 ? 'bg-red-500' : occupancyPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(occupancyPct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
                No safehouse performance data available yet.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
