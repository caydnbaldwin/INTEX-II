import {
  Users,
  Heart,
  Home,
  TrendingUp,
  Calendar
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
  Legend
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  publicImpactSnapshots,
  safehouseMetrics,
  educationPrograms,
  reintegrationOutcomes,
  donationSummary
} from '@/lib/mock-data'

const CHART_COLORS = [
  'oklch(0.45 0.18 280)',
  'oklch(0.55 0.15 280)',
  'oklch(0.65 0.12 280)',
  'oklch(0.75 0.08 280)',
  'oklch(0.35 0.12 280)',
]

export function ImpactDashboard() {
  const residentsOverTime = publicImpactSnapshots.map(snapshot => ({
    month: new Date(snapshot.snapshotMonth).toLocaleDateString('en-US', { month: 'short' }),
    active: snapshot.activeResidents,
    total: snapshot.totalResidentsServed,
  }))

  const healthOverTime = publicImpactSnapshots.map(snapshot => ({
    month: new Date(snapshot.snapshotMonth).toLocaleDateString('en-US', { month: 'short' }),
    healthScore: snapshot.avgHealthScore,
    sessions: Math.round(snapshot.counselingSessions / 10),
  }))

  const safehouseData = safehouseMetrics.map(sh => ({
    name: sh.safehouseName.split(' ')[0],
    capacity: sh.capacity,
    occupancy: sh.currentOccupancy,
  }))

  const regionData = [
    { name: 'Luzon', value: safehouseMetrics.filter(s => s.region === 'Luzon').length },
    { name: 'Visayas', value: safehouseMetrics.filter(s => s.region === 'Visayas').length },
    { name: 'Mindanao', value: safehouseMetrics.filter(s => s.region === 'Mindanao').length },
  ]

  const latestSnapshot = publicImpactSnapshots[publicImpactSnapshots.length - 1]

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Impact Dashboard
              </h1>
              <p className="mt-2 text-lg text-muted-foreground">
                Transparent, anonymized data showing how your support transforms lives.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Last updated: {new Date(latestSnapshot.snapshotMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Total Residents Served" value={latestSnapshot.totalResidentsServed} description="Since founding" icon={Users} trend="+12% from last year" />
          <MetricCard title="Active Residents" value={latestSnapshot.activeResidents} description="Currently in care" icon={Home} trend="Across 9 safehouses" />
          <MetricCard title="Counseling Sessions" value={latestSnapshot.counselingSessions} description="This month" icon={Heart} trend="Individual & group therapy" />
          <MetricCard title="Average Health Score" value={latestSnapshot.avgHealthScore} description="Out of 100" icon={TrendingUp} trend="+8 points this year" />
        </div>

        <Tabs defaultValue="overview" className="mt-12">
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
                  {[
                    { name: 'Nutrition Score', value: 82, description: 'Based on BMI and diet tracking' },
                    { name: 'Sleep Quality', value: 78, description: 'Average hours and quality rating' },
                    { name: 'Energy Level', value: 85, description: 'Self-reported daily energy' },
                    { name: 'Emotional Wellbeing', value: 76, description: 'Tracked through counseling' },
                  ].map((metric) => (
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
              {safehouseMetrics.map((safehouse) => (
                <Card key={safehouse.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{safehouse.safehouseName}</CardTitle>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{safehouse.region}</span>
                    </div>
                    <CardDescription>{safehouse.currentOccupancy} of {safehouse.capacity} capacity</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress value={(safehouse.currentOccupancy / safehouse.capacity) * 100} className="h-2" />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Education</div>
                        <div className="font-semibold text-foreground">{safehouse.avgEducationProgress}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Health</div>
                        <div className="font-semibold text-foreground">{safehouse.avgHealthScore}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
              for survivors. {donationSummary.recurringDonors} recurring donors have already
              contributed over PHP {(donationSummary.totalAmount / 1000000).toFixed(1)}M.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({ title, value, description, icon: Icon, trend }: { title: string; value: number; description: string; icon: React.ElementType; trend: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription className="text-xs uppercase tracking-wider">{title}</CardDescription>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{value.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        <div className="mt-2 flex items-center gap-1 text-xs text-primary">
          <TrendingUp className="h-3 w-3" />
          <span>{trend}</span>
        </div>
      </CardContent>
    </Card>
  )
}
