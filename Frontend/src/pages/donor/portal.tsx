import { Heart, Calendar, TrendingUp, Gift } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'

const donorDonations = [
  { id: 1, date: '2026-03-15', amount: 5000, type: 'Monetary', campaign: 'Year-End Hope', recurring: true },
  { id: 2, date: '2026-02-15', amount: 5000, type: 'Monetary', campaign: null, recurring: true },
  { id: 3, date: '2026-01-15', amount: 5000, type: 'Monetary', campaign: null, recurring: true },
  { id: 4, date: '2025-12-20', amount: 10000, type: 'Monetary', campaign: 'Year-End Hope', recurring: false },
  { id: 5, date: '2025-11-15', amount: 5000, type: 'Monetary', campaign: null, recurring: true },
  { id: 6, date: '2025-10-05', amount: 0, type: 'InKind', campaign: 'Back to School', recurring: false },
]

export function DonorPortal() {
  const totalDonated = donorDonations.filter(d => d.type === 'Monetary').reduce((sum, d) => sum + d.amount, 0)
  const donationCount = donorDonations.length
  const recurringCount = donorDonations.filter(d => d.recurring).length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Donor Portal</h1>
        <p className="text-muted-foreground">Your donation history and the impact of your generosity.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">Total Donated</CardDescription>
            <Heart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">PHP {totalDonated.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{donationCount} total donations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">Recurring</CardDescription>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{recurringCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Monthly contributions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">Impact Score</CardDescription>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">92</div>
            <p className="text-xs text-muted-foreground mt-1">Top 15% of donors</p>
          </CardContent>
        </Card>
      </div>

      {/* Impact Summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Your Impact
          </CardTitle>
          <CardDescription>How your donations have been allocated</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground font-serif">3</div>
              <p className="text-sm text-muted-foreground mt-1">Residents supported</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground font-serif">48</div>
              <p className="text-sm text-muted-foreground mt-1">Counseling sessions funded</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground font-serif">12</div>
              <p className="text-sm text-muted-foreground mt-1">Months of education</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Donation History */}
      <Card>
        <CardHeader>
          <CardTitle>Donation History</CardTitle>
          <CardDescription>All your past contributions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead className="text-right">Amount (PHP)</TableHead>
                <TableHead>Recurring</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donorDonations.map((donation) => (
                <TableRow key={donation.id}>
                  <TableCell className="font-mono text-sm">{donation.date}</TableCell>
                  <TableCell>
                    <Badge variant={donation.type === 'Monetary' ? 'default' : 'secondary'}>{donation.type}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {donation.campaign ?? '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {donation.amount > 0 ? donation.amount.toLocaleString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {donation.recurring && <Badge variant="outline" className="text-xs">Monthly</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
