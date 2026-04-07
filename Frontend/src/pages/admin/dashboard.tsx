import {
  Users,
  Home,
  AlertTriangle,
  Heart,
  TrendingUp,
  Calendar,
  FileText,
  Activity,
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

const CHART_COLORS = [
  'oklch(0.45 0.18 280)',
  'oklch(0.55 0.15 280)',
  'oklch(0.65 0.12 280)',
  'oklch(0.75 0.08 280)',
  'oklch(0.35 0.12 280)',
]

const safehouseOccupancy = [
  { name: 'Bahay Pag-asa', capacity: 12, occupancy: 8 },
  { name: 'Casa Esperanza', capacity: 10, occupancy: 7 },
  { name: 'Haven of Hope', capacity: 8, occupancy: 6 },
  { name: 'Tahanan ng Liwanag', capacity: 10, occupancy: 9 },
  { name: 'Silungan', capacity: 12, occupancy: 5 },
  { name: 'Kanlungan', capacity: 8, occupancy: 8 },
  { name: 'Sanctuary', capacity: 10, occupancy: 7 },
  { name: 'Ligaya House', capacity: 8, occupancy: 4 },
  { name: 'Pag-ibig Center', capacity: 7, occupancy: 6 },
]

const riskDistribution = [
  { name: 'Low', value: 34 },
  { name: 'Medium', value: 20 },
  { name: 'High', value: 5 },
  { name: 'Critical', value: 1 },
]

const recentIncidents = [
  { id: 1, type: 'Behavioral', resident: 'R-012', date: '2026-04-05', status: 'Unresolved' },
  { id: 2, type: 'RunawayAttempt', resident: 'R-034', date: '2026-04-04', status: 'Unresolved' },
  { id: 3, type: 'SelfHarm', resident: 'R-008', date: '2026-04-03', status: 'Resolved' },
  { id: 4, type: 'Security', resident: 'R-045', date: '2026-04-02', status: 'Unresolved' },
]

const upcomingConferences = [
  { id: 1, resident: 'R-012', date: '2026-04-09', category: 'Psychosocial' },
  { id: 2, resident: 'R-023', date: '2026-04-10', category: 'Reintegration' },
  { id: 3, resident: 'R-045', date: '2026-04-11', category: 'Safety' },
]

export function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of operations across all safehouses.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Residents" value="60" description="30 active, 19 closed, 11 transferred" icon={Users} />
        <MetricCard title="Active Safehouses" value="9" description="85 total capacity, 60 occupied" icon={Home} />
        <MetricCard title="Risk Alerts" value="6" description="5 high + 1 critical" icon={AlertTriangle} trend="destructive" />
        <MetricCard title="Recent Donations" value="42" description="This month — PHP 180K" icon={Heart} />
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
              <CardDescription>29 total unresolved incidents</CardDescription>
            </div>
            <Badge variant="destructive">29 unresolved</Badge>
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
              {upcomingConferences.map((conf) => (
                <div key={conf.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-mono text-muted-foreground">{conf.resident}</span>
                    <Badge variant="outline" className="text-xs">{conf.category}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{conf.date}</span>
                </div>
              ))}
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
            </div>
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
