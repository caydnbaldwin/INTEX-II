import { useState, useEffect, useCallback } from 'react'
import { Heart, Calendar, TrendingUp, Gift, Loader2 } from 'lucide-react'
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
import { donorSpotlightResidentIds, listDonorSpotlightStories } from '@/lib/publicResidentStories'
import { api } from '@/lib/api'
import { usePageTitle } from '@/hooks/usePageTitle'

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

export function DonorPortal() {
  usePageTitle('My Donor Portal')

  const [donations, setDonations] = useState<ApiDonation[]>([])
  const [loading, setLoading] = useState(true)

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

  const totalDonated = donations
    .filter(d => d.donationType === 'Monetary')
    .reduce((sum, d) => sum + (d.amount ?? 0), 0)
  const donationCount = donations.length
  const recurringCount = donations.filter(d => d.isRecurring).length

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

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
        <CardContent className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground font-serif">
                {donorSpotlightResidentIds.length}
              </div>
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
          <div className="border-t border-border pt-6">
            <p className="text-sm font-medium text-foreground mb-3">Representative participants you helped</p>
            <p className="text-xs text-muted-foreground mb-4">
              Shown with anonymized labels only (not real names).
            </p>
            <ul className="space-y-4">
              {listDonorSpotlightStories().map((story) => (
                <li
                  key={story.residentId}
                  className="rounded-md border border-border bg-muted/20 px-4 py-3"
                >
                  <div className="font-mono text-sm font-semibold text-primary">{story.pseudonym}</div>
                  <div className="mt-1 text-sm font-medium text-foreground">{story.headline}</div>
                  <p className="mt-1 text-sm text-muted-foreground leading-snug">{story.description}</p>
                </li>
              ))}
            </ul>
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
          {donations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No donations found for your account.</p>
          ) : (
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
                {donations.map((donation) => (
                  <TableRow key={donation.donationId}>
                    <TableCell className="font-mono text-sm">
                      {donation.donationDate
                        ? new Date(donation.donationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
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
                    <TableCell className="text-right font-mono">
                      {donation.amount != null && donation.amount > 0 ? donation.amount.toLocaleString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {donation.isRecurring && <Badge variant="outline" className="text-xs">Monthly</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
