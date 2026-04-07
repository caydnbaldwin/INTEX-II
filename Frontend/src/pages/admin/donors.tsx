import { useState } from 'react'
import { Plus, Search, Users, UserCheck, Banknote, Trash2, Pencil } from 'lucide-react'
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DonorType = 'Monetary' | 'In-Kind' | 'Volunteer' | 'Corporate' | 'Foundation'
type DonorStatus = 'Active' | 'Inactive'
type AcquisitionChannel =
  | 'Website'
  | 'Referral'
  | 'Social Media'
  | 'Event'
  | 'Direct Outreach'

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
  type: DonorType
  description: string
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const DONOR_TYPES: DonorType[] = [
  'Monetary',
  'In-Kind',
  'Volunteer',
  'Corporate',
  'Foundation',
]
const DONOR_STATUSES: DonorStatus[] = ['Active', 'Inactive']
const ACQUISITION_CHANNELS: AcquisitionChannel[] = [
  'Website',
  'Referral',
  'Social Media',
  'Event',
  'Direct Outreach',
]

const initialDonors: Donor[] = [
  {
    id: 1,
    name: 'Isabel Chua',
    email: 'isabel.chua@email.com',
    type: 'Monetary',
    status: 'Active',
    acquisitionChannel: 'Website',
    lastDonationDate: '2026-04-01',
    totalAmount: 150000,
  },
  {
    id: 2,
    name: 'Andres Tan',
    email: 'andres.tan@email.com',
    type: 'Monetary',
    status: 'Active',
    acquisitionChannel: 'Referral',
    lastDonationDate: '2026-03-28',
    totalAmount: 320000,
  },
  {
    id: 3,
    name: 'GreenField Corp.',
    email: 'csr@greenfield.ph',
    type: 'Corporate',
    status: 'Active',
    acquisitionChannel: 'Direct Outreach',
    lastDonationDate: '2026-03-15',
    totalAmount: 500000,
  },
  {
    id: 4,
    name: 'Patricia Lim',
    email: 'patricia.lim@email.com',
    type: 'In-Kind',
    status: 'Active',
    acquisitionChannel: 'Social Media',
    lastDonationDate: '2026-03-20',
    totalAmount: 85000,
  },
  {
    id: 5,
    name: 'Bayanihan Foundation',
    email: 'grants@bayanihan.org',
    type: 'Foundation',
    status: 'Active',
    acquisitionChannel: 'Event',
    lastDonationDate: '2026-02-10',
    totalAmount: 750000,
  },
  {
    id: 6,
    name: 'Ricardo Soriano',
    email: 'ricardo.s@email.com',
    type: 'Volunteer',
    status: 'Active',
    acquisitionChannel: 'Referral',
    lastDonationDate: '2026-03-05',
    totalAmount: 25000,
  },
  {
    id: 7,
    name: 'Clara Villanueva',
    email: 'clara.v@email.com',
    type: 'Monetary',
    status: 'Inactive',
    acquisitionChannel: 'Website',
    lastDonationDate: '2025-11-20',
    totalAmount: 180000,
  },
  {
    id: 8,
    name: 'Manila Gives Inc.',
    email: 'info@manilagives.ph',
    type: 'Corporate',
    status: 'Active',
    acquisitionChannel: 'Event',
    lastDonationDate: '2026-03-30',
    totalAmount: 90000,
  },
]

const initialDonations: Donation[] = [
  {
    id: 1,
    donorId: 1,
    donorName: 'Isabel Chua',
    date: '2026-04-01',
    amount: 50000,
    type: 'Monetary',
    description: 'Monthly recurring donation',
  },
  {
    id: 2,
    donorId: 3,
    donorName: 'GreenField Corp.',
    date: '2026-03-15',
    amount: 200000,
    type: 'Corporate',
    description: 'CSR quarterly partnership contribution',
  },
  {
    id: 3,
    donorId: 2,
    donorName: 'Andres Tan',
    date: '2026-03-28',
    amount: 75000,
    type: 'Monetary',
    description: 'Birthday fundraiser proceeds',
  },
  {
    id: 4,
    donorId: 4,
    donorName: 'Patricia Lim',
    date: '2026-03-20',
    amount: 35000,
    type: 'In-Kind',
    description: 'School supplies and hygiene kits (50 sets)',
  },
  {
    id: 5,
    donorId: 5,
    donorName: 'Bayanihan Foundation',
    date: '2026-02-10',
    amount: 500000,
    type: 'Foundation',
    description: 'Annual shelter operations grant',
  },
  {
    id: 6,
    donorId: 8,
    donorName: 'Manila Gives Inc.',
    date: '2026-03-30',
    amount: 45000,
    type: 'Corporate',
    description: 'Employee matching program - March',
  },
  {
    id: 7,
    donorId: 6,
    donorName: 'Ricardo Soriano',
    date: '2026-03-05',
    amount: 10000,
    type: 'Monetary',
    description: 'Personal donation after volunteer shift',
  },
]

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

function typeBadgeClass(type: DonorType): string {
  switch (type) {
    case 'Monetary':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'In-Kind':
      return 'border-blue-200 bg-blue-50 text-blue-700'
    case 'Volunteer':
      return 'border-violet-200 bg-violet-50 text-violet-700'
    case 'Corporate':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'Foundation':
      return 'border-indigo-200 bg-indigo-50 text-indigo-700'
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
  const [donors, setDonors] = useState<Donor[]>(initialDonors)
  const [donations] = useState<Donation[]>(initialDonations)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(blankForm)

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

  function handleSave() {
    if (editingId) {
      setDonors((prev) =>
        prev.map((d) =>
          d.id === editingId
            ? {
                ...d,
                name: form.name,
                email: form.email,
                type: (form.type as DonorType) || d.type,
                acquisitionChannel:
                  (form.acquisitionChannel as AcquisitionChannel) ||
                  d.acquisitionChannel,
              }
            : d,
        ),
      )
    } else {
      const newDonor: Donor = {
        id: Date.now(),
        name: form.name,
        email: form.email,
        type: (form.type as DonorType) || 'Monetary',
        status: 'Active',
        acquisitionChannel:
          (form.acquisitionChannel as AcquisitionChannel) || 'Website',
        lastDonationDate: '-',
        totalAmount: 0,
      }
      setDonors((prev) => [...prev, newDonor])
    }
    setDialogOpen(false)
  }

  function handleDelete(id: number) {
    setDonors((prev) => prev.filter((d) => d.id !== id))
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
                        {t}
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
                          {donor.type}
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
                {donations.map((donation) => (
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
                        {donation.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate text-zinc-600">
                      {donation.description}
                    </TableCell>
                    <TableCell className="text-right font-medium text-zinc-900">
                      {formatPHP(donation.amount)}
                    </TableCell>
                  </TableRow>
                ))}
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
                        {t}
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
                        {c}
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
              className="bg-violet-700 hover:bg-violet-800"
            >
              {editingId ? 'Save Changes' : 'Add Supporter'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
