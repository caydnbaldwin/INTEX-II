import { useState } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Users,
  ShieldAlert,
} from 'lucide-react'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Dialog,
  DialogTrigger,
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
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low'
type CaseStatus = 'Active' | 'Closed' | 'Pending Review'
type ReintegrationStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Family Reunification'
  | 'Independent Living'
  | 'Completed'

interface Resident {
  id: number
  firstName: string
  lastName: string
  age: number
  gender: string
  safehouse: string
  riskLevel: RiskLevel
  caseStatus: CaseStatus
  caseCategory: string
  reintegrationStatus: ReintegrationStatus
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const initialResidents: Resident[] = [
  {
    id: 1,
    firstName: 'Maria',
    lastName: 'Santos',
    age: 14,
    gender: 'Female',
    safehouse: 'Haven A',
    riskLevel: 'Critical',
    caseStatus: 'Active',
    caseCategory: 'Trafficking',
    reintegrationStatus: 'Not Started',
  },
  {
    id: 2,
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    age: 12,
    gender: 'Male',
    safehouse: 'Haven B',
    riskLevel: 'High',
    caseStatus: 'Active',
    caseCategory: 'Abuse',
    reintegrationStatus: 'In Progress',
  },
  {
    id: 3,
    firstName: 'Ana',
    lastName: 'Reyes',
    age: 16,
    gender: 'Female',
    safehouse: 'Haven A',
    riskLevel: 'Medium',
    caseStatus: 'Active',
    caseCategory: 'Neglect',
    reintegrationStatus: 'Family Reunification',
  },
  {
    id: 4,
    firstName: 'Carlo',
    lastName: 'Bautista',
    age: 10,
    gender: 'Male',
    safehouse: 'Haven C',
    riskLevel: 'Low',
    caseStatus: 'Pending Review',
    caseCategory: 'Abandonment',
    reintegrationStatus: 'Not Started',
  },
  {
    id: 5,
    firstName: 'Liza',
    lastName: 'Manalo',
    age: 15,
    gender: 'Female',
    safehouse: 'Haven B',
    riskLevel: 'High',
    caseStatus: 'Active',
    caseCategory: 'Trafficking',
    reintegrationStatus: 'In Progress',
  },
  {
    id: 6,
    firstName: 'Miguel',
    lastName: 'Aquino',
    age: 11,
    gender: 'Male',
    safehouse: 'Haven A',
    riskLevel: 'Medium',
    caseStatus: 'Active',
    caseCategory: 'Abuse',
    reintegrationStatus: 'Not Started',
  },
  {
    id: 7,
    firstName: 'Rosa',
    lastName: 'Villanueva',
    age: 13,
    gender: 'Female',
    safehouse: 'Haven C',
    riskLevel: 'Critical',
    caseStatus: 'Active',
    caseCategory: 'Trafficking',
    reintegrationStatus: 'In Progress',
  },
  {
    id: 8,
    firstName: 'Paolo',
    lastName: 'Garcia',
    age: 9,
    gender: 'Male',
    safehouse: 'Haven B',
    riskLevel: 'Low',
    caseStatus: 'Closed',
    caseCategory: 'Neglect',
    reintegrationStatus: 'Completed',
  },
  {
    id: 9,
    firstName: 'Sofia',
    lastName: 'Mendoza',
    age: 17,
    gender: 'Female',
    safehouse: 'Haven A',
    riskLevel: 'Medium',
    caseStatus: 'Pending Review',
    caseCategory: 'Abuse',
    reintegrationStatus: 'Independent Living',
  },
  {
    id: 10,
    firstName: 'Gabriel',
    lastName: 'Ramos',
    age: 14,
    gender: 'Male',
    safehouse: 'Haven C',
    riskLevel: 'High',
    caseStatus: 'Active',
    caseCategory: 'Abandonment',
    reintegrationStatus: 'Family Reunification',
  },
]

const SAFEHOUSES = ['Haven A', 'Haven B', 'Haven C']
const RISK_LEVELS: RiskLevel[] = ['Critical', 'High', 'Medium', 'Low']
const CASE_STATUSES: CaseStatus[] = ['Active', 'Closed', 'Pending Review']
const CASE_CATEGORIES = ['Trafficking', 'Abuse', 'Neglect', 'Abandonment']
const GENDERS = ['Male', 'Female', 'Other']
const _REINTEGRATION_STATUSES: ReintegrationStatus[] = [
  'Not Started',
  'In Progress',
  'Family Reunification',
  'Independent Living',
  'Completed',
]
void _REINTEGRATION_STATUSES

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function riskBadgeVariant(level: RiskLevel) {
  switch (level) {
    case 'Critical':
      return 'destructive' as const
    case 'High':
      return 'outline' as const
    case 'Medium':
      return 'default' as const
    case 'Low':
      return 'secondary' as const
  }
}

function statusBadgeClass(status: CaseStatus) {
  switch (status) {
    case 'Active':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'Closed':
      return 'border-zinc-200 bg-zinc-50 text-zinc-500'
    case 'Pending Review':
      return 'border-amber-200 bg-amber-50 text-amber-700'
  }
}

// ---------------------------------------------------------------------------
// Blank form state
// ---------------------------------------------------------------------------

const blankForm = {
  firstName: '',
  lastName: '',
  age: '',
  gender: '',
  safehouse: '',
  riskLevel: '' as string,
  caseStatus: '' as string,
  caseCategory: '',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CaseloadInventory() {
  const [residents, setResidents] = useState<Resident[]>(initialResidents)
  const [search, setSearch] = useState('')
  const [filterSafehouse, setFilterSafehouse] = useState('all')
  const [filterRisk, setFilterRisk] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(blankForm)

  // --- Filtering ---
  const filtered = residents.filter((r) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) ||
      r.safehouse.toLowerCase().includes(q)
    const matchesSafehouse =
      filterSafehouse === 'all' || r.safehouse === filterSafehouse
    const matchesRisk = filterRisk === 'all' || r.riskLevel === filterRisk
    const matchesStatus =
      filterStatus === 'all' || r.caseStatus === filterStatus
    return matchesSearch && matchesSafehouse && matchesRisk && matchesStatus
  })

