import {
  TrendingUp,
  DollarSign,
  Users,
  Share2,
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

const CHART_COLORS = [
  'oklch(0.45 0.18 280)',
  'oklch(0.55 0.15 280)',
  'oklch(0.65 0.12 280)',
  'oklch(0.75 0.08 280)',
  'oklch(0.35 0.12 280)',
]

const donationTrends = [
  { month: 'Oct', monetary: 45000, inKind: 12000, recurring: 28000 },
  { month: 'Nov', monetary: 52000, inKind: 15000, recurring: 30000 },
  { month: 'Dec', monetary: 78000, inKind: 22000, recurring: 35000 },
  { month: 'Jan', monetary: 41000, inKind: 10000, recurring: 32000 },
  { month: 'Feb', monetary: 48000, inKind: 14000, recurring: 33000 },
  { month: 'Mar', monetary: 55000, inKind: 18000, recurring: 36000 },
]

const campaignPerformance = [
  { name: 'Year-End Hope', donations: 60, amount: 280000 },
  { name: 'Summer of Safety', donations: 35, amount: 150000 },
  { name: 'Back to School', donations: 32, amount: 120000 },
  { name: 'GivingTuesday', donations: 18, amount: 95000 },
]

const channelSources = [
  { name: 'WordOfMouth', value: 14 },
  { name: 'Social Media', value: 13 },
  { name: 'Website', value: 13 },
  { name: 'Event', value: 8 },
  { name: 'Church', value: 6 },
  { name: 'Partner', value: 6 },
]

const socialMediaEffectiveness = [
  { platform: 'Facebook', posts: 199, referrals: 145, estValue: 320000 },
  { platform: 'Instagram', posts: 164, referrals: 120, estValue: 250000 },
  { platform: 'Twitter', posts: 117, referrals: 85, estValue: 180000 },
  { platform: 'WhatsApp', posts: 93, referrals: 78, estValue: 160000 },
  { platform: 'TikTok', posts: 89, referrals: 95, estValue: 200000 },
  { platform: 'LinkedIn', posts: 79, referrals: 60, estValue: 140000 },
  { platform: 'YouTube', posts: 71, referrals: 90, estValue: 210000 },
]

const reintegrationData = [
  { type: 'Family Reunification', count: 8, percentage: 42 },
  { type: 'Foster Care', count: 5, percentage: 26 },
  { type: 'Independent Living', count: 4, percentage: 21 },
  { type: 'Adoption', count: 2, percentage: 11 },
]

export function ReportsAnalytics() {
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
        </TabsList>

        {/* Donations Tab */}
        <TabsContent value="donations" className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Donations</CardDescription>
                <CardTitle className="text-3xl">420</CardTitle>
              </CardHeader>
              <CardContent><p className="text-xs text-muted-foreground">211 recurring, 209 one-time</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Amount (PHP)</CardDescription>
                <CardTitle className="text-3xl">2.1M</CardTitle>
              </CardHeader>
              <CardContent><p className="text-xs text-muted-foreground">Across all donation types</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Recurring Rate</CardDescription>
                <CardTitle className="text-3xl">50.2%</CardTitle>
              </CardHeader>
              <CardContent><p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3 text-primary" />Growing steadily</p></CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Donation Trends</CardTitle>
                <CardDescription>Monthly donation volume by type</CardDescription>
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
                      <Line type="monotone" dataKey="monetary" name="Monetary" stroke={CHART_COLORS[0]} strokeWidth={2} />
                      <Line type="monotone" dataKey="recurring" name="Recurring" stroke={CHART_COLORS[1]} strokeWidth={2} strokeDasharray="5 5" />
                      <Line type="monotone" dataKey="inKind" name="In-Kind" stroke={CHART_COLORS[2]} strokeWidth={2} />
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
        </TabsContent>

        {/* Outcomes Tab */}
        <TabsContent value="outcomes" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reintegration Success</CardTitle>
              <CardDescription>Outcomes for completed cases (19 total)</CardDescription>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
