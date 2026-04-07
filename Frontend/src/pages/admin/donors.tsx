import { useState, useEffect } from 'react'
import { Plus, Search, Users, UserCheck, Banknote, Trash2, Pencil, AlertTriangle } from 'lucide-react'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DonorType = 'MonetaryDonor' | 'InKindDonor' | 'Volunteer' | 'SkillsContributor' | 'SocialMediaAdvocate' | 'PartnerOrganization'
type DonorStatus = 'Active' | 'Inactive'
type AcquisitionChannel =
  | 'Website'
  | 'SocialMedia'
  | 'Event'
  | 'WordOfMouth'
  | 'PartnerReferral'
  | 'Church'

interface Donor {
  id: number
  name: string
  email: string
  type: DonorType
  status: DonorStatus
  acquisitionChannel: AcquisitionChannel
  lastDonationDate: string
  totalAmount: number
}

interface Donation {
  id: number
  donorId: number
  donorName: string
  date: string
  amount: number
  type: string
  description: string
}

// API response types
interface SupporterResponse {
  supporterId: number
  supporterType: string
  displayName: string
  organizationName?: string
  firstName?: string
  lastName?: string
  email: string
  status: string
  firstDonationDate?: string
  acquisitionChannel?: string
}

interface DonationResponse {
  donationId: number
  supporterId: number
  donationType: string
  donationDate: string
  amount: number
  campaignName?: string
  notes?: string
}

