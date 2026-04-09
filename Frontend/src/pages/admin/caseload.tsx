import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Users,
  ShieldAlert,
  Loader2,
  ChevronDown,
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import { TablePagination } from '@/components/TablePagination'
import { usePageTitle } from '@/hooks/usePageTitle'

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
  caseControlNo: string
  safehouseId: number
  safehouse: string
  riskLevel: RiskLevel
  caseStatus: CaseStatus
  caseCategory: string
  reintegrationStatus: ReintegrationStatus
  dateOfBirth: string
  assignedSocialWorker: string
  hasSpecialNeeds: boolean
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RISK_LEVELS: RiskLevel[] = ['Critical', 'High', 'Medium', 'Low']
const CASE_STATUSES: CaseStatus[] = ['Active', 'Closed', 'Pending Review']
const CASE_CATEGORIES = ['Abandoned', 'Foundling', 'Surrendered', 'Neglected']
const REINTEGRATION_STATUSES: ReintegrationStatus[] = [
  'Not Started',
  'In Progress',
  'Family Reunification',
  'Independent Living',
  'Completed',
]
const REINTEGRATION_TYPES = ['Family Reunification', 'Foster Care', 'Adoption (Domestic)', 'Adoption (Inter-Country)', 'Independent Living']
const REFERRAL_SOURCES = ['Government Agency', 'NGO', 'Police', 'Self-Referral', 'Community', 'Court Order']
const RELIGIONS = ['Roman Catholic', 'Islam', 'Protestant', 'INC', 'Iglesia ni Cristo', 'Other']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function riskBadgeClass(level: RiskLevel) {
  switch (level) {
    case 'Critical':
      return 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400'
    case 'High':
      return 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-400'
    case 'Medium':
      return 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400'
    case 'Low':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
  }
}

function formatMlRiskBadge(score: number, label: string) {
  return `${(score * 100).toFixed(0)}% - ${label}`
}

