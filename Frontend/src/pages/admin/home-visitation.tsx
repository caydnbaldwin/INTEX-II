import { useState } from 'react'
import { Plus, MapPin, Calendar } from 'lucide-react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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

const initialVisits: HomeVisit[] = [
  {
    id: 1,
    date: '2026-04-06',
    residentId: 1,
    residentName: 'Maria Santos',
    visitType: 'Routine Follow-Up',
    location: 'Brgy. San Isidro, Quezon City',
    observations:
      'Home environment is clean and stable. Guardian is employed and attentive. Maria appeared comfortable and well-adjusted during the visit.',
    cooperationLevel: 'Cooperative',
    safetyConcerns: 'None observed',
    followUpNeeded: false,
  },
  {
    id: 2,
    date: '2026-04-04',
    residentId: 3,
    residentName: 'Ana Reyes',
    visitType: 'Reintegration Assessment',
    location: 'Brgy. Poblacion, Makati',
    observations:
      'Family home is modest but adequate. Mother expressed strong desire for reunification. Ana and her siblings have separate sleeping areas. Neighborhood appears safe.',
    cooperationLevel: 'Cooperative',
    safetyConcerns: 'Minor: home needs structural repairs on kitchen roof',
    followUpNeeded: true,
  },
  {
    id: 3,
    date: '2026-04-02',
    residentId: 2,
    residentName: 'Juan Dela Cruz',
    visitType: 'Initial Assessment',
    location: 'Brgy. Bagong Silang, Caloocan',
    observations:
      'Assessed the household where Juan was removed from. Multiple adults present, unclear relationship dynamics. Living conditions are below standard with visible signs of neglect.',
    cooperationLevel: 'Partially Cooperative',
    safetyConcerns:
      'Overcrowded living space, inadequate sanitation, presence of unrelated adults',
    followUpNeeded: true,
  },
  {
    id: 4,
    date: '2026-03-30',
    residentId: 5,
    residentName: 'Liza Manalo',
    visitType: 'Post-Placement',
    location: 'Brgy. Commonwealth, Quezon City',
    observations:
      'Liza has been placed with her aunt for two weeks. The aunt is providing a stable environment. Liza is enrolled in a nearby school and attending regularly.',
    cooperationLevel: 'Cooperative',
    safetyConcerns: 'None',
    followUpNeeded: false,
  },
  {
    id: 5,
    date: '2026-03-28',
    residentId: 6,
    residentName: 'Rosa Villanueva',
    visitType: 'Emergency',
    location: 'Brgy. Tondo, Manila',
    observations:
      'Emergency visit after report of guardian leaving the children unattended. Found two minors alone. Neighbor confirmed guardian has been absent for three days.',
    cooperationLevel: 'Uncooperative',
    safetyConcerns:
      'Children left unattended, no food supply, guardian whereabouts unknown',
    followUpNeeded: true,
  },
  {
    id: 6,
    date: '2026-03-25',
    residentId: 4,
    residentName: 'Carlo Bautista',
    visitType: 'Routine Follow-Up',
    location: 'Brgy. Loyola Heights, Quezon City',
    observations:
      'Routine check on Carlo\'s foster family. Foster parents are engaged and supportive. Carlo is participating in extracurricular activities at school.',
    cooperationLevel: 'Cooperative',
    safetyConcerns: 'None',
    followUpNeeded: false,
  },
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
  const [visits, setVisits] = useState<HomeVisit[]>(initialVisits)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(blankForm)

  // Summary counts
  const totalVisits = visits.length
  const followUpsNeeded = visits.filter((v) => v.followUpNeeded).length
  const emergencyCount = visits.filter(
    (v) => v.visitType === 'Emergency',
  ).length

  function handleSave() {
    const resident = RESIDENTS.find((r) => String(r.id) === form.residentId)
    if (!resident) return

    const newVisit: HomeVisit = {
      id: Date.now(),
      date: form.date,
      residentId: resident.id,
      residentName: resident.name,
      visitType: (form.visitType as VisitType) || 'Routine Follow-Up',
      location: form.location,
      observations: form.observations,
      cooperationLevel:
        (form.cooperationLevel as CooperationLevel) || 'Cooperative',
      safetyConcerns: form.safetyConcerns,
      followUpNeeded: form.followUpNeeded === 'yes',
    }

    setVisits((prev) => [newVisit, ...prev])
    setDialogOpen(false)
    setForm(blankForm)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Home Visitation
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Log and track home visits for residents and their families.
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {visits.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-zinc-400"
                >
                  No visits logged yet.
                </TableCell>
              </TableRow>
            ) : (
              visits.map((visit) => (
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

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
                    {RESIDENTS.map((r) => (
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
              className="bg-violet-700 hover:bg-violet-800"
            >
              Save Visit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
