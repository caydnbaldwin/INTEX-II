import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Users,
  ShieldAlert,
  Loader2,
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
import { api } from '@/lib/api'

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

/** Shape returned by the API */
interface ApiResident {
  residentId: number
  caseControlNo: string
  internalCode: string
  safehouseId: number
  caseStatus: string
  dateOfBirth: string
  caseCategory: string
  initialRiskLevel: string
  currentRiskLevel: string
  reintegrationType: string
  reintegrationStatus: string
  assignedSocialWorker: string
  hasSpecialNeeds: boolean
  [key: string]: unknown
}

interface ApiSafehouse {
  safehouseId: number
  name: string
  region: string
  [key: string]: unknown
}

interface MlRiskResult {
  pipelineResultId: number
  entityId: number
  score: number
  label: string
  detailsJson: string
  resident: {
    caseControlNo: string
    internalCode: string
    safehouseId: number
    caseStatus: string
    currentRiskLevel: string
    initialRiskLevel: string
  }
}

/** Local display model */
interface Resident {
  id: number
  name: string
  safehouseId: number
  safehouse: string
  riskLevel: RiskLevel
  caseStatus: CaseStatus
  caseCategory: string
  reintegrationStatus: ReintegrationStatus
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RISK_LEVELS: RiskLevel[] = ['Critical', 'High', 'Medium', 'Low']
const CASE_STATUSES: CaseStatus[] = ['Active', 'Closed', 'Pending Review']
const CASE_CATEGORIES = ['Trafficking', 'Abuse', 'Neglect', 'Abandonment']
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
  caseControlNo: '',
  internalCode: '',
  dateOfBirth: '',
  safehouseId: '',
  riskLevel: '' as string,
  caseStatus: '' as string,
  caseCategory: '',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CaseloadInventory() {
  const [residents, setResidents] = useState<Resident[]>([])
  const [safehouses, setSafehouses] = useState<ApiSafehouse[]>([])
  const [mlRiskMap, setMlRiskMap] = useState<Map<number, { score: number; label: string }>>(new Map())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [filterSafehouse, setFilterSafehouse] = useState('all')
  const [filterRisk, setFilterRisk] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(blankForm)

  // --- Data fetching ---
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [apiResidents, apiSafehouses] = await Promise.all([
        api.get<ApiResident[]>('/api/residents'),
        api.get<ApiSafehouse[]>('/api/safehouses'),
      ])

      setSafehouses(apiSafehouses)

      const safehouseMap = new Map(
        apiSafehouses.map((s) => [s.safehouseId, s.name]),
      )

      setResidents(
        apiResidents.map((r) => ({
          id: r.residentId,
          name: r.internalCode || r.caseControlNo || `Resident ${r.residentId}`,
          safehouseId: r.safehouseId,
          safehouse: safehouseMap.get(r.safehouseId) ?? `Safehouse ${r.safehouseId}`,
          riskLevel: (r.currentRiskLevel as RiskLevel) || 'Low',
          caseStatus: (r.caseStatus as CaseStatus) || 'Active',
          caseCategory: r.caseCategory ?? '',
          reintegrationStatus: (r.reintegrationStatus as ReintegrationStatus) || 'Not Started',
        })),
      )

      // Fetch ML risk predictions (non-blocking)
      try {
        const mlResults = await api.get<MlRiskResult[]>('/api/pipeline-results/resident-risk')
        const riskMap = new Map<number, { score: number; label: string }>()
        for (const r of mlResults) {
          riskMap.set(r.entityId, { score: r.score, label: r.label })
        }
        setMlRiskMap(riskMap)
      } catch {
        console.warn('ML pipeline data unavailable')
      }
    } catch (err) {
      console.error('Failed to load caseload data', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // --- Filtering ---
  const filtered = residents.filter((r) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      r.name.toLowerCase().includes(q) ||
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
      caseControlNo: '',
      internalCode: r.name,
      dateOfBirth: '',
      safehouseId: String(r.safehouseId),
      riskLevel: r.riskLevel,
      caseStatus: r.caseStatus,
      caseCategory: r.caseCategory,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        internalCode: form.internalCode,
        caseControlNo: form.caseControlNo,
        dateOfBirth: form.dateOfBirth || undefined,
        safehouseId: Number(form.safehouseId) || undefined,
        currentRiskLevel: form.riskLevel || 'Low',
        caseStatus: form.caseStatus || 'Active',
        caseCategory: form.caseCategory,
      }

      if (editingId) {
        await api.put(`/api/residents/${editingId}`, payload)
      } else {
        await api.post('/api/residents', payload)
      }

      setDialogOpen(false)
      await fetchData()
    } catch (err) {
      console.error('Failed to save resident', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/api/residents/${id}`)
      await fetchData()
    } catch (err) {
      console.error('Failed to delete resident', err)
    }
  }

  // --- Summary counts ---
  const activeCount = residents.filter((r) => r.caseStatus === 'Active').length
  const criticalCount = residents.filter(
    (r) => r.riskLevel === 'Critical',
  ).length

  // --- Loading state ---
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-700" />
      </div>
    )
  }

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
                  <Label htmlFor="internalCode">Internal Code</Label>
                  <Input
                    id="internalCode"
                    value={form.internalCode}
                    onChange={(e) =>
                      setForm({ ...form, internalCode: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="caseControlNo">Case Control No.</Label>
                  <Input
                    id="caseControlNo"
                    value={form.caseControlNo}
                    onChange={(e) =>
                      setForm({ ...form, caseControlNo: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) =>
                      setForm({ ...form, dateOfBirth: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Safehouse</Label>
                  <Select
                    value={form.safehouseId}
                    onValueChange={(v) => setForm({ ...form, safehouseId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select safehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {safehouses.map((s) => (
                        <SelectItem key={s.safehouseId} value={String(s.safehouseId)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                disabled={saving}
                className="bg-violet-700 hover:bg-violet-800"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                {safehouses.map((s) => (
                  <SelectItem key={s.safehouseId} value={s.name}>
                    {s.name}
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
              <TableHead className="text-zinc-500">Safehouse</TableHead>
              <TableHead className="text-zinc-500">Risk Level</TableHead>
              <TableHead className="text-zinc-500">ML Risk</TableHead>
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
                    {r.name}
                  </TableCell>
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
                    {mlRiskMap.has(r.id) ? (
                      <Badge
                        variant="outline"
                        className={
                          mlRiskMap.get(r.id)!.label === 'Critical'
                            ? 'border-red-300 bg-red-50 text-red-700'
                            : mlRiskMap.get(r.id)!.label === 'High'
                              ? 'border-orange-300 bg-orange-50 text-orange-700'
                              : mlRiskMap.get(r.id)!.label === 'Medium'
                                ? 'border-yellow-300 bg-yellow-50 text-yellow-700'
                                : 'border-green-300 bg-green-50 text-green-700'
                        }
                      >
                        {mlRiskMap.get(r.id)!.label} {(mlRiskMap.get(r.id)!.score * 100).toFixed(0)}%
                      </Badge>
                    ) : (
                      <span className="text-xs text-zinc-400">--</span>
                    )}
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
                                {r.name}
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
