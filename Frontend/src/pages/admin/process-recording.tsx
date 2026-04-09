import { useState, useEffect, useCallback } from 'react'
import { Plus, ArrowRight, Loader2, Mic, Pencil, Trash2, Brain, Search } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
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
import { api, ApiError } from '@/lib/api'
import { sanitize } from '@/lib/sanitize'
import { TablePagination } from '@/components/TablePagination'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useAuth } from '@/context/AuthContext'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SessionType = 'Individual' | 'Group'
type EmotionalState =
  | 'Calm'
  | 'Anxious'
  | 'Distressed'
  | 'Withdrawn'
  | 'Hopeful'
  | 'Angry'
  | 'Neutral'

/** Shape returned by the API */
interface ApiProcessRecording {
  recordingId: number
  residentId: number
  sessionDate: string
  socialWorker: string
  sessionType: string
  sessionDurationMinutes: number
  emotionalStateObserved: string
  emotionalStateEnd: string
  sessionNarrative: string
  interventionsApplied: string
  followUpActions: string
  progressNoted: string
  concernsFlagged: string
  referralMade: string
}

interface ApiResident {
  residentId: number
  caseControlNo: string
  internalCode: string
  [key: string]: unknown
}

interface ProcessRecordingAutofillResponse {
  sessionDate: string | null
  sessionType: string | null
  emotionalStateObserved: string | null
  emotionalStateEnd: string | null
  sessionNarrative: string | null
  interventionsApplied: string | null
  followUpActions: string | null
  confidence: number | null
  missingFields: string[]
}