  // --- Dialog helpers ---
  function openAdd() {
    setEditingId(null)
    setForm(blankForm)
    setDialogOpen(true)
  }

  function openEdit(r: Resident) {
    setEditingId(r.id)
    setForm({
      firstName: r.firstName,
      lastName: r.lastName,
      age: String(r.age),
      gender: r.gender,
      safehouse: r.safehouse,
      riskLevel: r.riskLevel,
      caseStatus: r.caseStatus,
      caseCategory: r.caseCategory,
    })
    setDialogOpen(true)
  }

  function handleSave() {
    const data: Resident = {
      id: editingId ?? Date.now(),
      firstName: form.firstName,
      lastName: form.lastName,
      age: Number(form.age) || 0,
      gender: form.gender,
      safehouse: form.safehouse,
      riskLevel: (form.riskLevel as RiskLevel) || 'Low',
      caseStatus: (form.caseStatus as CaseStatus) || 'Active',
      caseCategory: form.caseCategory,
      reintegrationStatus: 'Not Started',
    }

    if (editingId) {
      setResidents((prev) =>
        prev.map((r) =>
          r.id === editingId ? { ...r, ...data, reintegrationStatus: r.reintegrationStatus } : r,
        ),
      )
    } else {
      setResidents((prev) => [...prev, data])
    }
    setDialogOpen(false)
  }

  function handleDelete(id: number) {
    setResidents((prev) => prev.filter((r) => r.id !== id))
  }

  // --- Summary counts ---
  const activeCount = residents.filter((r) => r.caseStatus === 'Active').length
  const criticalCount = residents.filter(
    (r) => r.riskLevel === 'Critical',
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Caseload Inventory
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage and track all resident cases across safehouses.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd} className="gap-2 bg-violet-700 hover:bg-violet-800">
              <Plus className="h-4 w-4" />
              Add Resident
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Resident' : 'Add New Resident'}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? 'Update the resident information below.'
                  : 'Fill in the details to register a new resident.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={form.age}
                    onChange={(e) =>
                      setForm({ ...form, age: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={form.gender}
                    onValueChange={(v) => setForm({ ...form, gender: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Safehouse</Label>
                <Select
                  value={form.safehouse}
                  onValueChange={(v) => setForm({ ...form, safehouse: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select safehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {SAFEHOUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Risk Level</Label>
                  <Select
                    value={form.riskLevel}
                    onValueChange={(v) => setForm({ ...form, riskLevel: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {RISK_LEVELS.map((rl) => (
                        <SelectItem key={rl} value={rl}>
                          {rl}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Case Status</Label>
                  <Select
                    value={form.caseStatus}
                    onValueChange={(v) => setForm({ ...form, caseStatus: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {CASE_STATUSES.map((cs) => (
                        <SelectItem key={cs} value={cs}>
                          {cs}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Case Category</Label>
                <Select
                  value={form.caseCategory}
                  onValueChange={(v) => setForm({ ...form, caseCategory: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CASE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-violet-700 hover:bg-violet-800"
              >
                {editingId ? 'Save Changes' : 'Add Resident'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              Total Residents
            </CardTitle>
            <Users className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {residents.length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              Active Cases
            </CardTitle>
            <Users className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {activeCount}
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              Critical Risk
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {criticalCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-zinc-200">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search residents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterSafehouse} onValueChange={setFilterSafehouse}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Safehouse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Safehouses</SelectItem>
                {SAFEHOUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterRisk} onValueChange={setFilterRisk}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                {RISK_LEVELS.map((rl) => (
                  <SelectItem key={rl} value={rl}>
                    {rl}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {CASE_STATUSES.map((cs) => (
                  <SelectItem key={cs} value={cs}>
                    {cs}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-zinc-200">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-zinc-500">Name</TableHead>
              <TableHead className="text-zinc-500">Age</TableHead>
              <TableHead className="text-zinc-500">Safehouse</TableHead>
              <TableHead className="text-zinc-500">Risk Level</TableHead>
              <TableHead className="text-zinc-500">Status</TableHead>
              <TableHead className="text-zinc-500">Reintegration</TableHead>
              <TableHead className="text-right text-zinc-500">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-zinc-400"
                >
                  No residents found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-zinc-900">
                    {r.firstName} {r.lastName}
                  </TableCell>
                  <TableCell>{r.age}</TableCell>
                  <TableCell>{r.safehouse}</TableCell>
                  <TableCell>
                    <Badge
                      variant={riskBadgeVariant(r.riskLevel)}
                      className={
                        r.riskLevel === 'High'
                          ? 'border-red-300 text-red-700'
                          : undefined
                      }
                    >
                      {r.riskLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusBadgeClass(r.caseStatus)}
                    >
                      {r.caseStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-600">
                    {r.reintegrationStatus}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-violet-700"
                        onClick={() => openEdit(r)}
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
                              Remove Resident
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove{' '}
                              <span className="font-semibold">
                                {r.firstName} {r.lastName}
                              </span>{' '}
                              from the caseload? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(r.id)}
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
    </div>
  )
}