function statusBadgeClass(status: CaseStatus) {
  switch (status) {
    case 'Active':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
    case 'Closed':
      return 'border-border bg-muted text-muted-foreground'
    case 'Pending Review':
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400'
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
  // Demographics
  sex: 'F',
  religion: '',
  dateOfAdmission: '',
  // Sub-categories
  subcatTrafficked: false,
  subcatPhysicalAbuse: false,
  subcatSexualAbuse: false,
  subcatOrphaned: false,
  subcatChildLabor: false,
  subcatOsaec: false,
  subcatCicl: false,
  subcatAtRisk: false,
  subcatStreetChild: false,
  subcatChildWithHiv: false,
  // Disability
  isPwd: false,
  pwdType: '',
  hasSpecialNeeds: false,
  specialNeedsDiagnosis: '',
  // Family profile
  familyIs4ps: false,
  familySoloParent: false,
  familyIndigenous: false,
  familyParentPwd: false,
  familyInformalSettler: false,
  // Referral & Assignment
  referralSource: '',
  referringAgencyPerson: '',
  assignedSocialWorker: '',
  initialRiskLevel: '' as string,
  initialCaseAssessment: '',
  // Reintegration
  reintegrationType: '',
  reintegrationStatus: '' as string,
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CaseloadInventory() {
  usePageTitle('Caseload')
  const [searchParams] = useSearchParams()

  // Read initial filter values from URL params
  const initialFilters = useMemo(() => ({
    risk: searchParams.get('risk') || 'all',
    status: searchParams.get('status') || 'all',
    reintegration: searchParams.get('reintegration') || 'all',
  }), []) // eslint-disable-line react-hooks/exhaustive-deps

  const [residents, setResidents] = useState<Resident[]>([])
  const [safehouses, setSafehouses] = useState<ApiSafehouse[]>([])
  const [mlRiskMap, setMlRiskMap] = useState<Map<number, { score: number; label: string }>>(new Map())
  const [mlRiskStatus, setMlRiskStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [filterSafehouse, setFilterSafehouse] = useState<string[]>([])
  const [filterRisk, setFilterRisk] = useState<string[]>(initialFilters.risk !== 'all' ? [initialFilters.risk] : [])
  const [filterStatus, setFilterStatus] = useState<string[]>(initialFilters.status !== 'all' ? [initialFilters.status] : [])
  const [filterCategory, setFilterCategory] = useState<string[]>([])
  const [safehouseFilterOpen, setSafehouseFilterOpen] = useState(false)
  const [riskFilterOpen, setRiskFilterOpen] = useState(false)
  const [statusFilterOpen, setStatusFilterOpen] = useState(false)
  const [categoryFilterOpen, setCategoryFilterOpen] = useState(false)
  const [draftFilterSafehouse, setDraftFilterSafehouse] = useState<string[]>([])
  const [draftFilterRisk, setDraftFilterRisk] = useState<string[]>([])
  const [draftFilterStatus, setDraftFilterStatus] = useState<string[]>([])
  const [draftFilterCategory, setDraftFilterCategory] = useState<string[]>([])

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  const [viewingResident, setViewingResident] = useState<Resident | null>(null)
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

      setResidents(
        apiResidents.map((r) => ({
          id: r.residentId,
          name: r.internalCode || r.caseControlNo || `Resident ${r.residentId}`,
          caseControlNo: r.caseControlNo,
          safehouseId: r.safehouseId,
          safehouse: `Safehouse ${r.safehouseId}`,
          riskLevel: (r.currentRiskLevel as RiskLevel) || 'Low',
          caseStatus: (r.caseStatus as CaseStatus) || 'Active',
          caseCategory: r.caseCategory ?? '',
          reintegrationStatus: (r.reintegrationStatus as ReintegrationStatus) || 'Not Started',
          dateOfBirth: r.dateOfBirth ?? '',
          assignedSocialWorker: r.assignedSocialWorker ?? '',
          hasSpecialNeeds: r.hasSpecialNeeds ?? false,
        })),
      )

      // Fetch ML risk predictions in background so main grid is interactive sooner.
      void (async () => {
        try {
          const mlResults = await api.get<MlRiskResult[]>('/api/pipeline-results/resident-risk')
          const riskMap = new Map<number, { score: number; label: string }>()
          for (const r of mlResults) {
            riskMap.set(r.entityId, { score: r.score, label: r.label })
          }
          setMlRiskMap(riskMap)
          setMlRiskStatus('ready')
        } catch {
          setMlRiskStatus('unavailable')
          console.warn('ML pipeline data unavailable')
        }
      })()
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
      filterSafehouse.length === 0 || filterSafehouse.includes(r.safehouse)
    const matchesRisk =
      filterRisk.length === 0
        ? true
        : filterRisk.some((selectedRisk) =>
          selectedRisk === 'at-risk'
            ? r.riskLevel === 'Critical' || r.riskLevel === 'High'
            : r.riskLevel === selectedRisk
        )
    const matchesStatus =
      filterStatus.length === 0 || filterStatus.includes(r.caseStatus)
    const matchesCategory =
      filterCategory.length === 0 || filterCategory.includes(r.caseCategory)
    return matchesSearch && matchesSafehouse && matchesRisk && matchesStatus && matchesCategory
  })

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1) }, [search, filterSafehouse, filterRisk, filterStatus, filterCategory])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedResidents = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  function toggleSelection<T extends string>(
    list: T[],
    value: T,
    setList: (value: T[] | ((prev: T[]) => T[])) => void,
  ) {
    setList((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value],
    )
  }

  function formatFilterLabel(base: string, selectedValues: string[], formatter?: (value: string) => string): string {
    if (selectedValues.length === 0) return `All ${base}`
    if (selectedValues.length === 1) {
      const value = selectedValues[0]
      return formatter ? formatter(value) : value
    }
    return `${base} (${selectedValues.length})`
  }

  function handleSafehouseFilterOpenChange(open: boolean) {
    if (open) {
      setDraftFilterSafehouse(filterSafehouse)
      setSafehouseFilterOpen(true)
      return
    }
    setFilterSafehouse(draftFilterSafehouse)
    setSafehouseFilterOpen(false)
  }

  function handleRiskFilterOpenChange(open: boolean) {
    if (open) {
      setDraftFilterRisk(filterRisk)
      setRiskFilterOpen(true)
      return
    }
    setFilterRisk(draftFilterRisk)
    setRiskFilterOpen(false)
  }

  function handleStatusFilterOpenChange(open: boolean) {
    if (open) {
      setDraftFilterStatus(filterStatus)
      setStatusFilterOpen(true)
      return
    }
    setFilterStatus(draftFilterStatus)
    setStatusFilterOpen(false)
  }

  function handleCategoryFilterOpenChange(open: boolean) {
    if (open) {
      setDraftFilterCategory(filterCategory)
      setCategoryFilterOpen(true)
      return
    }
    setFilterCategory(draftFilterCategory)
    setCategoryFilterOpen(false)
  }

  // --- Dialog helpers ---
  function openAdd() {
    setEditingId(null)
    setForm(blankForm)
    setDialogOpen(true)
  }

  async function openEdit(r: Resident) {
    setEditingId(r.id)
    // Fetch full resident data for all fields
    try {
      const full = await api.get<ApiResident>(`/api/residents/${r.id}`)
      setForm({
        caseControlNo: (full.caseControlNo as string) ?? '',
        internalCode: (full.internalCode as string) ?? r.name,
        dateOfBirth: full.dateOfBirth ? String(full.dateOfBirth).split('T')[0] : '',
        safehouseId: String(full.safehouseId ?? r.safehouseId),
        riskLevel: (full.currentRiskLevel as string) ?? r.riskLevel,
        caseStatus: (full.caseStatus as string) ?? r.caseStatus,
        caseCategory: (full.caseCategory as string) ?? r.caseCategory,
        sex: (full.sex as string) ?? 'F',
        religion: (full.religion as string) ?? '',
        dateOfAdmission: full.dateOfAdmission ? String(full.dateOfAdmission).split('T')[0] : '',
        subcatTrafficked: (full.subCatTrafficked as boolean) ?? false,
        subcatPhysicalAbuse: (full.subCatPhysicalAbuse as boolean) ?? false,
        subcatSexualAbuse: (full.subCatSexualAbuse as boolean) ?? false,
        subcatOrphaned: (full.subCatOrphaned as boolean) ?? false,
        subcatChildLabor: (full.subCatChildLabor as boolean) ?? false,
        subcatOsaec: (full.subCatOsaec as boolean) ?? false,
        subcatCicl: (full.subCatCicl as boolean) ?? false,
        subcatAtRisk: (full.subCatAtRisk as boolean) ?? false,
        subcatStreetChild: (full.subCatStreetChild as boolean) ?? false,
        subcatChildWithHiv: (full.subCatChildWithHiv as boolean) ?? false,
        isPwd: (full.isPwd as boolean) ?? false,
        pwdType: (full.pwdType as string) ?? '',
        hasSpecialNeeds: (full.hasSpecialNeeds as boolean) ?? false,
        specialNeedsDiagnosis: (full.specialNeedsDiagnosis as string) ?? '',
        familyIs4ps: (full.familyIs4ps as boolean) ?? false,
        familySoloParent: (full.familySoloParent as boolean) ?? false,
        familyIndigenous: (full.familyIndigenous as boolean) ?? false,
        familyParentPwd: (full.familyParentPwd as boolean) ?? false,
        familyInformalSettler: (full.familyInformalSettler as boolean) ?? false,
        referralSource: (full.referralSource as string) ?? '',
        referringAgencyPerson: (full.referringAgencyPerson as string) ?? '',
        assignedSocialWorker: (full.assignedSocialWorker as string) ?? '',
        initialRiskLevel: (full.initialRiskLevel as string) ?? '',
        initialCaseAssessment: (full.initialCaseAssessment as string) ?? '',
        reintegrationType: (full.reintegrationType as string) ?? '',
        reintegrationStatus: (full.reintegrationStatus as string) ?? '',
      })
    } catch {
      // Fallback to basic data if full fetch fails
      setForm({
        ...blankForm,
        internalCode: r.name,
        safehouseId: String(r.safehouseId),
        riskLevel: r.riskLevel,
        caseStatus: r.caseStatus,
        caseCategory: r.caseCategory,
      })
    }
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.internalCode?.trim()) { alert('Internal Code is required.'); return }
    if (!form.safehouseId) { alert('Safehouse is required.'); return }
    if (!form.caseStatus) { alert('Case Status is required.'); return }

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
        sex: form.sex || 'F',
        religion: form.religion || undefined,
        dateOfAdmission: form.dateOfAdmission || undefined,
        subCatTrafficked: form.subcatTrafficked,
        subCatPhysicalAbuse: form.subcatPhysicalAbuse,
        subCatSexualAbuse: form.subcatSexualAbuse,
        subCatOrphaned: form.subcatOrphaned,
        subCatChildLabor: form.subcatChildLabor,
        subCatOsaec: form.subcatOsaec,
        subCatCicl: form.subcatCicl,
        subCatAtRisk: form.subcatAtRisk,
        subCatStreetChild: form.subcatStreetChild,
        subCatChildWithHiv: form.subcatChildWithHiv,
        isPwd: form.isPwd,
        pwdType: form.pwdType || undefined,
        hasSpecialNeeds: form.hasSpecialNeeds,
        specialNeedsDiagnosis: form.specialNeedsDiagnosis || undefined,
        familyIs4ps: form.familyIs4ps,
        familySoloParent: form.familySoloParent,
        familyIndigenous: form.familyIndigenous,
        familyParentPwd: form.familyParentPwd,
        familyInformalSettler: form.familyInformalSettler,
        referralSource: form.referralSource || undefined,
        referringAgencyPerson: form.referringAgencyPerson || undefined,
        assignedSocialWorker: form.assignedSocialWorker || undefined,
        initialRiskLevel: form.initialRiskLevel || undefined,
        initialCaseAssessment: form.initialCaseAssessment || undefined,
        reintegrationType: form.reintegrationType || undefined,
        reintegrationStatus: form.reintegrationStatus || undefined,
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Caseload Inventory
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
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

          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
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

              {/* Demographics */}
              <Collapsible>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted">
                  Demographics
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Sex</Label>
                      <Select value={form.sex} onValueChange={(v) => setForm({ ...form, sex: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="F">Female</SelectItem>
                          <SelectItem value="M">Male</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Religion</Label>
                      <Select value={form.religion} onValueChange={(v) => setForm({ ...form, religion: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {RELIGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date of Admission</Label>
                      <Input type="date" value={form.dateOfAdmission} onChange={(e) => setForm({ ...form, dateOfAdmission: e.target.value })} />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Case Sub-Categories */}
              <Collapsible>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted">
                  Case Sub-Categories
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      ['subcatTrafficked', 'Trafficked'],
                      ['subcatPhysicalAbuse', 'Physical Abuse'],
                      ['subcatSexualAbuse', 'Sexual Abuse'],
                      ['subcatOrphaned', 'Orphaned'],
                      ['subcatChildLabor', 'Child Labor'],
                      ['subcatOsaec', 'OSAEC/CSAEM'],
                      ['subcatCicl', 'Conflict with Law (CICL)'],
                      ['subcatAtRisk', 'Child at Risk (CAR)'],
                      ['subcatStreetChild', 'Street Child'],
                      ['subcatChildWithHiv', 'Child with HIV'],
                    ] as const).map(([key, label]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Checkbox
                          id={key}
                          checked={form[key]}
                          onCheckedChange={(v) => setForm({ ...form, [key]: !!v })}
                        />
                        <Label htmlFor={key} className="text-sm font-normal">{label}</Label>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Disability & Special Needs */}
              <Collapsible>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted">
                  Disability & Special Needs
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox id="isPwd" checked={form.isPwd} onCheckedChange={(v) => setForm({ ...form, isPwd: !!v })} />
                    <Label htmlFor="isPwd" className="text-sm font-normal">Person with Disability (PWD)</Label>
                  </div>
                  {form.isPwd && (
                    <div className="space-y-2 pl-6">
                      <Label>Disability Type</Label>
                      <Input value={form.pwdType} onChange={(e) => setForm({ ...form, pwdType: e.target.value })} placeholder="e.g., Visual, Physical, Intellectual" />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Checkbox id="hasSpecialNeeds" checked={form.hasSpecialNeeds} onCheckedChange={(v) => setForm({ ...form, hasSpecialNeeds: !!v })} />
                    <Label htmlFor="hasSpecialNeeds" className="text-sm font-normal">Has Special Needs</Label>
                  </div>
                  {form.hasSpecialNeeds && (
                    <div className="space-y-2 pl-6">
                      <Label>Diagnosis</Label>
                      <Input value={form.specialNeedsDiagnosis} onChange={(e) => setForm({ ...form, specialNeedsDiagnosis: e.target.value })} placeholder="Diagnosis details" />
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Family Profile */}
              <Collapsible>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted">
                  Family Socio-Demographic Profile
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      ['familyIs4ps', '4Ps Beneficiary'],
                      ['familySoloParent', 'Solo Parent'],
                      ['familyIndigenous', 'Indigenous Group'],
                      ['familyParentPwd', 'Parent is PWD'],
                      ['familyInformalSettler', 'Informal Settler / Homeless'],
                    ] as const).map(([key, label]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Checkbox
                          id={key}
                          checked={form[key]}
                          onCheckedChange={(v) => setForm({ ...form, [key]: !!v })}
                        />
                        <Label htmlFor={key} className="text-sm font-normal">{label}</Label>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Referral & Assignment */}
              <Collapsible>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted">
                  Referral & Assignment
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Referral Source</Label>
                      <Select value={form.referralSource} onValueChange={(v) => setForm({ ...form, referralSource: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {REFERRAL_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Referring Agency/Person</Label>
                      <Input value={form.referringAgencyPerson} onChange={(e) => setForm({ ...form, referringAgencyPerson: e.target.value })} placeholder="Name of agency or person" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Assigned Social Worker</Label>
                      <Input value={form.assignedSocialWorker} onChange={(e) => setForm({ ...form, assignedSocialWorker: e.target.value })} placeholder="Social worker name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Initial Risk Level</Label>
                      <Select value={form.initialRiskLevel} onValueChange={(v) => setForm({ ...form, initialRiskLevel: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {RISK_LEVELS.map((rl) => <SelectItem key={rl} value={rl}>{rl}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Initial Case Assessment</Label>
                    <Textarea rows={2} value={form.initialCaseAssessment} onChange={(e) => setForm({ ...form, initialCaseAssessment: e.target.value })} placeholder="e.g., For Reunification, For Foster Care" />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Reintegration */}
              <Collapsible>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted">
                  Reintegration
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Reintegration Type</Label>
                      <Select value={form.reintegrationType} onValueChange={(v) => setForm({ ...form, reintegrationType: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {REINTEGRATION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Reintegration Status</Label>
                      <Select value={form.reintegrationStatus} onValueChange={(v) => setForm({ ...form, reintegrationStatus: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {REINTEGRATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
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
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Residents
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {residents.length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Cases
            </CardTitle>
            <Users className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {activeCount}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Critical Risk
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {criticalCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search residents..."
                aria-label="Search residents"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <DropdownMenu open={safehouseFilterOpen} onOpenChange={handleSafehouseFilterOpenChange}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[170px] max-w-[280px] justify-between gap-2 font-normal">
                  <span className="truncate">{formatFilterLabel('Safehouses', filterSafehouse)}</span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[240px]">
                <DropdownMenuLabel>Safehouses</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {safehouses.map((s) => (
                  <DropdownMenuCheckboxItem
                    key={s.safehouseId}
                    checked={draftFilterSafehouse.includes(`Safehouse ${s.safehouseId}`)}
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={() => toggleSelection(draftFilterSafehouse, `Safehouse ${s.safehouseId}`, setDraftFilterSafehouse)}
                  >
                    Safehouse {s.safehouseId}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <div className="p-1">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setFilterSafehouse(draftFilterSafehouse)
                      setSafehouseFilterOpen(false)
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu open={riskFilterOpen} onOpenChange={handleRiskFilterOpenChange}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[180px] max-w-[300px] justify-between gap-2 font-normal">
                  <span className="truncate">{formatFilterLabel('Risk Levels', filterRisk, (value) => value === 'at-risk' ? 'At Risk (Critical + High)' : value)}</span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[240px]">
                <DropdownMenuLabel>Risk Levels</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={draftFilterRisk.includes('at-risk')}
                  onSelect={(e) => e.preventDefault()}
                  onCheckedChange={() => toggleSelection(draftFilterRisk, 'at-risk', setDraftFilterRisk)}
                >
                  At Risk (Critical + High)
                </DropdownMenuCheckboxItem>
                {RISK_LEVELS.map((rl) => (
                  <DropdownMenuCheckboxItem
                    key={rl}
                    checked={draftFilterRisk.includes(rl)}
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={() => toggleSelection(draftFilterRisk, rl, setDraftFilterRisk)}
                  >
                    {rl}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <div className="p-1">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setFilterRisk(draftFilterRisk)
                      setRiskFilterOpen(false)
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu open={statusFilterOpen} onOpenChange={handleStatusFilterOpenChange}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[170px] max-w-[240px] justify-between gap-2 font-normal">
                  <span className="truncate">{formatFilterLabel('Statuses', filterStatus)}</span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[220px]">
                <DropdownMenuLabel>Statuses</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {CASE_STATUSES.map((cs) => (
                  <DropdownMenuCheckboxItem
                    key={cs}
                    checked={draftFilterStatus.includes(cs)}
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={() => toggleSelection(draftFilterStatus, cs, setDraftFilterStatus)}
                  >
                    {cs}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <div className="p-1">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setFilterStatus(draftFilterStatus)
                      setStatusFilterOpen(false)
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu open={categoryFilterOpen} onOpenChange={handleCategoryFilterOpenChange}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[170px] max-w-[260px] justify-between gap-2 font-normal">
                  <span className="truncate">{formatFilterLabel('Categories', filterCategory)}</span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[220px]">
                <DropdownMenuLabel>Categories</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {CASE_CATEGORIES.map((cc) => (
                  <DropdownMenuCheckboxItem
                    key={cc}
                    checked={draftFilterCategory.includes(cc)}
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={() => toggleSelection(draftFilterCategory, cc, setDraftFilterCategory)}
                  >
                    {cc}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <div className="p-1">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setFilterCategory(draftFilterCategory)
                      setCategoryFilterOpen(false)
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
      </div>
      {mlRiskStatus === 'unavailable' && (
        <p className="text-xs text-muted-foreground">
          ML risk scores are unavailable right now. Showing DB risk levels (no percentage).
        </p>
      )}

      {/* Table */}
      <Card className="border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Safehouse</TableHead>
              <TableHead className="text-muted-foreground">Risk Level</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Reintegration</TableHead>
              <TableHead className="text-right text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedResidents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No residents found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedResidents.map((r) => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-muted" onClick={() => setViewingResident(r)}>
                  <TableCell className="font-medium text-foreground">
                    {r.name}
                  </TableCell>
                  <TableCell>{r.safehouse}</TableCell>
                  <TableCell>
                    {mlRiskMap.has(r.id) ? (
                      <Badge
                        variant="outline"
                        className={riskBadgeClass(mlRiskMap.get(r.id)!.label as RiskLevel)}
                      >
                        {formatMlRiskBadge(mlRiskMap.get(r.id)!.score, mlRiskMap.get(r.id)!.label)}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className={riskBadgeClass(r.riskLevel)}
                      >
                        {r.riskLevel}
                      </Badge>
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
                  <TableCell className="text-muted-foreground">
                    {r.reintegrationStatus}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={(e) => { e.stopPropagation(); openEdit(r) }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-600 dark:text-red-400"
                            onClick={(e) => e.stopPropagation()}
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
      <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* Resident Detail Dialog */}
      <Dialog open={!!viewingResident} onOpenChange={(open) => { if (!open) setViewingResident(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{viewingResident?.name}</DialogTitle>
            <DialogDescription>Resident details</DialogDescription>
          </DialogHeader>
          {viewingResident && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 py-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Case Control No.</p>
                <p className="font-medium text-foreground">{viewingResident.caseControlNo || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Safehouse</p>
                <p className="font-medium text-foreground">{viewingResident.safehouse}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Risk Level</p>
                {mlRiskMap.has(viewingResident.id) ? (
                  <Badge variant="outline" className={riskBadgeClass(mlRiskMap.get(viewingResident.id)!.label as RiskLevel)}>
                    {formatMlRiskBadge(mlRiskMap.get(viewingResident.id)!.score, mlRiskMap.get(viewingResident.id)!.label)}
                  </Badge>
                ) : (
                  <Badge variant="outline" className={riskBadgeClass(viewingResident.riskLevel)}>
                    {viewingResident.riskLevel}
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Status</p>
                <Badge variant="outline" className={statusBadgeClass(viewingResident.caseStatus)}>
                  {viewingResident.caseStatus}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Case Category</p>
                <p className="font-medium text-foreground">{viewingResident.caseCategory || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Reintegration</p>
                <p className="font-medium text-foreground">{viewingResident.reintegrationStatus}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Date of Birth</p>
                <p className="font-medium text-foreground">
                  {viewingResident.dateOfBirth
                    ? new Date(viewingResident.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Social Worker</p>
                <p className="font-medium text-foreground">{viewingResident.assignedSocialWorker || '—'}</p>
              </div>
              {viewingResident.hasSpecialNeeds && (
                <div className="col-span-2">
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">Special Needs</Badge>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setViewingResident(null)}>Close</Button>
            <Button
              className="bg-violet-700 hover:bg-violet-800"
              onClick={() => {
                const resident = viewingResident
                setViewingResident(null)
                if (resident) openEdit(resident)
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
