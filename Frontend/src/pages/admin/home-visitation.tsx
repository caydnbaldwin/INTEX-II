import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, MapPin, Calendar, Loader2, Brain, ArrowUp, ArrowDown, CalendarCheck, Search, Pencil, Trash2 } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api, ApiError, getApiErrorMessage } from '@/lib/api'
import { TablePagination } from '@/components/TablePagination'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VisitType =
  | 'Initial Assessment'
  | 'Routine Follow-Up'
  | 'Reintegration Assessment'
  | 'Post-Placement'
  | 'Emergency'

type CooperationLevel =
  | 'Cooperative'
  | 'Partially Cooperative'
  | 'Uncooperative'
  | 'Hostile'

/** Shape returned by the API */
interface ApiHomeVisitation {
  visitationId: number
  residentId: number
  visitDate: string
  socialWorker: string
  visitType: string
  locationVisited: string
  familyMembersPresent: string
  purpose: string
  observations: string
  familyCooperationLevel: string
  safetyConcernsNoted: boolean | null
  followUpNeeded: boolean
  followUpNotes: string
  visitOutcome: string
}

interface ApiResident {
  residentId: number
  caseControlNo: string
  internalCode: string
  [key: string]: unknown
}

/** ML prediction request/response */
interface PredictionRequest {
  residentId: number
  visitType: string
  familyCooperationLevel: string
  safetyConcerns: boolean
}

interface PredictionFactor {
  factor: string
  impact: string
  weight: number
}

interface PredictionResult {
  favorableProbability: number
  riskLabel: string
  confidence: number
  factors: PredictionFactor[]
}

