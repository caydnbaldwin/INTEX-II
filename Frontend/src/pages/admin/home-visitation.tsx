import { useState, useEffect, useCallback } from 'react'
import { Plus, MapPin, Calendar, Loader2, Brain, ArrowUp, ArrowDown, CalendarCheck, Trash2 } from 'lucide-react'
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
  DialogDescription,
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
import { api } from '@/lib/api'
import { sanitize } from '@/lib/sanitize'
import { TablePagination } from '@/components/TablePagination'
import { usePageTitle } from '@/hooks/usePageTitle'

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
  safetyConcernsNoted: string
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
  safetyConcerns: string
  followUpNeeded: boolean
}

interface InterventionPlan {
  planId: number
  residentId: number | null
  planCategory: string | null
  planDescription: string | null
  status: string | null
  caseConferenceDate: string | null
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
  safetyConcerns: '',
  followUpNeeded: 'no',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HomeVisitation() {
  usePageTitle('Home Visitation')
  const [visits, setVisits] = useState<HomeVisit[]>([])
  const [residents, setResidents] = useState<{ id: number; name: string }[]>([])
  const [upcomingConferences, setUpcomingConferences] = useState<(InterventionPlan & { residentName: string })[]>([])
  const [pastConferences, setPastConferences] = useState<(InterventionPlan & { residentName: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [visitsPage, setVisitsPage] = useState(1)
  const visitsPerPage = 15

  const [viewingVisit, setViewingVisit] = useState<HomeVisit | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(blankForm)

  // ML prediction state
  const [predForm, setPredForm] = useState({
    residentId: '',
    visitType: '',
    cooperationLevel: '',
    safetyConcerns: false,
  })
  const [predicting, setPredicting] = useState(false)
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)

  // --- Data fetching ---
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [apiVisits, apiResidents, apiConferences] = await Promise.all([
        api.get<ApiHomeVisitation[]>('/api/home-visitations'),
        api.get<ApiResident[]>('/api/residents'),
        api.get<InterventionPlan[]>('/api/residents/case-conferences').catch(() => [] as InterventionPlan[]),
      ])

      const residentList = apiResidents.map((r) => ({
        id: r.residentId,
        name: r.internalCode || r.caseControlNo || `Resident ${r.residentId}`,
      }))
      setResidents(residentList)

      const residentMap = new Map(residentList.map((r) => [r.id, r.name]))

      // Split conferences into upcoming vs past
      const today = new Date().toISOString().split('T')[0]
      const enriched = apiConferences.map((c) => ({
        ...c,
        residentName: residentMap.get(c.residentId ?? 0) ?? `Resident ${c.residentId}`,
      }))
      setUpcomingConferences(enriched.filter((c) => (c.caseConferenceDate ?? '') >= today))
      setPastConferences(enriched.filter((c) => (c.caseConferenceDate ?? '') < today))

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
          safetyConcerns: v.safetyConcernsNoted ?? '',
          followUpNeeded: v.followUpNeeded ?? false,
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      )
    } catch (err) {
      console.error('Failed to load home visitation data', err)
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

  async function handleSave() {
    if (!form.residentId) { alert('Resident is required.'); return }
    if (!form.date) { alert('Visit Date is required.'); return }
    if (!form.visitType) { alert('Visit Type is required.'); return }

    const resident = residents.find((r) => String(r.id) === form.residentId)
    if (!resident) return

    setSaving(true)
    try {
      await api.post('/api/home-visitations', {
        residentId: resident.id,
        visitDate: form.date,
        visitType: form.visitType || 'Routine Follow-Up',
        locationVisited: form.location,
        observations: form.observations,
        familyCooperationLevel: form.cooperationLevel || 'Cooperative',
        safetyConcernsNoted: form.safetyConcerns,
        followUpNeeded: form.followUpNeeded === 'yes',
      })

      setDialogOpen(false)
      setForm(blankForm)
      await fetchData()
    } catch (err) {
      console.error('Failed to save visit', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteVisit(id: number) {
    try {
      await api.delete(`/api/home-visitations/${id}`)
      await fetchData()
    } catch (err) {
      console.error('Failed to delete visit:', err)
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
        <Button
          onClick={() => {
            setForm(blankForm)
            setDialogOpen(true)
          }}
          className="gap-2 bg-violet-700 hover:bg-violet-800"
        >
          <Plus className="h-4 w-4" />
          Log Visit
        </Button>
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

      {/* Upcoming Conferences + ML Predictor — side by side */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Upcoming Case Conferences
            </CardTitle>
            <CardDescription>Scheduled intervention reviews for residents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingConferences.length === 0 && pastConferences.length === 0 ? (
                <p className="text-sm text-muted-foreground">No case conferences on record.</p>
              ) : upcomingConferences.length === 0 ? (
                <>
                  <p className="text-xs text-muted-foreground mb-2">No upcoming conferences. Showing most recent:</p>
                  {pastConferences.slice(0, 5).map((conf) => (
                    <div key={conf.planId} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-muted-foreground">{conf.residentName}</span>
                        {conf.planCategory && (
                          <Badge variant="outline" className="border-border bg-muted text-muted-foreground">{conf.planCategory}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {conf.status && <Badge variant="outline">{conf.status}</Badge>}
                        <span>{conf.caseConferenceDate ? new Date(conf.caseConferenceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                upcomingConferences.map((conf) => (
                  <div key={conf.planId} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-muted-foreground">{conf.residentName}</span>
                      {conf.planCategory && (
                        <Badge variant="outline" className="border-violet-200 bg-violet-50 text-primary dark:border-violet-800 dark:bg-violet-950 dark:text-violet-400">{conf.planCategory}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {conf.status && <Badge variant="outline">{conf.status}</Badge>}
                      <span>{conf.caseConferenceDate ? new Date(conf.caseConferenceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Pre-Visit Risk Assessment</CardTitle>
            </div>
            <CardDescription>Predict visit outcome before scheduling</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
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
              <div className="grid grid-cols-2 gap-2">
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
      </div>

      {/* Visit History Table */}
      <Card className="border-border">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Visit History</CardTitle>
          <CardDescription>All logged home visits, sorted by most recent</CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-muted-foreground">Resident</TableHead>
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">Location</TableHead>
              <TableHead className="text-muted-foreground">Cooperation</TableHead>
              <TableHead className="text-muted-foreground">Follow-up</TableHead>
              <TableHead className="w-12 text-muted-foreground"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visits.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No visits logged yet.
                </TableCell>
              </TableRow>
            ) : (
              visits.slice((visitsPage - 1) * visitsPerPage, visitsPage * visitsPerPage).map((visit) => (
                <TableRow key={visit.id} className="cursor-pointer hover:bg-muted" onClick={() => setViewingVisit(visit)}>
                  <TableCell className="text-foreground/80">
                    {new Date(visit.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {visit.residentName}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={visitTypeBadgeClass(visit.visitType)}
                    >
                      {visit.visitType}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {visit.location}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cooperationBadgeClass(visit.cooperationLevel)}
                    >
                      {visit.cooperationLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {visit.followUpNeeded ? (
                      <Badge
                        variant="outline"
                        className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400"
                      >
                        Yes
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-border bg-muted text-muted-foreground"
                      >
                        No
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="rounded p-1 text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:text-red-400" onClick={(e) => e.stopPropagation()}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Visit</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove this {visit.visitType} visit for {visit.residentName}. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteVisit(visit.id)} className="bg-red-600 hover:bg-red-700">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
      <TablePagination currentPage={visitsPage} totalPages={Math.ceil(visits.length / visitsPerPage)} onPageChange={setVisitsPage} />

      {/* Log Visit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Home Visit</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="visitDate">Visit Date</Label>
                <Input
                  id="visitDate"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Resident</Label>
                <Select
                  value={form.residentId}
                  onValueChange={(v) => setForm({ ...form, residentId: v })}
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
              </div>
            </div>

            <div className="space-y-2">
              <Label>Visit Type</Label>
              <Select
                value={form.visitType}
                onValueChange={(v) => setForm({ ...form, visitType: v })}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Brgy. San Isidro, Quezon City"
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
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
                  setForm({ ...form, observations: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cooperation Level</Label>
                <Select
                  value={form.cooperationLevel}
                  onValueChange={(v) =>
                    setForm({ ...form, cooperationLevel: v })
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
                  value={form.followUpNeeded}
                  onValueChange={(v) =>
                    setForm({ ...form, followUpNeeded: v })
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
              <Label htmlFor="safetyConcerns">Safety Concerns</Label>
              <Textarea
                id="safetyConcerns"
                rows={2}
                placeholder="Note any safety concerns observed..."
                value={form.safetyConcerns}
                onChange={(e) =>
                  setForm({ ...form, safetyConcerns: e.target.value })
                }
              />
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
              Save Visit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Visit Detail Dialog */}
      <Dialog open={!!viewingVisit} onOpenChange={(open) => { if (!open) setViewingVisit(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewingVisit?.residentName} — Home Visit</DialogTitle>
            <DialogDescription>
              {viewingVisit && new Date(viewingVisit.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </DialogDescription>
          </DialogHeader>
          {viewingVisit && (
            <div className="space-y-4 py-4 text-sm">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <p className="text-muted-foreground mb-1">Visit Type</p>
                  <Badge variant="outline" className={visitTypeBadgeClass(viewingVisit.visitType)}>
                    {viewingVisit.visitType}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Cooperation Level</p>
                  <Badge variant="outline" className={cooperationBadgeClass(viewingVisit.cooperationLevel)}>
                    {viewingVisit.cooperationLevel}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Location</p>
                  <p className="font-medium text-foreground">{viewingVisit.location || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Follow-up Needed</p>
                  <Badge variant="outline" className={viewingVisit.followUpNeeded ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400' : 'border-border bg-muted text-muted-foreground'}>
                    {viewingVisit.followUpNeeded ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
              {viewingVisit.observations && (
                <div>
                  <p className="text-muted-foreground mb-1">Observations</p>
                  <p className="leading-relaxed text-foreground/80">{sanitize(viewingVisit.observations)}</p>
                </div>
              )}
              {viewingVisit.safetyConcerns && (
                <div>
                  <p className="text-muted-foreground mb-1">Safety Concerns</p>
                  <p className="text-foreground/80">{sanitize(viewingVisit.safetyConcerns)}</p>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setViewingVisit(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