/** Local display model */
interface Session {
  id: number
  residentId: number
  residentName: string
  date: string
  socialWorker: string
  sessionDurationMinutes: number | null
  sessionType: SessionType
  emotionalStateStart: EmotionalState
  emotionalStateEnd: EmotionalState
  narrative: string
  interventions: string
  followUpActions: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SESSION_TYPES: SessionType[] = ['Individual', 'Group']
const EMOTIONAL_STATES: EmotionalState[] = [
  'Calm',
  'Anxious',
  'Distressed',
  'Withdrawn',
  'Hopeful',
  'Angry',
  'Neutral',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MISSING_FIELD_LABELS: Record<string, string> = {
  sessionDate: 'Date',
  sessionType: 'Session Type',
  emotionalStateObserved: 'Emotional State (Start)',
  emotionalStateEnd: 'Emotional State (End)',
  sessionNarrative: 'Session Narrative',
  interventionsApplied: 'Interventions Used',
  followUpActions: 'Follow-up Actions',
}

function formatMissingField(field: string): string {
  return MISSING_FIELD_LABELS[field] ?? field
}

function emotionBadgeClass(state: EmotionalState): string {
  switch (state) {
    case 'Calm':
    case 'Hopeful':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
    case 'Neutral':
      return 'border-border bg-muted text-muted-foreground'
    case 'Anxious':
    case 'Withdrawn':
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400'
    case 'Distressed':
    case 'Angry':
      return 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400'
  }
}

// ---------------------------------------------------------------------------
// Blank form
// ---------------------------------------------------------------------------

const blankForm = {
  date: '',
  socialWorker: '',
  sessionDurationMinutes: '',
  sessionType: '' as string,
  emotionalStateStart: '' as string,
  emotionalStateEnd: '' as string,
  narrative: '',
  interventions: '',
  followUpActions: '',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProcessRecording() {
  usePageTitle('Process Recording')
  const { authSession } = useAuth()
  const isAdmin = authSession.roles.includes('Admin')
  const [sessions, setSessions] = useState<Session[]>([])
  const [residents, setResidents] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [viewingSession, setViewingSession] = useState<Session | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(blankForm)
  const [formResident, setFormResident] = useState('')

  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [autoFillLoading, setAutoFillLoading] = useState(false)
  const [autoFillError, setAutoFillError] = useState('')
  const [autoFillMissingFields, setAutoFillMissingFields] = useState<string[]>([])
  const [autoFillConfidence, setAutoFillConfidence] = useState<number | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  // --- Data fetching ---
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [apiSessions, apiResidents] = await Promise.all([
        api.get<ApiProcessRecording[]>('/api/process-recordings'),
        api.get<ApiResident[]>('/api/residents'),
      ])

      const residentList = apiResidents.map((r) => ({
        id: r.residentId,
        name: r.internalCode || r.caseControlNo || `Resident ${r.residentId}`,
      }))
      setResidents(residentList)

      const residentMap = new Map(residentList.map((r) => [r.id, r.name]))

      setSessions(
        apiSessions.map((s) => ({
          id: s.recordingId,
          residentId: s.residentId,
          residentName: residentMap.get(s.residentId) ?? `Resident ${s.residentId}`,
          date: s.sessionDate,
          socialWorker: s.socialWorker ?? '',
          sessionDurationMinutes: s.sessionDurationMinutes ?? null,
          sessionType: (s.sessionType as SessionType) || 'Individual',
          emotionalStateStart: (s.emotionalStateObserved as EmotionalState) || 'Neutral',
          emotionalStateEnd: (s.emotionalStateEnd as EmotionalState) || 'Neutral',
          narrative: s.sessionNarrative ?? '',
          interventions: s.interventionsApplied ?? '',
          followUpActions: s.followUpActions ?? '',
        })),
      )
    } catch (err) {
      console.error('Failed to load process recording data', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => { setCurrentPage(1) }, [search])

  const chronologicallySortedSessions = [...sessions].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
    if (dateDiff !== 0) return dateDiff
    return b.id - a.id
  })

  const filteredSessions = chronologicallySortedSessions.filter((s) => {
    const q = search.trim().toLowerCase()
    const matchesSearch =
      !q
      || s.residentName.toLowerCase().includes(q)
      || String(s.residentId).includes(q)
    return matchesSearch
  })

  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage)
  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  async function handleAutofillFromAudio() {
    if (!audioFile) {
      setAutoFillError('Please select an audio file first.')
      return
    }

    setAutoFillLoading(true)
    setAutoFillError('')
    setAutoFillMissingFields([])
    setAutoFillConfidence(null)

    try {
      const payload = new FormData()
      payload.append('audio', audioFile)

      const result = await api.postForm<ProcessRecordingAutofillResponse>(
        '/api/process-recordings/autofill-from-audio',
        payload,
      )

      const normalizedSessionType = SESSION_TYPES.includes(
        result.sessionType as SessionType,
      )
        ? result.sessionType
        : ''

      const normalizedStateStart = EMOTIONAL_STATES.includes(
        result.emotionalStateObserved as EmotionalState,
      )
        ? result.emotionalStateObserved
        : ''

      const normalizedStateEnd = EMOTIONAL_STATES.includes(
        result.emotionalStateEnd as EmotionalState,
      )
        ? result.emotionalStateEnd
        : ''

      setForm((prev) => ({
        ...prev,
        date: result.sessionDate || prev.date,
        sessionType: normalizedSessionType || prev.sessionType,
        emotionalStateStart: normalizedStateStart || prev.emotionalStateStart,
        emotionalStateEnd: normalizedStateEnd || prev.emotionalStateEnd,
        narrative: result.sessionNarrative || prev.narrative,
        interventions: result.interventionsApplied || prev.interventions,
        followUpActions: result.followUpActions || prev.followUpActions,
      }))

      setAutoFillMissingFields(result.missingFields ?? [])
      setAutoFillConfidence(result.confidence)
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setAutoFillError(
          'AI quota exceeded. Please try again later or fill in the fields manually.',
        )
      } else {
        setAutoFillError('Unable to auto-fill from audio. Please fill in manually.')
      }
    } finally {
      setAutoFillLoading(false)
    }
  }

  function openEdit(session: Session) {
    setEditingId(session.id)
    setFormResident(String(session.residentId))
    setForm({
      date: session.date ? session.date.split('T')[0] : '',
      socialWorker: session.socialWorker ?? '',
      sessionDurationMinutes: session.sessionDurationMinutes ? String(session.sessionDurationMinutes) : '',
      sessionType: session.sessionType,
      emotionalStateStart: session.emotionalStateStart,
      emotionalStateEnd: session.emotionalStateEnd,
      narrative: session.narrative,
      interventions: session.interventions,
      followUpActions: session.followUpActions,
    })
    setAudioFile(null)
    setAutoFillError('')
    setAutoFillMissingFields([])
    setAutoFillConfidence(null)
    setDialogOpen(true)
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/api/process-recordings/${id}`)
      await fetchData()
    } catch (err) {
      console.error('Failed to delete session', err)
    }
  }

  async function handleSave() {
    if (!formResident) { alert('Resident is required.'); return }
    if (!form.date) { alert('Session Date is required.'); return }
    if (!form.narrative?.trim()) { alert('Session Narrative is required.'); return }

    const resident = residents.find((r) => String(r.id) === formResident)
    if (!resident) return

    setSaving(true)
    try {
      const payload = {
        residentId: resident.id,
        sessionDate: form.date,
        socialWorker: form.socialWorker || undefined,
        sessionDurationMinutes: form.sessionDurationMinutes ? Number(form.sessionDurationMinutes) : undefined,
        sessionType: form.sessionType || 'Individual',
        emotionalStateObserved: form.emotionalStateStart || 'Neutral',
        emotionalStateEnd: form.emotionalStateEnd || 'Neutral',
        sessionNarrative: form.narrative,
        interventionsApplied: form.interventions,
        followUpActions: form.followUpActions,
      }

      if (editingId) {
        await api.put(`/api/process-recordings/${editingId}`, payload)
      } else {
        await api.post('/api/process-recordings', payload)
      }

      setDialogOpen(false)
      setForm(blankForm)
      setFormResident('')
      setEditingId(null)
      await fetchData()
    } catch (err) {
      console.error('Failed to save session', err)
    } finally {
      setSaving(false)
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
            Process Recording
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Document counseling sessions and track emotional progress.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null)
            setForm(blankForm)
            setFormResident('')
            setAudioFile(null)
            setAutoFillError('')
            setAutoFillMissingFields([])
            setAutoFillConfidence(null)
            setDialogOpen(true)
          }}
          className="gap-2 bg-violet-700 hover:bg-violet-800"
        >
          <Plus className="h-4 w-4" />
          New Session
        </Button>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search resident (e.g. LS-0027)..."
            aria-label="Search resident sessions"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Session list */}
      <Card className="border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-muted-foreground">Resident</TableHead>
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">Social Worker</TableHead>
              <TableHead className="text-muted-foreground">Duration</TableHead>
              <TableHead className="text-muted-foreground">Emotional State</TableHead>
              {isAdmin && <TableHead className="text-right text-muted-foreground">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 7 : 6} className="h-24 text-center text-muted-foreground">
                  No sessions found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedSessions.map((session) => (
                <TableRow key={session.id} className="cursor-pointer hover:bg-muted" onClick={() => setViewingSession(session)}>
                  <TableCell className="font-medium text-foreground">
                    {session.residentName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(session.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {session.sessionType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {session.socialWorker || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {session.sessionDurationMinutes ? `${session.sessionDurationMinutes} min` : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={emotionBadgeClass(session.emotionalStateStart)}>
                        {session.emotionalStateStart}
                      </Badge>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="outline" className={emotionBadgeClass(session.emotionalStateEnd)}>
                        {session.emotionalStateEnd}
                      </Badge>
                    </div>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); openEdit(session) }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600 dark:text-red-400" onClick={(e) => e.stopPropagation()}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Session</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this counseling session for <span className="font-semibold">{session.residentName}</span>? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(session.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
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
      </Card>

      <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* New Session Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Counseling Session' : 'New Counseling Session'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Audio Auto-fill */}
            <div className="space-y-2 rounded-md border border-border bg-muted p-3">
              <Label htmlFor="sessionAudio" className="flex items-center gap-1.5">
                <Mic className="h-3.5 w-3.5 text-muted-foreground" />
                Upload Recording for AI Auto-fill
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Audio is processed in memory and never stored. Review all fields before
                saving.
              </p>
              {/* Hidden native file input */}
              <Input
                id="sessionAudio"
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  setAudioFile(e.target.files?.[0] ?? null)
                  setAutoFillError('')
                }}
              />
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    size="sm"
                    className="bg-violet-700 text-white hover:bg-violet-800"
                    onClick={() => {
                      document.getElementById('sessionAudio')?.click()
                    }}
                  >
                    Choose audio file
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAutofillFromAudio}
                    disabled={!audioFile || autoFillLoading}
                  >
                    {autoFillLoading ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Analyzing…
                      </>
                    ) : (
                      'Auto-fill from Audio'
                    )}
                  </Button>
                  {autoFillConfidence !== null && (
                    <p className="text-xs text-muted-foreground">
                      AI confidence: {Math.round(autoFillConfidence * 100)}%
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {audioFile ? audioFile.name : 'No file chosen'}
                </p>
              </div>
              {autoFillError && (
                <p className="text-sm text-red-600 dark:text-red-400">{autoFillError}</p>
              )}
              {autoFillMissingFields.length > 0 && (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Could not extract:{' '}
                  {autoFillMissingFields.map(formatMissingField).join(', ')}. Please fill
                  in manually.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Resident</Label>
                <Select value={formResident} onValueChange={setFormResident}>
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
                <Label htmlFor="sessionDate">Date</Label>
                <Input
                  id="sessionDate"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="socialWorker">Social Worker</Label>
                <Input
                  id="socialWorker"
                  placeholder="Name of social worker"
                  value={form.socialWorker}
                  onChange={(e) => setForm({ ...form, socialWorker: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionDuration">Duration (min)</Label>
                <Input
                  id="sessionDuration"
                  type="number"
                  min="1"
                  placeholder="e.g., 60"
                  value={form.sessionDurationMinutes}
                  onChange={(e) => setForm({ ...form, sessionDurationMinutes: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Session Type</Label>
              <Select
                value={form.sessionType}
                onValueChange={(v) => setForm({ ...form, sessionType: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Brain className="h-3.5 w-3.5 text-muted-foreground" />
                  Emotional State (Start)
                </Label>
                <Select
                  value={form.emotionalStateStart}
                  onValueChange={(v) =>
                    setForm({ ...form, emotionalStateStart: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMOTIONAL_STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Brain className="h-3.5 w-3.5 text-muted-foreground" />
                  Emotional State (End)
                </Label>
                <Select
                  value={form.emotionalStateEnd}
                  onValueChange={(v) =>
                    setForm({ ...form, emotionalStateEnd: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMOTIONAL_STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="narrative">Session Narrative</Label>
              <Textarea
                id="narrative"
                rows={4}
                placeholder="Describe the session..."
                value={form.narrative}
                onChange={(e) =>
                  setForm({ ...form, narrative: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interventions">Interventions Used</Label>
              <Input
                id="interventions"
                placeholder="e.g., CBT, art therapy, grounding techniques"
                value={form.interventions}
                onChange={(e) =>
                  setForm({ ...form, interventions: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="followUp">Follow-up Actions</Label>
              <Input
                id="followUp"
                placeholder="Next steps and follow-up tasks"
                value={form.followUpActions}
                onChange={(e) =>
                  setForm({ ...form, followUpActions: e.target.value })
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
              Save Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Session Detail Dialog */}
      <Dialog open={!!viewingSession} onOpenChange={(open) => { if (!open) setViewingSession(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewingSession?.residentName} — Session</DialogTitle>
            <DialogDescription>
              {viewingSession && new Date(viewingSession.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </DialogDescription>
          </DialogHeader>
          {viewingSession && (
            <div className="space-y-4 py-4 text-sm">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <p className="text-muted-foreground mb-1">Session Type</p>
                  <Badge variant="secondary">{viewingSession.sessionType}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Social Worker</p>
                  <p className="font-medium text-foreground">{viewingSession.socialWorker || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Duration</p>
                  <p className="font-medium text-foreground">{viewingSession.sessionDurationMinutes ? `${viewingSession.sessionDurationMinutes} min` : '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Emotional State</p>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={emotionBadgeClass(viewingSession.emotionalStateStart)}>
                      {viewingSession.emotionalStateStart}
                    </Badge>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <Badge variant="outline" className={emotionBadgeClass(viewingSession.emotionalStateEnd)}>
                      {viewingSession.emotionalStateEnd}
                    </Badge>
                  </div>
                </div>
              </div>
              {viewingSession.narrative && (
                <div>
                  <p className="text-muted-foreground mb-1">Session Narrative</p>
                  <p className="leading-relaxed text-foreground/80">{sanitize(viewingSession.narrative)}</p>
                </div>
              )}
              {viewingSession.interventions && (
                <div>
                  <p className="text-muted-foreground mb-1">Interventions Applied</p>
                  <p className="text-foreground/80">{sanitize(viewingSession.interventions)}</p>
                </div>
              )}
              {viewingSession.followUpActions && (
                <div>
                  <p className="text-muted-foreground mb-1">Follow-up Actions</p>
                  <p className="text-foreground/80">{sanitize(viewingSession.followUpActions)}</p>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setViewingSession(null)}>Close</Button>
            {isAdmin && (
              <Button
                className="bg-violet-700 hover:bg-violet-800"
                onClick={() => {
                  const session = viewingSession
                  setViewingSession(null)
                  if (session) openEdit(session)
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