/** Local display model */
interface HomeVisit {
  id: number
  date: string
  residentId: number
  residentName: string
  visitType: VisitType
  location: string
  observations: string
  cooperationLevel: CooperationLevel
  safetyConcerns: boolean
  followUpNeeded: boolean
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VISIT_TYPES: VisitType[] = [
  'Initial Assessment',
  'Routine Follow-Up',
  'Reintegration Assessment',
  'Post-Placement',
  'Emergency',
]

const COOPERATION_LEVELS: CooperationLevel[] = [
  'Cooperative',
  'Partially Cooperative',
  'Uncooperative',
  'Hostile',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cooperationBadgeClass(level: CooperationLevel): string {
  switch (level) {
    case 'Cooperative':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
    case 'Partially Cooperative':
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400'
    case 'Uncooperative':
      return 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-400'
    case 'Hostile':
      return 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400'
  }
}

function visitTypeBadgeClass(type: VisitType): string {
  switch (type) {
    case 'Emergency':
      return 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400'
    case 'Initial Assessment':
      return 'border-violet-200 bg-violet-50 text-primary dark:border-violet-800 dark:bg-violet-950 dark:text-violet-400'
    case 'Reintegration Assessment':
      return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400'
    case 'Post-Placement':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
    case 'Routine Follow-Up':
      return 'border-border bg-muted text-muted-foreground'
  }
}

// ---------------------------------------------------------------------------
// Blank form
// ---------------------------------------------------------------------------

const blankForm = {
  date: '',
  residentId: '',
  visitType: '' as string,
  location: '',
  observations: '',
  cooperationLevel: '' as string,
  safetyConcerns: false,
  followUpNeeded: false,
}

type FormFieldErrors = Partial<Record<'residentId' | 'date' | 'visitType' | 'general', string>>

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HomeVisitation() {
  usePageTitle('Home Visitation')
  const { authSession } = useAuth()
  const isAdmin = authSession.roles.includes('Admin')
  const [visits, setVisits] = useState<HomeVisit[]>([])
  const [residents, setResidents] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const recordsPerPage = 15
  const [upcomingPage, setUpcomingPage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)
  const [activeConferenceTab, setActiveConferenceTab] = useState<'upcoming' | 'history'>('upcoming')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(blankForm)
  const [formErrors, setFormErrors] = useState<FormFieldErrors>({})

  // ML prediction state
  const [predForm, setPredForm] = useState({
    residentId: '',
    visitType: '',
    cooperationLevel: '',
    safetyConcerns: false,
  })
  const [predicting, setPredicting] = useState(false)
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const [conferenceSearch, setConferenceSearch] = useState('')
  const conferenceRecordsRef = useRef<HTMLDivElement | null>(null)

  // --- Data fetching ---
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [apiVisits, apiResidents] = await Promise.all([
        api.get<ApiHomeVisitation[]>('/api/home-visitations'),
        api.get<ApiResident[]>('/api/residents'),
      ])

      const residentList = apiResidents.map((r) => ({
        id: r.residentId,
        name: r.internalCode || r.caseControlNo || `Resident ${r.residentId}`,
      }))
      setResidents(residentList)

      const residentMap = new Map(residentList.map((r) => [r.id, r.name]))

      setVisits(
        apiVisits.map((v) => ({
          id: v.visitationId,
          date: v.visitDate,
          residentId: v.residentId,
          residentName: residentMap.get(v.residentId) ?? `Resident ${v.residentId}`,
          visitType: (v.visitType as VisitType) || 'Routine Follow-Up',
          location: v.locationVisited ?? '',
          observations: v.observations ?? '',
          cooperationLevel: (v.familyCooperationLevel as CooperationLevel) || 'Cooperative',
          safetyConcerns: v.safetyConcernsNoted ?? false,
          followUpNeeded: v.followUpNeeded ?? false,
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      )
    } catch (err) {
      console.error('Failed to load home visitation data', err)
      toast.error(getApiErrorMessage(err, 'Failed to load home visitation data.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Summary counts
  const totalVisits = visits.length
  const followUpsNeeded = visits.filter((v) => v.followUpNeeded).length
  const emergencyCount = visits.filter(
    (v) => v.visitType === 'Emergency',
  ).length
  const today = new Date().toISOString().split('T')[0]
  const normalizedConferenceSearch = conferenceSearch.trim().toLowerCase()
  const filteredUpcomingConferences = visits.filter((v) =>
    v.date >= today
    && (!normalizedConferenceSearch || v.residentName.toLowerCase().includes(normalizedConferenceSearch)),
  )
  const filteredPastConferences = visits.filter((v) =>
    v.date < today
    && (!normalizedConferenceSearch || v.residentName.toLowerCase().includes(normalizedConferenceSearch)),
  )
  const sortByConferenceDateDesc = (a: HomeVisit, b: HomeVisit) => {
    const aTime = new Date(a.date).getTime() || 0
    const bTime = new Date(b.date).getTime() || 0
    return bTime - aTime
  }
  const sortedUpcomingConferences = [...filteredUpcomingConferences].sort(sortByConferenceDateDesc)
  const sortedPastConferences = [...filteredPastConferences].sort(sortByConferenceDateDesc)
  const paginatedUpcomingConferences = sortedUpcomingConferences.slice(
    (upcomingPage - 1) * recordsPerPage,
    upcomingPage * recordsPerPage,
  )
  const paginatedPastConferences = sortedPastConferences.slice(
    (historyPage - 1) * recordsPerPage,
    historyPage * recordsPerPage,
  )

  useEffect(() => {
    setUpcomingPage(1)
    setHistoryPage(1)
  }, [conferenceSearch])

  function toFriendlyApiErrors(err: unknown): string[] {
    if (!(err instanceof ApiError)) return ['Unable to save visit. Please try again.']

    try {
      const parsed = JSON.parse(err.message) as {
        title?: string
        errors?: Record<string, string[]>
      }

      const validationMessages = Object.values(parsed.errors ?? {}).flat()
      if (validationMessages.length === 0) {
        return [parsed.title ?? 'Unable to save visit. Please review the form and try again.']
      }

      return validationMessages.map((msg) => {
        if (msg.includes('safetyConcernsNoted') || msg.includes('System.Nullable`1[System.Boolean]')) {
          return 'Safety Concerns must be selected as Yes or No.'
        }
        if (msg.includes('visitation field is required')) {
          return 'Please complete all required fields before saving.'
        }
        return msg
      })
    } catch {
      return ['Unable to save visit. Please review required fields and try again.']
    }
  }

  function updateFormField<K extends keyof typeof blankForm>(key: K, value: (typeof blankForm)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFormErrors((prev) => {
      if (!prev[key as keyof FormFieldErrors] && !prev.general) return prev
      return { ...prev, [key]: undefined, general: undefined }
    })
  }

  function requiredFieldLabels(): string[] {
    const missing: string[] = []
    if (!form.date) missing.push('Date')
    if (!form.residentId) missing.push('Resident')
    if (!form.visitType) missing.push('Visit Type')
    return missing
  }

  function scrollToConferenceRecords() {
    requestAnimationFrame(() => {
      conferenceRecordsRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  function openEditDialog(visit: HomeVisit) {
    if (!isAdmin) return
    setEditingId(visit.id)
    setForm({
      date: visit.date,
      residentId: String(visit.residentId),
      visitType: visit.visitType,
      location: visit.location,
      observations: visit.observations,
      cooperationLevel: visit.cooperationLevel,
      safetyConcerns: visit.safetyConcerns,
      followUpNeeded: visit.followUpNeeded,
    })
    setFormErrors({})
    setDialogOpen(true)
  }

  async function handleDelete(id: number) {
    if (!isAdmin) return
    try {
      await api.delete(`/api/home-visitations/${id}`)
      await fetchData()
      scrollToConferenceRecords()
    } catch (err) {
      console.error('Failed to delete visit', err)
      toast.error(getApiErrorMessage(err, 'Failed to delete visit.'))
    }
  }

  async function handleSave() {
    const nextErrors: FormFieldErrors = {}
    if (!form.residentId) nextErrors.residentId = 'Resident is required.'
    if (!form.date) nextErrors.date = 'Visit date is required.'
    if (!form.visitType) nextErrors.visitType = 'Visit type is required.'

    if (Object.keys(nextErrors).length > 0) {
      const missingFields = requiredFieldLabels()
      setFormErrors({
        ...nextErrors,
        general: `Cannot save yet. Please complete required fields: ${missingFields.join(', ')}.`,
      })
      toast.error(`Cannot save yet. Please complete required fields: ${missingFields.join(', ')}.`)
      return
    }

    const resident = residents.find((r) => String(r.id) === form.residentId)
    if (!resident) {
      setFormErrors({
        residentId: 'Please select a valid resident.',
        general: 'Cannot save yet. Please complete required fields: Resident.',
      })
      toast.error('Please select a valid resident.')
      return
    }

    if (!isAdmin) return
    setSaving(true)
    try {
      const payload = {
        residentId: resident.id,
        visitDate: form.date,
        visitType: form.visitType || 'Routine Follow-Up',
        locationVisited: form.location,
        observations: form.observations,
        familyCooperationLevel: form.cooperationLevel || 'Cooperative',
        safetyConcernsNoted: form.safetyConcerns,
        followUpNeeded: form.followUpNeeded,
      }

      const wasEditing = editingId !== null
      if (wasEditing) {
        await api.put(`/api/home-visitations/${editingId}`, payload)
      } else {
        await api.post('/api/home-visitations', payload)
      }

      setDialogOpen(false)
      setEditingId(null)
      setForm(blankForm)
      setFormErrors({})
      await fetchData()
      if (wasEditing) {
        scrollToConferenceRecords()
      }
    } catch (err) {
      console.error('Failed to save visit', err)
      const message = toFriendlyApiErrors(err).join(' ')
      setFormErrors({
        general: message,
      })
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  async function handlePredict() {
    if (!predForm.residentId || !predForm.visitType || !predForm.cooperationLevel) return
    setPredicting(true)
    setPrediction(null)
    try {
      const result = await api.post<PredictionResult>('/api/predict/visitation-outcome', {
        residentId: Number(predForm.residentId),
        visitType: predForm.visitType,
        familyCooperationLevel: predForm.cooperationLevel,
        safetyConcerns: predForm.safetyConcerns,
      } satisfies PredictionRequest)
      setPrediction(result)
    } catch (err) {
      console.error('Prediction failed', err)
    } finally {
      setPredicting(false)
    }
  }

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
            Home Visitation & Case Conferences
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Log home visits and track case conference history for residents.
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => {
              setEditingId(null)
              setForm(blankForm)
              setFormErrors({})
              setDialogOpen(true)
            }}
            className="gap-2 bg-violet-700 hover:bg-violet-800"
          >
            <Plus className="h-4 w-4" />
            Log Visit
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Visits
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalVisits}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Follow-ups Needed
            </CardTitle>
            <Calendar className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {followUpsNeeded}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Emergency Visits
            </CardTitle>
            <MapPin className="h-4 w-4 text-red-500 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {emergencyCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ML Predictor resized now that conference summary card is removed */}
      <Card ref={conferenceRecordsRef} className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Pre-Visit Risk Assessment</CardTitle>
          </div>
          <CardDescription>Predict visit outcome before scheduling</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Resident</Label>
                <Select value={predForm.residentId} onValueChange={(v) => setPredForm({ ...predForm, residentId: v })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {residents.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Visit Type</Label>
                <Select value={predForm.visitType} onValueChange={(v) => setPredForm({ ...predForm, visitType: v })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {['Initial Assessment', 'Routine Follow-Up', 'Reintegration Assessment', 'Post-Placement Monitoring', 'Emergency'].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Cooperation Level</Label>
                  <Select value={predForm.cooperationLevel} onValueChange={(v) => setPredForm({ ...predForm, cooperationLevel: v })}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {['Highly Cooperative', 'Cooperative', 'Neutral', 'Uncooperative'].map((cl) => (
                        <SelectItem key={cl} value={cl}>{cl}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Safety Concerns</Label>
                  <div className="flex h-9 items-center gap-2">
                    <Switch
                      checked={predForm.safetyConcerns}
                      onCheckedChange={(checked) => setPredForm({ ...predForm, safetyConcerns: checked })}
                    />
                    <span className="text-sm text-muted-foreground">{predForm.safetyConcerns ? 'Yes' : 'No'}</span>
                  </div>
                </div>
            </div>
            <Button
              onClick={handlePredict}
              disabled={predicting || !predForm.residentId || !predForm.visitType || !predForm.cooperationLevel}
              size="sm"
              className="w-full gap-2 bg-violet-700 hover:bg-violet-800"
            >
              {predicting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              Predict Outcome
            </Button>
            {prediction && (
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-2xl font-bold ${
                      prediction.favorableProbability >= 0.7 ? 'text-emerald-600 dark:text-emerald-400'
                        : prediction.favorableProbability >= 0.4 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {Math.round(prediction.favorableProbability * 100)}%
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      prediction.favorableProbability >= 0.7 ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                        : prediction.favorableProbability >= 0.4 ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400'
                          : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400'
                    }
                  >
                    {prediction.riskLabel}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">Confidence: {Math.round(prediction.confidence * 100)}%</span>
              </div>
            )}
            {prediction && prediction.factors.length > 0 && (
              <div className="space-y-1">
                {prediction.factors.slice(0, 3).map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-xs px-2 py-1">
                    <div className="flex items-center gap-1.5">
                      {f.impact === 'positive' ? <ArrowUp className="h-3 w-3 text-emerald-500 dark:text-emerald-400" /> : <ArrowDown className="h-3 w-3 text-red-500 dark:text-red-400" />}
                      <span className="text-muted-foreground">{f.factor}</span>
                    </div>
                    <span className="text-muted-foreground">{f.weight > 0 ? '+' : ''}{(f.weight * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Case conference records (Donors-style tabs + search) */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarCheck className="h-5 w-5 text-primary" />
            Case Conference Records
          </CardTitle>
          <CardDescription>Search by resident code/name (e.g., LS-0027), then view upcoming or history.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={conferenceSearch}
              onChange={(e) => setConferenceSearch(e.target.value)}
              placeholder="Search resident (e.g., LS-0027)"
              className="pl-9"
            />
          </div>

          <Tabs
            value={activeConferenceTab}
            onValueChange={(value) => setActiveConferenceTab(value as 'upcoming' | 'history')}
            className="space-y-3"
          >
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming Conferences</TabsTrigger>
              <TabsTrigger value="history">Case Conference History</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Resident</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Cooperation</TableHead>
                    <TableHead>Follow-up</TableHead>
                    {isAdmin && <TableHead className="w-16"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUpcomingConferences.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 7 : 6} className="h-20 text-center text-muted-foreground">
                        No upcoming conferences match your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedUpcomingConferences.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell>
                          {new Date(visit.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{visit.residentName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={visitTypeBadgeClass(visit.visitType)}>
                            {visit.visitType}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate text-muted-foreground">
                          {visit.location || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cooperationBadgeClass(visit.cooperationLevel)}>
                            {visit.cooperationLevel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {visit.followUpNeeded ? (
                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-border bg-muted text-muted-foreground">
                              No
                            </Badge>
                          )}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="px-2" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                onClick={() => openEditDialog(visit)}
                                aria-label="Edit visit"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button
                                    className="rounded p-1 text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:text-red-400"
                                    aria-label="Delete visit"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Visit</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently remove this visit record for {visit.residentName}. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(visit.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                currentPage={upcomingPage}
                totalPages={Math.max(1, Math.ceil(filteredUpcomingConferences.length / recordsPerPage))}
                onPageChange={setUpcomingPage}
              />
            </TabsContent>

            <TabsContent value="history" className="space-y-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Resident</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Cooperation</TableHead>
                    <TableHead>Follow-up</TableHead>
                    {isAdmin && <TableHead className="w-16"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPastConferences.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 7 : 6} className="h-20 text-center text-muted-foreground">
                        No conference history matches your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPastConferences.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell>
                          {new Date(visit.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{visit.residentName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={visitTypeBadgeClass(visit.visitType)}>
                            {visit.visitType}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate text-muted-foreground">
                          {visit.location || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cooperationBadgeClass(visit.cooperationLevel)}>
                            {visit.cooperationLevel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {visit.followUpNeeded ? (
                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-border bg-muted text-muted-foreground">
                              No
                            </Badge>
                          )}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="px-2" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                onClick={() => openEditDialog(visit)}
                                aria-label="Edit visit"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button
                                    className="rounded p-1 text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:text-red-400"
                                    aria-label="Delete visit"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Visit</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently remove this visit record for {visit.residentName}. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(visit.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                currentPage={historyPage}
                totalPages={Math.max(1, Math.ceil(filteredPastConferences.length / recordsPerPage))}
                onPageChange={setHistoryPage}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Log Visit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Home Visit' : 'Log Home Visit'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="visitDate">Visit Date</Label>
                <Input
                  id="visitDate"
                  type="date"
                  value={form.date}
                  onChange={(e) => updateFormField('date', e.target.value)}
                />
                {formErrors.date && (
                  <p className="text-xs text-destructive">{formErrors.date}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Resident</Label>
                <Select
                  value={form.residentId}
                  onValueChange={(v) => updateFormField('residentId', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select resident" />
                  </SelectTrigger>
                  <SelectContent>
                    {residents.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.residentId && (
                  <p className="text-xs text-destructive">{formErrors.residentId}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Visit Type</Label>
              <Select
                value={form.visitType}
                onValueChange={(v) => updateFormField('visitType', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {VISIT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.visitType && (
                <p className="text-xs text-destructive">{formErrors.visitType}</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Required fields: Date, Resident, Visit Type.</p>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Brgy. San Isidro, Quezon City"
                value={form.location}
                onChange={(e) =>
                  updateFormField('location', e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Observations</Label>
              <Textarea
                id="observations"
                rows={3}
                placeholder="Describe findings and observations..."
                value={form.observations}
                onChange={(e) =>
                  updateFormField('observations', e.target.value)
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cooperation Level</Label>
                <Select
                  value={form.cooperationLevel}
                  onValueChange={(v) =>
                    updateFormField('cooperationLevel', v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {COOPERATION_LEVELS.map((cl) => (
                      <SelectItem key={cl} value={cl}>
                        {cl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Follow-up Needed</Label>
                <Select
                  value={form.followUpNeeded ? 'yes' : 'no'}
                  onValueChange={(v) =>
                    updateFormField('followUpNeeded', v === 'yes')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Safety Concerns Noted</Label>
              <Select
                value={form.safetyConcerns ? 'yes' : 'no'}
                onValueChange={(v) => updateFormField('safetyConcerns', v === 'yes')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
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
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? 'Save Changes' : 'Save Visit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