interface DonorChurnResult {
  pipelineResultId: number
  entityId: number
  score: number
  label: string
  detailsJson: string
  supporter: {
    displayName: string
    email: string
    supporterType: string
    status: string
    firstDonationDate: string
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DONOR_TYPES: DonorType[] = [
  'MonetaryDonor',
  'InKindDonor',
  'Volunteer',
  'SkillsContributor',
  'SocialMediaAdvocate',
  'PartnerOrganization',
]
const DONOR_STATUSES: DonorStatus[] = ['Active', 'Inactive']
const ACQUISITION_CHANNELS: AcquisitionChannel[] = [
  'Website',
  'SocialMedia',
  'Event',
  'WordOfMouth',
  'PartnerReferral',
  'Church',
]

// Display-friendly labels
const DONOR_TYPE_LABELS: Record<DonorType, string> = {
  MonetaryDonor: 'Monetary',
  InKindDonor: 'In-Kind',
  Volunteer: 'Volunteer',
  SkillsContributor: 'Skills',
  SocialMediaAdvocate: 'Advocate',
  PartnerOrganization: 'Partner',
}

const CHANNEL_LABELS: Record<AcquisitionChannel, string> = {
  Website: 'Website',
  SocialMedia: 'Social Media',
  Event: 'Event',
  WordOfMouth: 'Word of Mouth',
  PartnerReferral: 'Partner Referral',
  Church: 'Church',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPHP(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function typeBadgeClass(type: DonorType | string): string {
  switch (type) {
    case 'MonetaryDonor':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'InKindDonor':
      return 'border-blue-200 bg-blue-50 text-blue-700'
    case 'Volunteer':
      return 'border-violet-200 bg-violet-50 text-violet-700'
    case 'SkillsContributor':
      return 'border-cyan-200 bg-cyan-50 text-cyan-700'
    case 'SocialMediaAdvocate':
      return 'border-pink-200 bg-pink-50 text-pink-700'
    case 'PartnerOrganization':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    default:
      return 'border-zinc-200 bg-zinc-50 text-zinc-700'
  }
}

// ---------------------------------------------------------------------------
// Blank form
// ---------------------------------------------------------------------------

const blankForm = {
  name: '',
  email: '',
  type: '' as string,
  acquisitionChannel: '' as string,
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DonorsManagement() {
  const [donors, setDonors] = useState<Donor[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [atRiskDonors, setAtRiskDonors] = useState<DonorChurnResult[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(blankForm)
  const [saving, setSaving] = useState(false)

  // Fetch supporters and donations
  async function fetchAll() {
    try {
      const [supportersData, donationsData] = await Promise.all([
        api.get<SupporterResponse[]>('/api/supporters'),
        api.get<DonationResponse[]>('/api/donations'),
      ])

      // Build a map of totalAmount per supporter from donations
      const donationTotals = new Map<number, number>()
      const latestDonationDate = new Map<number, string>()
      for (const d of donationsData) {
        donationTotals.set(d.supporterId, (donationTotals.get(d.supporterId) ?? 0) + d.amount)
        const existing = latestDonationDate.get(d.supporterId)
        if (!existing || d.donationDate > existing) {
          latestDonationDate.set(d.supporterId, d.donationDate)
        }
      }

      // Build a map of supporter names for donation display
      const supporterNames = new Map<number, string>()
      for (const s of supportersData) {
        supporterNames.set(s.supporterId, s.displayName || `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || 'Unknown')
      }

      // Map supporters to Donor interface
      const mappedDonors: Donor[] = supportersData.map((s) => ({
        id: s.supporterId,
        name: s.displayName || `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || 'Unknown',
        email: s.email || '',
        type: (s.supporterType as DonorType) || 'MonetaryDonor',
        status: (s.status as DonorStatus) || 'Active',
        acquisitionChannel: (s.acquisitionChannel as AcquisitionChannel) || 'Website',
        lastDonationDate: latestDonationDate.get(s.supporterId)?.split('T')[0] ?? s.firstDonationDate?.split('T')[0] ?? '-',
        totalAmount: donationTotals.get(s.supporterId) ?? 0,
      }))

      setDonors(mappedDonors)

      // Map donations
      const mappedDonations: Donation[] = donationsData.map((d) => ({
        id: d.donationId,
        donorId: d.supporterId,
        donorName: supporterNames.get(d.supporterId) ?? 'Unknown',
        date: d.donationDate.split('T')[0],
        amount: d.amount,
        type: d.donationType || 'Monetary',
        description: d.notes || d.campaignName || '',
      }))

      setDonations(mappedDonations)

      // Fetch ML churn predictions (non-blocking)
      try {
        const churnResults = await api.get<DonorChurnResult[]>('/api/pipeline-results/donor-churn')
        setAtRiskDonors(churnResults.filter((r) => r.label === 'AtRisk'))
      } catch {
        console.warn('ML pipeline data unavailable')
      }
    } catch (err) {
      console.error('Failed to load donors data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  // Metrics
  const totalDonors = donors.length
  const activeDonors = donors.filter((d) => d.status === 'Active').length
  const totalDonationsAmount = donors.reduce((sum, d) => sum + d.totalAmount, 0)

  // Filter donors
  const filteredDonors = donors.filter((d) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q || d.name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q)
    const matchesType = filterType === 'all' || d.type === filterType
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  function openAdd() {
    setEditingId(null)
    setForm(blankForm)
    setDialogOpen(true)
  }

  function openEdit(d: Donor) {
    setEditingId(d.id)
    setForm({
      name: d.name,
      email: d.email,
      type: d.type,
      acquisitionChannel: d.acquisitionChannel,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        displayName: form.name,
        email: form.email,
        supporterType: form.type || 'MonetaryDonor',
        acquisitionChannel: form.acquisitionChannel || 'Website',
        status: 'Active',
      }

      if (editingId) {
        await api.put(`/api/supporters/${editingId}`, payload)
      } else {
        await api.post('/api/supporters', payload)
      }

      setDialogOpen(false)
      await fetchAll()
    } catch (err) {
      console.error('Failed to save supporter:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/api/supporters/${id}`)
      await fetchAll()
    } catch (err) {
      console.error('Failed to delete supporter:', err)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Donors & Contributions
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Manage supporters and track donation activity.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-20 text-zinc-400">
          Loading donors data...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Donors & Contributions
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage supporters and track donation activity.
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2 bg-violet-700 hover:bg-violet-800">
          <Plus className="h-4 w-4" />
          Add Supporter
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              Total Donors
            </CardTitle>
            <Users className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{totalDonors}</div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              Active Donors
            </CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {activeDonors}
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              Total Donations
            </CardTitle>
            <Banknote className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {formatPHP(totalDonationsAmount)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* At-Risk Donors (ML) */}
      {atRiskDonors.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              At-Risk Donors (ML)
            </CardTitle>
            <p className="text-sm text-amber-700">
              These donors are predicted to be at risk of churning based on ML analysis.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {atRiskDonors.map((d) => {
                const daysSinceFirst = d.supporter?.firstDonationDate
                  ? Math.floor(
                      (Date.now() - new Date(d.supporter.firstDonationDate).getTime()) /
                        (1000 * 60 * 60 * 24),
                    )
                  : null
                return (
                  <div
                    key={d.pipelineResultId}
                    className="flex items-center justify-between rounded-lg border border-amber-200 bg-white px-4 py-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-zinc-900">
                        {d.supporter?.displayName || `Donor ${d.entityId}`}
                      </div>
                      <div className="text-xs text-zinc-500">{d.supporter?.email}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {daysSinceFirst !== null && (
                        <span className="text-xs text-zinc-500">
                          {daysSinceFirst}d since first donation
                        </span>
                      )}
                      <Badge
                        variant="outline"
                        className="border-amber-400 bg-amber-100 text-amber-800"
                      >
                        {(d.score * 100).toFixed(0)}% churn risk
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="supporters">
        <TabsList>
          <TabsTrigger value="supporters">Supporters</TabsTrigger>
          <TabsTrigger value="donations">Recent Donations</TabsTrigger>
        </TabsList>

        {/* Supporters Tab */}
        <TabsContent value="supporters" className="space-y-4">
          {/* Filters */}
          <Card className="border-zinc-200">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    placeholder="Search donors..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {DONOR_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {DONOR_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {DONOR_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Donors Table */}
          <Card className="border-zinc-200">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-zinc-500">Name</TableHead>
                  <TableHead className="text-zinc-500">Type</TableHead>
                  <TableHead className="text-zinc-500">Status</TableHead>
                  <TableHead className="text-zinc-500">Last Donation</TableHead>
                  <TableHead className="text-right text-zinc-500">
                    Total Amount
                  </TableHead>
                  <TableHead className="text-right text-zinc-500">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDonors.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-zinc-400"
                    >
                      No donors found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDonors.map((donor) => (
                    <TableRow key={donor.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-zinc-900">
                            {donor.name}
                          </div>
                          <div className="text-xs text-zinc-400">
                            {donor.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={typeBadgeClass(donor.type)}
                        >
                          {DONOR_TYPE_LABELS[donor.type] ?? donor.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            donor.status === 'Active'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-zinc-200 bg-zinc-50 text-zinc-500'
                          }
                        >
                          {donor.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-600">
                        {donor.lastDonationDate === '-'
                          ? '-'
                          : new Date(
                              donor.lastDonationDate,
                            ).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                      </TableCell>
                      <TableCell className="text-right font-medium text-zinc-900">
                        {formatPHP(donor.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 hover:text-violet-700"
                            onClick={() => openEdit(donor)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-500 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Remove Donor
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove{' '}
                                  <span className="font-semibold">
                                    {donor.name}
                                  </span>{' '}
                                  from the donors list? This action cannot be
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(donor.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Donations Tab */}
        <TabsContent value="donations">
          <Card className="border-zinc-200">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-zinc-500">Date</TableHead>
                  <TableHead className="text-zinc-500">Donor</TableHead>
                  <TableHead className="text-zinc-500">Type</TableHead>
                  <TableHead className="text-zinc-500">Description</TableHead>
                  <TableHead className="text-right text-zinc-500">
                    Amount
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-zinc-400"
                    >
                      No donations found.
                    </TableCell>
                  </TableRow>
                ) : (
                  donations.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell className="text-zinc-600">
                        {new Date(donation.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="font-medium text-zinc-900">
                        {donation.donorName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={typeBadgeClass(donation.type)}
                        >
                          {DONOR_TYPE_LABELS[donation.type as DonorType] ?? donation.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[280px] truncate text-zinc-600">
                        {donation.description}
                      </TableCell>
                      <TableCell className="text-right font-medium text-zinc-900">
                        {formatPHP(donation.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Supporter Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Supporter' : 'Add New Supporter'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update the supporter information below.'
                : 'Register a new donor or supporter.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="donorName">Name</Label>
              <Input
                id="donorName"
                placeholder="Full name or organization"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="donorEmail">Email</Label>
              <Input
                id="donorEmail"
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DONOR_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {DONOR_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Acquisition Channel</Label>
                <Select
                  value={form.acquisitionChannel}
                  onValueChange={(v) =>
                    setForm({ ...form, acquisitionChannel: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACQUISITION_CHANNELS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CHANNEL_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-violet-700 hover:bg-violet-800"
            >
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Supporter'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
