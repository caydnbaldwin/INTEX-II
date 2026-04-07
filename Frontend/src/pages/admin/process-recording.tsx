import { useState, useEffect, useCallback } from 'react'
import { Plus, Calendar, Brain, ArrowRight, Loader2 } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Separator } from '@/components/ui/separator'
import { api } from '@/lib/api'

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

/** Local display model */
interface Session {
  id: number
  residentId: number
  residentName: string
  date: string
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

function emotionBadgeClass(state: EmotionalState): string {
  switch (state) {
    case 'Calm':
    case 'Hopeful':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'Neutral':
      return 'border-zinc-200 bg-zinc-50 text-zinc-600'
    case 'Anxious':
    case 'Withdrawn':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'Distressed':
    case 'Angry':
      return 'border-red-200 bg-red-50 text-red-700'
  }
}

// ---------------------------------------------------------------------------
// Blank form
// ---------------------------------------------------------------------------

const blankForm = {
  date: '',
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
  const [sessions, setSessions] = useState<Session[]>([])
  const [residents, setResidents] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [selectedResident, setSelectedResident] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(blankForm)
  const [formResident, setFormResident] = useState('')

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

  const filteredSessions =
    selectedResident === 'all'
      ? sessions
      : sessions.filter((s) => String(s.residentId) === selectedResident)

  async function handleSave() {
    const resident = residents.find((r) => String(r.id) === formResident)
    if (!resident) return

    setSaving(true)
    try {
      await api.post('/api/process-recordings', {
        residentId: resident.id,
        sessionDate: form.date,
        sessionType: form.sessionType || 'Individual',
        emotionalStateObserved: form.emotionalStateStart || 'Neutral',
        emotionalStateEnd: form.emotionalStateEnd || 'Neutral',
        sessionNarrative: form.narrative,
        interventionsApplied: form.interventions,
        followUpActions: form.followUpActions,
      })

      setDialogOpen(false)
      setForm(blankForm)
      setFormResident('')
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
            Process Recording
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Document counseling sessions and track emotional progress.
          </p>
        </div>
        <Button
          onClick={() => {
            setForm(blankForm)
            setFormResident('')
            setDialogOpen(true)
          }}
          className="gap-2 bg-violet-700 hover:bg-violet-800"
        >
          <Plus className="h-4 w-4" />
          New Session
        </Button>
      </div>

      {/* Resident filter */}
      <Card className="border-zinc-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label className="text-zinc-600 whitespace-nowrap">
              Filter by Resident
            </Label>
            <Select value={selectedResident} onValueChange={setSelectedResident}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="All residents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Residents</SelectItem>
                {residents.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Session list */}
      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
          <Card className="border-zinc-200">
            <CardContent className="flex h-32 items-center justify-center text-zinc-400">
              No sessions found.
            </CardContent>
          </Card>
        ) : (
          filteredSessions.map((session) => (
            <Card key={session.id} className="border-zinc-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base text-zinc-900">
                      {session.residentName}
                    </CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(session.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {session.sessionType}
                      </Badge>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge
                      variant="outline"
                      className={emotionBadgeClass(session.emotionalStateStart)}
                    >
                      {session.emotionalStateStart}
                    </Badge>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
                    <Badge
                      variant="outline"
                      className={emotionBadgeClass(session.emotionalStateEnd)}
                    >
                      {session.emotionalStateEnd}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4 space-y-3">
                <p className="text-sm leading-relaxed text-zinc-700">
                  {session.narrative}
                </p>
                <div className="flex flex-col gap-2 text-sm sm:flex-row sm:gap-6">
                  <div>
                    <span className="font-medium text-zinc-500">
                      Interventions:{' '}
                    </span>
                    <span className="text-zinc-700">
                      {session.interventions}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-zinc-500">
                      Follow-up:{' '}
                    </span>
                    <span className="text-zinc-700">
                      {session.followUpActions}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* New Session Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Counseling Session</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
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
                  <Brain className="h-3.5 w-3.5 text-zinc-400" />
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
                  <Brain className="h-3.5 w-3.5 text-zinc-400" />
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
    </div>
  )
}
