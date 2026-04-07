import { useState } from 'react'
import { Plus, Calendar, Brain, ArrowRight } from 'lucide-react'
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
// Mock data
// ---------------------------------------------------------------------------

const RESIDENTS = [
  { id: 1, name: 'Maria Santos' },
  { id: 2, name: 'Juan Dela Cruz' },
  { id: 3, name: 'Ana Reyes' },
  { id: 4, name: 'Carlo Bautista' },
  { id: 5, name: 'Liza Manalo' },
  { id: 6, name: 'Rosa Villanueva' },
]

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

const initialSessions: Session[] = [
  {
    id: 1,
    residentId: 1,
    residentName: 'Maria Santos',
    date: '2026-04-05',
    sessionType: 'Individual',
    emotionalStateStart: 'Anxious',
    emotionalStateEnd: 'Calm',
    narrative:
      'Maria opened up about recurring nightmares related to her trafficking experience. She was able to articulate her feelings more clearly than in previous sessions and showed willingness to try the breathing exercises we discussed.',
    interventions: 'Trauma-focused CBT, guided breathing exercises',
    followUpActions: 'Schedule follow-up in 3 days, provide journal prompts',
  },
  {
    id: 2,
    residentId: 2,
    residentName: 'Juan Dela Cruz',
    date: '2026-04-04',
    sessionType: 'Individual',
    emotionalStateStart: 'Angry',
    emotionalStateEnd: 'Neutral',
    narrative:
      'Juan expressed frustration about restrictions at the safehouse. We explored the source of his anger and identified triggers. He agreed to try conflict resolution strategies before escalating.',
    interventions: 'Anger management techniques, role-playing',
    followUpActions: 'Monitor behavior over the week, check in with house parent',
  },
  {
    id: 3,
    residentId: 3,
    residentName: 'Ana Reyes',
    date: '2026-04-03',
    sessionType: 'Group',
    emotionalStateStart: 'Withdrawn',
    emotionalStateEnd: 'Hopeful',
    narrative:
      'Ana participated in the group art therapy session. Initially reluctant, she eventually engaged with peers and shared her drawing, which depicted her hopes for reunification with her family.',
    interventions: 'Art therapy, peer support facilitation',
    followUpActions: 'Continue group sessions, individual follow-up on family contact',
  },
  {
    id: 4,
    residentId: 1,
    residentName: 'Maria Santos',
    date: '2026-04-01',
    sessionType: 'Individual',
    emotionalStateStart: 'Distressed',
    emotionalStateEnd: 'Anxious',
    narrative:
      'Maria reported difficulty sleeping and loss of appetite. She was visibly distressed during the first half of the session but calmed after grounding exercises. Progress is gradual but present.',
    interventions: 'Grounding techniques, psychoeducation on trauma responses',
    followUpActions: 'Consult with medical staff about sleep, daily check-ins',
  },
  {
    id: 5,
    residentId: 5,
    residentName: 'Liza Manalo',
    date: '2026-03-30',
    sessionType: 'Individual',
    emotionalStateStart: 'Neutral',
    emotionalStateEnd: 'Hopeful',
    narrative:
      'Liza discussed her educational goals and expressed interest in returning to school. We reviewed available programs and she was enthusiastic about the vocational training option.',
    interventions: 'Motivational interviewing, goal-setting framework',
    followUpActions: 'Connect with education coordinator, set up skills assessment',
  },
  {
    id: 6,
    residentId: 6,
    residentName: 'Rosa Villanueva',
    date: '2026-03-28',
    sessionType: 'Group',
    emotionalStateStart: 'Anxious',
    emotionalStateEnd: 'Calm',
    narrative:
      'Rosa joined the mindfulness group session. She practiced breathing exercises and reported feeling lighter afterward. She interacted positively with two other residents.',
    interventions: 'Mindfulness meditation, progressive muscle relaxation',
    followUpActions: 'Encourage continued participation, individual session next week',
  },
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
  const [sessions, setSessions] = useState<Session[]>(initialSessions)
  const [selectedResident, setSelectedResident] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(blankForm)
  const [formResident, setFormResident] = useState('')

  const filteredSessions =
    selectedResident === 'all'
      ? sessions
      : sessions.filter((s) => String(s.residentId) === selectedResident)

  function handleSave() {
    const resident = RESIDENTS.find((r) => String(r.id) === formResident)
    if (!resident) return

    const newSession: Session = {
      id: Date.now(),
      residentId: resident.id,
      residentName: resident.name,
      date: form.date,
      sessionType: (form.sessionType as SessionType) || 'Individual',
      emotionalStateStart: (form.emotionalStateStart as EmotionalState) || 'Neutral',
      emotionalStateEnd: (form.emotionalStateEnd as EmotionalState) || 'Neutral',
      narrative: form.narrative,
      interventions: form.interventions,
      followUpActions: form.followUpActions,
    }

    setSessions((prev) => [newSession, ...prev])
    setDialogOpen(false)
    setForm(blankForm)
    setFormResident('')
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
                {RESIDENTS.map((r) => (
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
                    {RESIDENTS.map((r) => (
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
              className="bg-violet-700 hover:bg-violet-800"
            >
              Save Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
