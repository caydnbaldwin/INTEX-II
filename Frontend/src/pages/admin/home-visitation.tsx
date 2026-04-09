import { useState, useEffect, useCallback } from 'react'
import { Plus, MapPin, Calendar, Loader2, Brain, ArrowUp, ArrowDown, CalendarCheck, FileText, Trash2 } from 'lucide-react'
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
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'Partially Cooperative':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'Uncooperative':
      return 'border-orange-200 bg-orange-50 text-orange-700'
    case 'Hostile':
      return 'border-red-200 bg-red-50 text-red-700'
  }
}

function visitTypeBadgeClass(type: VisitType): string {
  switch (type) {
    case 'Emergency':
      return 'border-red-200 bg-red-50 text-red-700'
    case 'Initial Assessment':
      return 'border-violet-200 bg-violet-50 text-violet-700'
    case 'Reintegration Assessment':
      return 'border-blue-200 bg-blue-50 text-blue-700'
    case 'Post-Placement':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'Routine Follow-Up':
      return 'border-zinc-200 bg-zinc-50 text-zinc-600'
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
        })),
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
            Home Visitation & Case Conferences
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
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
        <Card className="border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              Total Visits
            </CardTitle>
            <MapPin className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {totalVisits}
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              Follow-ups Needed
            </CardTitle>
            <Calendar className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {followUpsNeeded}
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              Emergency Visits
            </CardTitle>
            <MapPin className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {emergencyCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pre-Visit Risk Assessment (ML) */}
      <Card className="border-zinc-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-600" />
            <CardTitle className="text-lg">Pre-Visit Risk Assessment (ML)</CardTitle>
          </div>
          <CardDescription>
            Predict visit outcome before scheduling — powered by our strongest model (AUC 0.84)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Prediction form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Resident</Label>
                <Select
                  value={predForm.residentId}
                  onValueChange={(v) => setPredForm({ ...predForm, residentId: v })}
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

              <div className="space-y-2">
                <Label>Visit Type</Label>
                <Select
                  value={predForm.visitType}
                  onValueChange={(v) => setPredForm({ ...predForm, visitType: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select visit type" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Initial Assessment', 'Routine Follow-Up', 'Reintegration Assessment', 'Post-Placement Monitoring', 'Emergency'].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cooperation Level</Label>
                <Select
                  value={predForm.cooperationLevel}
                  onValueChange={(v) => setPredForm({ ...predForm, cooperationLevel: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select cooperation level" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Highly Cooperative', 'Cooperative', 'Neutral', 'Uncooperative'].map((cl) => (
                      <SelectItem key={cl} value={cl}>{cl}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={predForm.safetyConcerns}
                  onCheckedChange={(checked) =>
                    setPredForm({ ...predForm, safetyConcerns: checked })
                  }
                />
                <Label>Safety Concerns</Label>
              </div>

              <Button
                onClick={handlePredict}
                disabled={predicting || !predForm.residentId || !predForm.visitType || !predForm.cooperationLevel}
                className="w-full gap-2 bg-violet-700 hover:bg-violet-800"
              >
                {predicting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4" />
                )}
                Predict Outcome
              </Button>
            </div>

            {/* Prediction results */}
            <div className="flex flex-col items-center justify-center">
              {prediction ? (
                <div className="w-full space-y-4">
                  <div className="flex flex-col items-center gap-2 rounded-lg border border-zinc-200 p-6">
                    <span className="text-sm font-medium text-zinc-500">Favorable Outcome Probability</span>
                    <span
                      className={`text-5xl font-bold ${
                        prediction.favorableProbability >= 0.7
                          ? 'text-emerald-600'
                          : prediction.favorableProbability >= 0.4
                            ? 'text-amber-600'
                            : 'text-red-600'
                      }`}
                    >
                      {Math.round(prediction.favorableProbability * 100)}%
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        prediction.favorableProbability >= 0.7
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : prediction.favorableProbability >= 0.4
                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : 'border-red-200 bg-red-50 text-red-700'
                      }
                    >
                      {prediction.riskLabel}
                    </Badge>
                    <Badge variant="outline" className="mt-1 border-violet-200 bg-violet-50 text-violet-700">
                      Model AUC: 0.84 | Confidence: {Math.round(prediction.confidence * 100)}%
                    </Badge>
                  </div>

                  {prediction.factors.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-zinc-600">Contributing Factors</span>
                      <div className="space-y-1">
                        {prediction.factors.map((f, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between rounded-md border border-zinc-100 px-3 py-2 text-sm"
                          >
                            <div className="flex items-center gap-2">
                              {f.impact === 'positive' ? (
                                <ArrowUp className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <ArrowDown className="h-3.5 w-3.5 text-red-500" />
                              )}
                              <span className="text-zinc-700">{f.factor}</span>
                            </div>
                            <span className="text-xs text-zinc-400">
                              {f.weight > 0 ? '+' : ''}{(f.weight * 100).toFixed(0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-sm text-zinc-400">
                  <Brain className="mx-auto mb-2 h-10 w-10 text-zinc-200" />
                  Fill out the form and click <strong>Predict Outcome</strong> to see results.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Case Conference History */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarCheck className="h-5 w-5 text-violet-600" />
              Upcoming Case Conferences
            </CardTitle>
            <CardDescription>Scheduled intervention reviews for residents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingConferences.length === 0 ? (
                <p className="text-sm text-zinc-400">No upcoming case conferences scheduled.</p>
              ) : (
                upcomingConferences.map((conf) => (
                  <div key={conf.planId} className="flex items-center justify-between rounded-lg border border-zinc-100 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-zinc-500">{conf.residentName}</span>
                      {conf.planCategory && (
                        <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-700">{conf.planCategory}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-zinc-500">
                      {conf.status && <Badge variant="outline">{conf.status}</Badge>}
                      <span>{conf.caseConferenceDate ? new Date(conf.caseConferenceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-zinc-500" />
              Past Case Conferences
            </CardTitle>
            <CardDescription>Completed conference records and outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pastConferences.length === 0 ? (
                <p className="text-sm text-zinc-400">No past case conference records.</p>
              ) : (
                pastConferences.slice(0, 10).map((conf) => (
                  <div key={conf.planId} className="flex items-center justify-between rounded-lg border border-zinc-100 px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-zinc-500">{conf.residentName}</span>
                        {conf.planCategory && (
                          <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-600">{conf.planCategory}</Badge>
                        )}
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                          {conf.status || 'Completed'}
                        </Badge>
                      </div>
                      {conf.planDescription && (
                        <span className="text-xs text-zinc-500">{sanitize(conf.planDescription)}</span>
                      )}
                    </div>
                    <div className="text-sm text-zinc-400">
                      {conf.caseConferenceDate ? new Date(conf.caseConferenceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-zinc-200">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-zinc-500">Date</TableHead>
              <TableHead className="text-zinc-500">Resident</TableHead>
              <TableHead className="text-zinc-500">Type</TableHead>
              <TableHead className="text-zinc-500">Location</TableHead>
              <TableHead className="text-zinc-500">Cooperation</TableHead>
              <TableHead className="text-zinc-500">Follow-up</TableHead>
              <TableHead className="w-12 text-zinc-500"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visits.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-zinc-400"
                >
                  No visits logged yet.
                </TableCell>
              </TableRow>
            ) : (
              visits.slice((visitsPage - 1) * visitsPerPage, visitsPage * visitsPerPage).map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell className="text-zinc-700">
                    {new Date(visit.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="font-medium text-zinc-900">
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
                  <TableCell className="max-w-[200px] truncate text-zinc-600">
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
                        className="border-amber-200 bg-amber-50 text-amber-700"
                      >
                        Yes
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-zinc-200 bg-zinc-50 text-zinc-500"
                      >
                        No
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600">
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
    </div>
  )
}
