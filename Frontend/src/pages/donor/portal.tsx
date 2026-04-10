import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Heart,
  Calendar,
  TrendingUp,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { usePageTitle } from '@/hooks/usePageTitle'
import { TablePagination } from '@/components/TablePagination'

/* ── API types ── */

interface ApiDonation {
  donationId: number
  supporterId: number | null
  donationType: string | null
  donationDate: string | null
  isRecurring: boolean | null
  campaignName: string | null
  amount: number | null
  estimatedValue: number | null
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const PAGE_SIZE = 5

export function DonorPortal() {
  usePageTitle('My Donor Portal')

  const [donations, setDonations] = useState<ApiDonation[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingDonation, setViewingDonation] = useState<ApiDonation | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchDonations = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<ApiDonation[]>('/api/donor/my-donations')
      setDonations(data)
    } catch (err) {
      console.error('Failed to load donor donations', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDonations()
  }, [fetchDonations])

  // Derived metrics
  const monetaryDonations = useMemo(
    () => donations.filter(d => d.donationType === 'Monetary' && d.amount != null && d.amount > 0),
    [donations],
  )

  const totalDonated = monetaryDonations.reduce((sum, d) => sum + (d.amount ?? 0), 0)
  const recurringCount = donations.filter(d => d.isRecurring).length
  const largestDonation = monetaryDonations.length > 0
    ? Math.max(...monetaryDonations.map(d => d.amount!))
    : 0

  // Sorted donations for table
  const sortedDonations = useMemo(
    () => [...donations].sort((a, b) => (b.donationDate ?? '').localeCompare(a.donationDate ?? '')),
    [donations],
  )

  const totalPages = Math.max(1, Math.ceil(sortedDonations.length / PAGE_SIZE))
  const paginatedDonations = sortedDonations.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  // Monthly trend from donation data
  const donationTrend = useMemo(() => {
    const map = new Map<string, { label: string; amount: number; count: number }>()
    for (const d of monetaryDonations) {
      if (!d.donationDate) continue
      const dt = new Date(d.donationDate)
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
      const label = `${MONTH_LABELS[dt.getMonth()]} ${dt.getFullYear()}`
      const entry = map.get(key) ?? { label, amount: 0, count: 0 }
      entry.amount += d.amount ?? 0
      entry.count++
      map.set(key, entry)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v)
  }, [monetaryDonations])

  // Campaign breakdown
  const campaignBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>()
    for (const d of monetaryDonations) {
      const name = d.campaignName ?? 'General'
      const entry = map.get(name) ?? { count: 0, total: 0 }
      entry.count++
      entry.total += d.amount ?? 0
      map.set(name, entry)
    }
    return Array.from(map.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.total - a.total)
  }, [monetaryDonations])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">My Donor Portal</h1>
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading your donation data...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Donor Portal</h1>
          <p className="text-muted-foreground">Your donation history and contribution summary.</p>
        </div>
        <Button asChild className="rounded-full px-7 text-base">
          <Link to="/donate">Donate</Link>
        </Button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Donated */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium">Total Donated</CardDescription>
              <Heart className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{formatPHP(totalDonated)}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {monetaryDonations.length} monetary contribution{monetaryDonations.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {/* Total Contributions */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium">All Contributions</CardDescription>
              <TrendBadge label={`${donations.length} total`} positive />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{donations.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Monetary, in-kind, time &amp; skills
            </p>
          </CardContent>
        </Card>

        {/* Recurring */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium">Recurring</CardDescription>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{recurringCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">Monthly contributions</p>
          </CardContent>
        </Card>

        {/* Largest Donation */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium">Largest Donation</CardDescription>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              {largestDonation > 0 ? formatPHP(largestDonation) : '—'}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Single contribution</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Donation Trend Chart ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Your Donation Trends</CardTitle>
          <CardDescription>Monthly monetary contributions over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {donationTrend.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={donationTrend}>
                  <defs>
                    <linearGradient id="donorGradient" x1="0" y1="0" x2="0" y2="1">
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
                    tickFormatter={(v) => `₱${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#111827',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value, name) => [
                      name === 'amount' ? `₱${Number(value).toLocaleString()}` : value,
                      name === 'amount' ? 'Amount' : 'Donations',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="oklch(0.45 0.18 280)"
                    strokeWidth={2}
                    fill="url(#donorGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                {donationTrend.length === 1 ? 'More data needed for trend chart' : 'No monetary donations yet'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Campaign Breakdown & Donation History ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Campaign Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="h-4 w-4 text-primary" />
              By Campaign
            </CardTitle>
            <CardDescription>Your donations by campaign</CardDescription>
          </CardHeader>
          <CardContent>
            {campaignBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No donations yet</p>
            ) : (
              <div className="space-y-2">
                {campaignBreakdown.map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{c.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {c.count} donation{c.count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="text-sm font-semibold">{formatPHP(c.total)}</span>
                  </div>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" asChild className="w-full mt-3 text-xs">
              <Link to="/donate">Support a campaign →</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Donation History Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Donation History
            </CardTitle>
            <CardDescription>All your past contributions</CardDescription>
          </CardHeader>
          <CardContent>
            {donations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No donations found for your account.</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDonations.map((donation) => (
                      <TableRow
                        key={donation.donationId}
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => setViewingDonation(donation)}
                      >
                        <TableCell className="text-sm">
                          {donation.donationDate
                            ? new Date(donation.donationDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={donation.donationType === 'Monetary' ? 'default' : 'secondary'}>
                            {donation.donationType ?? 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {donation.campaignName ?? '—'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {donation.amount != null && donation.amount > 0
                            ? `₱${donation.amount.toLocaleString()}`
                            : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Donation Detail Dialog ── */}
      <Dialog open={!!viewingDonation} onOpenChange={(open) => { if (!open) setViewingDonation(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Donation Details</DialogTitle>
            <DialogDescription>
              {viewingDonation?.donationDate
                ? new Date(viewingDonation.donationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : 'Donation record'}
            </DialogDescription>
          </DialogHeader>
          {viewingDonation && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 py-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Date</p>
                <p className="font-medium text-foreground">
                  {viewingDonation.donationDate
                    ? new Date(viewingDonation.donationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Type</p>
                <Badge variant={viewingDonation.donationType === 'Monetary' ? 'default' : 'secondary'}>
                  {viewingDonation.donationType ?? 'Unknown'}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Campaign</p>
                <p className="font-medium text-foreground">{viewingDonation.campaignName ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Amount</p>
                <p className="font-medium text-foreground">
                  {viewingDonation.amount != null && viewingDonation.amount > 0
                    ? `₱${viewingDonation.amount.toLocaleString()}`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Recurring</p>
                <p className="font-medium text-foreground">
                  {viewingDonation.isRecurring ? (
                    <Badge variant="outline" className="text-xs">Monthly</Badge>
                  ) : 'One-time'}
                </p>
              </div>
              {viewingDonation.estimatedValue != null && viewingDonation.estimatedValue > 0 && (
                <div>
                  <p className="text-muted-foreground mb-1">Estimated Value</p>
                  <p className="font-medium text-foreground">₱{viewingDonation.estimatedValue.toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setViewingDonation(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ── Helpers ── */

function formatPHP(value: number): string {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `₱${(value / 1_000).toFixed(0)}K`
  return `₱${value.toLocaleString()}`
}

function TrendBadge({ label, positive }: { label: string; positive: boolean }) {
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
      {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {label}
    </span>
  )
}
