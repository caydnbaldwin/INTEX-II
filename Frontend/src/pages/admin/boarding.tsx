import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BedDouble,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileCheck,
  HeartPulse,
  Loader2,
  MapPinned,
  Megaphone,
  Pencil,
  PhoneCall,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Stethoscope,
  TriangleAlert,
  UserRound,
  UserSearch,
  Users,
  type LucideIcon,
  X,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { api } from '@/lib/api'
import { sanitize } from '@/lib/sanitize'
import { cn } from '@/lib/utils'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'

type PlacementStatus =
  | 'Incoming'
  | 'Current'
  | 'CheckedOut'
  | 'Transferred'
  | 'Cancelled'
type BedVisualStatus = 'empty' | 'current' | 'incoming' | 'action' | 'pending'
type BedFilter = 'all' | 'actionRequired' | 'pending' | 'open' | 'active'
type IncidentWorkflowStatus = 'action' | 'pending' | 'clear' | 'resolved'

interface BoardingPlacement {
  boardingPlacementId: number
  residentId: number | null
  residentInternalCode: string | null
  residentCaseControlNo: string | null
  residentCaseStatus: string | null
  residentRiskLevel: string | null
  residentHasSpecialNeeds: boolean | null
  residentSpecialNeedsDiagnosis: string | null
  residentDateOfAdmission: string | null
  residentDateOfBirth: string | null
  safehouseId: number | null
  safehouseName: string | null
  safehouseRegion: string | null
  safehouseCapacityGirls: number | null
  placementStatus: string | null
  confidentialResidentName: string | null
  bedLabel: string | null
  expectedCheckIn: string | null
  expectedCheckOut: string | null
  actualCheckIn: string | null
  actualCheckOut: string | null
  sensitivities: string | null
  specialConsiderations: string | null
  relationshipSummary: string | null
  childrenSummary: string | null
  placementNotes: string | null
  incidentActionRequired: boolean
  incidentAlertCount: number
  latestIncidentType: string | null
  latestIncidentDate: string | null
  latestIncidentSeverity: string | null
  incidentFollowUpRequired: boolean
  incidents: IncidentReportRecord[]
}

interface ApiResident {
  residentId: number
}

interface ApiSafehouse {
  safehouseId: number
  name: string
  region: string | null
  capacityGirls: number | null
}

interface IncidentReportRecord {
  incidentId: number
  residentId: number | null
  safehouseId: number | null
  incidentDate: string | null
  incidentType: string | null
  severity: string | null
  description: string | null
  responseTaken: string | null
  resolved: boolean | null
  resolutionDate: string | null
  reportedBy: string | null
  followUpRequired: boolean | null
  assignedStaffUserId: string | null
  assignedStaffDisplayName: string | null
}

interface StaffDirectoryEntry {
  id: string
  email: string | null
  userName: string | null
  displayName: string
  roles: string[]
}

interface BedSlot {
  slotNumber: number
  label: string
  status: BedVisualStatus
  placement: BoardingPlacement | null
  isOverflow: boolean
}

interface SafehouseBoard {
  safehouse: ApiSafehouse
  capacity: number
  currentCount: number
  incomingCount: number
  openBeds: number
  actionCount: number
  pendingCount: number
  slots: BedSlot[]
}

interface DraggedPlacementState {
  placementId: number
  sourceSafehouseId: number
  sourceSlotNumber: number
}

interface SlotPreference {
  safehouseId: number | null
  slotNumber: number
}

const ACTIVE_STATUSES = new Set<PlacementStatus>(['Current', 'Incoming'])
const PLACEMENT_STATUSES: PlacementStatus[] = ['Incoming', 'Current', 'CheckedOut', 'Transferred', 'Cancelled']

const blankPlacementForm = {
  residentId: 'none',
  safehouseId: '',
  placementStatus: 'Incoming',
  confidentialResidentName: '',
  bedLabel: '',
  expectedCheckIn: '',
  expectedCheckOut: '',
  actualCheckIn: '',
  actualCheckOut: '',
  sensitivities: '',
  specialConsiderations: '',
  relationshipSummary: '',
  childrenSummary: '',
  placementNotes: '',
}

const ESTIMATED_STAY_DAYS_BY_RISK: Record<string, number> = {
  critical: 730,
  high: 540,
  medium: 365,
  low: 180,
}

const BED_FILTER_LABELS: Record<BedFilter, string> = {
  all: 'All bedspaces',
  actionRequired: 'Action required',
  pending: 'Pending',
  open: 'Open',
  active: 'Active',
}

const INCIDENT_RESPONSE_OPTIONS: Array<{
  value: string
  label: string
  Icon: LucideIcon
  badgeClassName: string
}> = [
  {
    value: 'Safety plan activated',
    label: 'Safety plan',
    Icon: ShieldCheck,
    badgeClassName: 'border-sky-200 bg-sky-50 text-sky-700',
  },
  {
    value: 'Clinical support arranged',
    label: 'Clinical support',
    Icon: HeartPulse,
    badgeClassName: 'border-rose-200 bg-rose-50 text-rose-700',
  },
  {
    value: 'Counseling session',
    label: 'Counseling session',
    Icon: Users,
    badgeClassName: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  },
  {
    value: 'Case review scheduled',
    label: 'Case review',
    Icon: ClipboardList,
    badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  {
    value: 'Supervisor notified',
    label: 'Supervisor notified',
    Icon: Users,
    badgeClassName: 'border-violet-200 bg-violet-50 text-violet-700',
  },
  {
    value: 'Agency contacted',
    label: 'Agency contacted',
    Icon: PhoneCall,
    badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  {
    value: 'Placement transfer review',
    label: 'Transfer review',
    Icon: MapPinned,
    badgeClassName: 'border-zinc-200 bg-zinc-50 text-zinc-700',
  },
]

function parseDateValue(value: string | null | undefined) {
  if (!value) return null

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch
    return new Date(Number(year), Number(month) - 1, Number(day))
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not set'
  const date = parseDateValue(value)
  if (!date) return value
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function toDateOnlyValue(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(value: string, days: number) {
  const baseDate = parseDateValue(value)
  if (!baseDate) return null

  const next = new Date(baseDate)
  next.setDate(next.getDate() + days)
  return toDateOnlyValue(next)
}

function differenceInDays(start: string, end: string) {
  const startDate = parseDateValue(start)
  const endDate = parseDateValue(end)
  if (!startDate || !endDate) return null

  const startUtc = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
  const endUtc = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
  return Math.floor((endUtc - startUtc) / 86400000)
}

function residentLabel(placement: BoardingPlacement) {
  if (placement.residentInternalCode) return placement.residentInternalCode
  if (placement.residentCaseControlNo) return placement.residentCaseControlNo
  if (placement.residentId != null) return `Resident ${placement.residentId}`
  return 'Pending intake'
}

function compactResidentLabel(placement: BoardingPlacement | null) {
  if (!placement) return 'Open'
  if (placement.residentId != null) return `ID ${placement.residentId}`
  return placement.residentInternalCode ?? placement.residentCaseControlNo ?? 'Pending'
}

function tileResidentLabel(placement: BoardingPlacement | null) {
  if (!placement) return 'Open'
  if (placement.residentInternalCode) return placement.residentInternalCode
  if (placement.residentCaseControlNo) return placement.residentCaseControlNo
  if (placement.residentId != null) return `Resident ${placement.residentId}`
  return 'Pending'
}

function residentTitleLabel(placement: BoardingPlacement) {
  if (placement.residentInternalCode) return `Resident ${placement.residentInternalCode}`
  if (placement.residentCaseControlNo) return `Resident ${placement.residentCaseControlNo}`
  if (placement.residentId != null) return `Resident ${placement.residentId}`
  return 'Pending intake'
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function placementStartValue(placement: BoardingPlacement) {
  return placement.placementStatus === 'Incoming'
    ? placement.expectedCheckIn
    : placement.actualCheckIn ?? placement.expectedCheckIn
}

function placementEndValue(placement: BoardingPlacement) {
  return placement.placementStatus === 'Incoming'
    ? placement.expectedCheckOut
    : placement.actualCheckOut ?? placement.expectedCheckOut
}

function placementStartLabel(placement: BoardingPlacement) {
  const start = placementStartValue(placement)
  return start ? formatDate(start) : 'Pending'
}

function placementEndLabel(placement: BoardingPlacement) {
  const end = placementEndValue(placement)
  if (end) return formatDate(end)
  return placement.placementStatus === 'Incoming' ? 'TBD' : 'Ongoing'
}

function placementAdmittanceValue(placement: BoardingPlacement) {
  return placement.residentDateOfAdmission ?? placement.actualCheckIn ?? placement.expectedCheckIn
}

function placementAdmittanceLabel(placement: BoardingPlacement) {
  const admittance = placementAdmittanceValue(placement)
  return admittance ? formatDate(admittance) : 'Pending'
}

function eighteenthBirthdayValue(placement: BoardingPlacement) {
  if (!placement.residentDateOfBirth) return null
  const birthDate = parseDateValue(placement.residentDateOfBirth)
  if (!birthDate) return null

  const eighteenthBirthday = new Date(birthDate)
  eighteenthBirthday.setFullYear(eighteenthBirthday.getFullYear() + 18)
  return toDateOnlyValue(eighteenthBirthday)
}

function estimatedPlacementDays(placement: BoardingPlacement) {
  const riskLevel = (placement.residentRiskLevel ?? '').toLowerCase()
  return ESTIMATED_STAY_DAYS_BY_RISK[riskLevel] ?? 270
}

function placementEstimatedEndValue(placement: BoardingPlacement) {
  const admittance = placementAdmittanceValue(placement)
  if (!admittance) return null

  const riskWindowDays = estimatedPlacementDays(placement)
  const eighteenthBirthday = eighteenthBirthdayValue(placement)
  const daysUntil18 = eighteenthBirthday ? differenceInDays(admittance, eighteenthBirthday) : null
  const protectedStayDays =
    daysUntil18 != null && daysUntil18 > 0
      ? Math.min(riskWindowDays, daysUntil18)
      : riskWindowDays

  return addDays(admittance, protectedStayDays)
}

function placementEstimatedEndLabel(placement: BoardingPlacement) {
  const estimatedEnd = placementEstimatedEndValue(placement)
  return estimatedEnd ? formatDate(estimatedEnd) : 'Pending'
}

function incidentWorkflowBadgeClass(status: IncidentWorkflowStatus) {
  switch (status) {
    case 'action':
      return 'border-red-200 bg-red-50 text-red-700'
    case 'pending':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'resolved':
    case 'clear':
    default:
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }
}

function normalizeSearchTerm(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function stayWindowLabel(placement: BoardingPlacement) {
  return `${placementStartLabel(placement)} - ${placementEndLabel(placement)}`
}

function daySpan(start: string, end: string) {
  const days = differenceInDays(start, end)
  return days == null ? null : Math.max(days + 1, 1)
}

function placementLengthLabel(placement: BoardingPlacement) {
  const start = placementStartValue(placement)
  if (!start) return 'Pending'

  const end = placementEndValue(placement)
  if (placement.placementStatus === 'Incoming' && !placement.actualCheckIn) {
    if (!end) return 'Open-ended'
    const plannedDays = daySpan(start, end)
    return plannedDays ? `${plannedDays} days planned` : 'Planned stay'
  }

  const comparisonEnd = end ?? new Date().toISOString()
  const days = daySpan(start, comparisonEnd)
  return days ? `${days} days` : 'Ongoing'
}

function placementDimensionLabel(status: string | null | undefined) {
  switch (status) {
    case 'Current':
      return 'Placement: Active'
    case 'Incoming':
      return 'Placement: Incoming'
    case 'CheckedOut':
      return 'Placement: Checked out'
    case 'Transferred':
      return 'Placement: Transferred'
    case 'Cancelled':
      return 'Placement: Cancelled'
    default:
      return 'Placement: Unknown'
  }
}

function riskBadgeClass(level: string | null | undefined) {
  switch ((level ?? '').toLowerCase()) {
    case 'critical':
      return 'border-rose-300 bg-rose-100 text-rose-800'
    case 'high':
      return 'border-red-200 bg-red-50 text-red-700'
    case 'medium':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'low':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    default:
      return 'border-zinc-200 bg-zinc-50 text-zinc-600'
  }
}

function placementStatusClass(status: string | null | undefined) {
  switch (status) {
    case 'Current':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'Incoming':
      return 'border-sky-200 bg-sky-50 text-sky-700'
    case 'Transferred':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'CheckedOut':
      return 'border-zinc-200 bg-zinc-50 text-zinc-600'
    case 'Cancelled':
      return 'border-rose-200 bg-rose-50 text-rose-700'
    default:
      return 'border-zinc-200 bg-zinc-50 text-zinc-600'
  }
}

function bedTileClass(status: BedVisualStatus) {
  switch (status) {
    case 'action':
      return 'border-red-200 bg-red-50/80 hover:border-red-300'
    case 'pending':
      return 'border-amber-200 bg-amber-50/90 hover:border-amber-300'
    case 'current':
      return 'border-emerald-200 bg-emerald-50/80 hover:border-emerald-300'
    case 'incoming':
      return 'border-sky-200 bg-sky-50/80 hover:border-sky-300'
    default:
      return 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
  }
}

function bedIconClass(status: BedVisualStatus) {
  switch (status) {
    case 'action':
      return 'text-red-700'
    case 'pending':
      return 'text-amber-700'
    case 'current':
      return 'text-emerald-700'
    case 'incoming':
      return 'text-sky-700'
    default:
      return 'text-zinc-400'
  }
}

function bedPreviewDotClass(status: BedVisualStatus) {
  switch (status) {
    case 'action':
      return 'border-red-200 bg-red-500'
    case 'pending':
      return 'border-amber-200 bg-amber-500'
    case 'current':
      return 'border-emerald-200 bg-emerald-500'
    case 'incoming':
      return 'border-sky-200 bg-sky-500'
    default:
      return 'border-zinc-200 bg-zinc-200'
  }
}

function incidentSummary(placement: BoardingPlacement) {
  if (!placement.incidentActionRequired) return null
  const parts: string[] = []
  if (placement.incidentAlertCount > 0) {
    parts.push(placement.incidentAlertCount === 1 ? '1 unresolved incident' : `${placement.incidentAlertCount} unresolved incidents`)
  }
  if (placement.latestIncidentType) parts.push(placement.latestIncidentType)
  if (placement.incidentFollowUpRequired) parts.push('action required')
  return parts.length > 0 ? parts.join(' - ') : 'Bed space action needed'
}

function sortIncidents(records: IncidentReportRecord[]) {
  return [...records].sort((a, b) => {
    const aResolvedRank = a.resolved === true ? 1 : 0
    const bResolvedRank = b.resolved === true ? 1 : 0
    if (aResolvedRank !== bResolvedRank) return aResolvedRank - bResolvedRank

    const aDate = parseDateValue(a.incidentDate)?.getTime() ?? 0
    const bDate = parseDateValue(b.incidentDate)?.getTime() ?? 0
    if (aDate !== bDate) return bDate - aDate
    return b.incidentId - a.incidentId
  })
}

function unresolvedIncidents(records: IncidentReportRecord[]) {
  return sortIncidents(records).filter((incident) => !(incident.resolved ?? false))
}

function incidentWorkflowState(records: IncidentReportRecord[]) {
  const openIncidents = unresolvedIncidents(records)
  if (openIncidents.length === 0) return 'clear'
  return openIncidents.some((incident) => !incidentIsPending(incident))
    ? 'action'
    : 'pending'
}

function incidentHasAssignedStaff(incident: IncidentReportRecord) {
  return hasText(incident.assignedStaffDisplayName) || hasText(incident.assignedStaffUserId)
}

function incidentHasSelectedResponse(incident: IncidentReportRecord) {
  return hasText(incident.responseTaken)
}

function incidentIsPending(incident: IncidentReportRecord) {
  return incidentHasAssignedStaff(incident) && incidentHasSelectedResponse(incident)
}

function bedspaceIncidentBadgeClass(incident: IncidentReportRecord) {
  return incidentIsPending(incident)
    ? 'border-amber-200 bg-amber-50 text-amber-700 shadow-sm'
    : 'border-red-200 bg-red-50 text-red-700 shadow-sm'
}

function incidentActionIconButtonClass() {
  return 'h-8 w-8 rounded-full p-0'
}

function incidentTypeMeta(type: string | null | undefined) {
  switch ((type ?? '').toLowerCase()) {
    case 'security':
      return { Icon: ShieldAlert, className: 'border-red-200 bg-red-50 text-red-700', label: 'Security' }
    case 'selfharm':
      return { Icon: HeartPulse, className: 'border-rose-200 bg-rose-50 text-rose-700', label: 'Self-harm' }
    case 'medical':
      return { Icon: Stethoscope, className: 'border-sky-200 bg-sky-50 text-sky-700', label: 'Medical' }
    case 'runawayattempt':
      return { Icon: Siren, className: 'border-orange-200 bg-orange-50 text-orange-700', label: 'Runaway attempt' }
    case 'behavioral':
      return { Icon: TriangleAlert, className: 'border-amber-200 bg-amber-50 text-amber-700', label: 'Behavioral' }
    case 'conflictwithpeer':
      return { Icon: Users, className: 'border-violet-200 bg-violet-50 text-violet-700', label: 'Peer conflict' }
    case 'propertydamage':
      return { Icon: Megaphone, className: 'border-zinc-200 bg-zinc-50 text-zinc-700', label: 'Property damage' }
    default:
      return { Icon: ShieldAlert, className: 'border-zinc-200 bg-zinc-50 text-zinc-700', label: type ?? 'Incident' }
  }
}

function responseOptionMeta(value: string | null | undefined) {
  if (!value) return null
  return INCIDENT_RESPONSE_OPTIONS.find((option) => option.value === value) ?? {
    value,
    label: value,
    Icon: FileCheck,
    badgeClassName: 'border-zinc-200 bg-zinc-50 text-zinc-700',
  }
}

function initialsForName(value: string | null | undefined) {
  if (!value) return 'ST'
  const parts = value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)

  if (parts.length === 0) return 'ST'
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('')
}

function bedActionItems(slot: BedSlot) {
  if (!slot.placement) return []

  const items: string[] = []
  if (slot.isOverflow) {
    items.push(
      slot.placement.safehouseCapacityGirls && slot.placement.safehouseCapacityGirls > 0
        ? `Over capacity: this placement exceeds the configured ${slot.placement.safehouseCapacityGirls}-bed limit for the safehouse.`
        : 'Capacity review needed: this safehouse does not have a bed capacity configured.',
    )
  }

  const incidentAction = incidentSummary(slot.placement)
  if (incidentAction) items.push(incidentAction)

  return items
}

function bedAriaLabel(slot: BedSlot) {
  if (!slot.placement) return `${slot.label}, open bed`

  const state =
    slot.status === 'action'
      ? 'action required'
      : slot.status === 'pending'
        ? 'pending follow-up'
      : slot.status === 'incoming'
        ? 'incoming hold'
        : 'current resident'
  const reasons = bedActionItems(slot)

  return reasons.length > 0
    ? `${slot.label}, ${compactResidentLabel(slot.placement)}, ${state}, ${reasons.join(', ')}`
    : `${slot.label}, ${compactResidentLabel(slot.placement)}, ${state}`
}

function parseBedNumber(placement: BoardingPlacement) {
  const match = placement.bedLabel?.match(/(\d+)/)
  return match ? Number(match[1]) : null
}

function preferredSlotNumber(
  placement: BoardingPlacement,
  slotPreferences: Record<number, SlotPreference>,
) {
  const explicitBed = parseBedNumber(placement)
  if (explicitBed != null) return explicitBed

  const preferred = slotPreferences[placement.boardingPlacementId]
  if (preferred && preferred.safehouseId === placement.safehouseId) return preferred.slotNumber

  return null
}

function buildBoard(
  safehouse: ApiSafehouse,
  placements: BoardingPlacement[],
  slotPreferences: Record<number, SlotPreference>,
): SafehouseBoard {
  const current = placements.filter((p) => p.safehouseId === safehouse.safehouseId && p.placementStatus === 'Current')
  const incoming = placements.filter((p) => p.safehouseId === safehouse.safehouseId && p.placementStatus === 'Incoming')
  const capacity = Math.max(safehouse.capacityGirls ?? 0, 0)
  const slotCount = Math.max(capacity, current.length + incoming.length)
  const assignments = new Map<number, BoardingPlacement>()
  const openIncidents = [...current, ...incoming]
    .flatMap((placement) => unresolvedIncidents(placement.incidents ?? []))
  const pendingCount = openIncidents.filter((incident) => incidentIsPending(incident)).length
  const actionCount = openIncidents.length - pendingCount

  const ordered = [...current, ...incoming].sort((a, b) => {
    const aBed = preferredSlotNumber(a, slotPreferences) ?? Number.MAX_SAFE_INTEGER
    const bBed = preferredSlotNumber(b, slotPreferences) ?? Number.MAX_SAFE_INTEGER
    if (aBed !== bBed) return aBed - bBed
    return (a.residentId ?? 999999) - (b.residentId ?? 999999)
  })

  for (const placement of ordered) {
    const preferred = preferredSlotNumber(placement, slotPreferences)
    if (preferred && preferred >= 1 && preferred <= slotCount && !assignments.has(preferred)) {
      assignments.set(preferred, placement)
      continue
    }
    for (let slot = 1; slot <= slotCount; slot += 1) {
      if (!assignments.has(slot)) {
        assignments.set(slot, placement)
        break
      }
    }
  }

  const slots = Array.from({ length: slotCount }, (_, index) => {
    const slotNumber = index + 1
    const placement = assignments.get(slotNumber) ?? null
    const overCapacity = capacity > 0 ? slotNumber > capacity : placement != null
    const placementIncidentState = placement ? incidentWorkflowState(placement.incidents ?? []) : 'clear'
    const status: BedVisualStatus =
      placement == null
        ? 'empty'
        : overCapacity || placementIncidentState === 'action'
          ? 'action'
          : placementIncidentState === 'pending'
            ? 'pending'
          : placement.placementStatus === 'Incoming'
            ? 'incoming'
            : 'current'

    return {
      slotNumber,
      placement,
      status,
      label: placement?.bedLabel?.trim() || (overCapacity ? `Overflow ${Math.max(slotNumber - capacity, 1)}` : `Bed ${slotNumber}`),
      isOverflow: overCapacity && placement != null,
    }
  })

  return {
    safehouse,
    capacity,
    currentCount: current.length,
    incomingCount: incoming.length,
    openBeds: Math.max(capacity - current.length - incoming.length, 0),
    actionCount,
    pendingCount,
    slots,
  }
}

function searchTermMatchesBoard(term: string, board: SafehouseBoard) {
  const query = term.trim().toLowerCase()
  const haystack = `${board.safehouse.name} ${board.safehouse.region ?? ''}`.toLowerCase()
  if (haystack.includes(query)) return true

  const occupiedBeds = board.currentCount + board.incomingCount
  const capacityBase = Math.max(board.capacity || board.slots.length, 1)
  const occupancyRate = occupiedBeds / capacityBase
  const hasActionItems = board.actionCount > 0 || board.slots.some((slot) => slot.isOverflow)
  const hasOverflow = board.slots.some((slot) => slot.isOverflow)
  const hasCriticalRisk = board.slots.some((slot) => slot.placement?.residentRiskLevel?.toLowerCase() === 'critical')
  const hasHighRisk = board.slots.some((slot) => slot.placement?.residentRiskLevel?.toLowerCase() === 'high')
  const hasMediumRisk = board.slots.some((slot) => slot.placement?.residentRiskLevel?.toLowerCase() === 'medium')
  const hasLowRisk = board.slots.some((slot) => slot.placement?.residentRiskLevel?.toLowerCase() === 'low')

  if (
    query.includes('open incident')
    || query.includes('has open incidents')
    || query.includes('action required')
    || query.includes('follow-up')
  ) {
    return hasActionItems
  }

  if (query.includes('pending')) {
    return board.pendingCount > 0
  }

  if (query.includes('available bed') || query.includes('open bed')) {
    return board.openBeds > 0
  }

  if (query.includes('overflow') || query.includes('over capacity')) {
    return hasOverflow
  }

  if (query.includes('occupancy')) {
    if (query.includes('high')) return occupancyRate >= 0.85
    if (query.includes('medium')) return occupancyRate >= 0.5 && occupancyRate < 0.85
    if (query.includes('low')) return occupancyRate < 0.5
    return occupiedBeds > 0
  }

  if (query === 'full') {
    return board.openBeds === 0 && !hasOverflow
  }

  if (query.includes('risk')) {
    if (query.includes('critical')) return hasCriticalRisk
    if (query.includes('high')) return hasHighRisk
    if (query.includes('medium')) return hasMediumRisk
    if (query.includes('low')) return hasLowRisk
  }

  return false
}

function slotMatchesFilter(slot: BedSlot, filter: BedFilter) {
  switch (filter) {
    case 'actionRequired':
      return slot.status === 'action'
    case 'pending':
      return slot.status === 'pending'
    case 'open':
      return slot.placement == null
    case 'active':
      return slot.placement?.placementStatus === 'Current'
    default:
      return true
  }
}

function emptyFilterMessage(filter: BedFilter) {
  switch (filter) {
    case 'actionRequired':
      return 'No bedspaces in this safehouse currently need action.'
    case 'pending':
      return 'No bedspaces in this safehouse are currently pending.'
    case 'open':
      return 'No open bedspaces are available in this safehouse.'
    case 'active':
      return 'No active placements are in this safehouse right now.'
    default:
      return 'No bedspaces are configured for this safehouse yet.'
  }
}

function placementUpdatePayload(placement: BoardingPlacement) {
  return {
    boardingPlacementId: placement.boardingPlacementId,
    residentId: placement.residentId ?? undefined,
    safehouseId: placement.safehouseId ?? undefined,
    placementStatus: placement.placementStatus ?? undefined,
    confidentialResidentName: placement.confidentialResidentName || undefined,
    bedLabel: placement.bedLabel || undefined,
    expectedCheckIn: placement.expectedCheckIn || undefined,
    expectedCheckOut: placement.expectedCheckOut || undefined,
    actualCheckIn: placement.actualCheckIn || undefined,
    actualCheckOut: placement.actualCheckOut || undefined,
    sensitivities: placement.sensitivities || undefined,
    specialConsiderations: placement.specialConsiderations || undefined,
    relationshipSummary: placement.relationshipSummary || undefined,
    childrenSummary: placement.childrenSummary || undefined,
    placementNotes: placement.placementNotes || undefined,
  }
}

export function BoardingManagement() {
  usePageTitle('Safehouse Operations')

  const { authSession } = useAuth()
  const canEdit = authSession.roles.includes('Admin')

  const [placements, setPlacements] = useState<BoardingPlacement[]>([])
  const [residents, setResidents] = useState<ApiResident[]>([])
  const [safehouses, setSafehouses] = useState<ApiSafehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [savingPlacement, setSavingPlacement] = useState(false)
  const [movingPlacementId, setMovingPlacementId] = useState<number | null>(null)
  const [slotPreferences, setSlotPreferences] = useState<Record<number, SlotPreference>>({})
  const [safehouseSearchTerms, setSafehouseSearchTerms] = useState<string[]>([])
  const [safehouseSearchInput, setSafehouseSearchInput] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<BedFilter>('all')
  const [expandedSafehouses, setExpandedSafehouses] = useState<Set<number>>(new Set())
  const [draggedPlacement, setDraggedPlacement] = useState<DraggedPlacementState | null>(null)
  const [selectedBed, setSelectedBed] = useState<{ board: SafehouseBoard; slot: BedSlot } | null>(null)
  const [staffDirectory, setStaffDirectory] = useState<StaffDirectoryEntry[]>([])
  const [historyDialogResidentLabel, setHistoryDialogResidentLabel] = useState('')
  const [historyPlacements, setHistoryPlacements] = useState<BoardingPlacement[]>([])
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [incidentListExpanded, setIncidentListExpanded] = useState(false)
  const [updatingIncidentId, setUpdatingIncidentId] = useState<number | null>(null)
  const [staffPickerIncidentId, setStaffPickerIncidentId] = useState<number | null>(null)
  const [responsePickerIncidentId, setResponsePickerIncidentId] = useState<number | null>(null)
  const [pendingDeletePlacement, setPendingDeletePlacement] = useState<BoardingPlacement | null>(null)
  const [placementDialogOpen, setPlacementDialogOpen] = useState(false)
  const [editingPlacementId, setEditingPlacementId] = useState<number | null>(null)
  const [placementForm, setPlacementForm] = useState(blankPlacementForm)
  const dragPreviewRef = useRef<HTMLDivElement | null>(null)
  const dragPreviewLabelRef = useRef<HTMLSpanElement | null>(null)
  const suppressBedClickRef = useRef(false)
  const autoExpandTimeoutRef = useRef<number | null>(null)
  const autoExpandTargetRef = useRef<number | null>(null)

  const fetchData = useCallback(async ({ showLoading = true }: { showLoading?: boolean } = {}) => {
    if (showLoading) setLoading(true)
    try {
      const [placementData, residentData, safehouseData, staffData] = await Promise.all([
        api.get<BoardingPlacement[]>('/api/boarding/placements'),
        api.get<ApiResident[]>('/api/residents'),
        api.get<ApiSafehouse[]>('/api/safehouses'),
        api.get<StaffDirectoryEntry[]>('/api/staff/directory'),
      ])
      setPlacements(placementData)
      setResidents(residentData)
      setSafehouses(safehouseData)
      setStaffDirectory(staffData)
    } catch (err) {
      console.error('Failed to load boarding data', err)
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const activePlacements = useMemo(
    () => placements.filter((p) => ACTIVE_STATUSES.has((p.placementStatus ?? '') as PlacementStatus)),
    [placements],
  )

  const pendingSearchTerm = useMemo(() => normalizeSearchTerm(safehouseSearchInput), [safehouseSearchInput])

  const activeSearchTerms = useMemo(() => {
    if (!pendingSearchTerm) return safehouseSearchTerms
    if (safehouseSearchTerms.some((term) => term.toLowerCase() === pendingSearchTerm.toLowerCase())) {
      return safehouseSearchTerms
    }
    return [...safehouseSearchTerms, pendingSearchTerm]
  }, [pendingSearchTerm, safehouseSearchTerms])

  const safehouseSuggestions = useMemo(() => {
    const query = safehouseSearchInput.trim().toLowerCase()
    if (!query) return []

    const selectedTerms = new Set(safehouseSearchTerms.map((term) => term.toLowerCase()))
    return safehouses
      .filter((safehouse) => {
        const name = safehouse.name.toLowerCase()
        const region = (safehouse.region ?? '').toLowerCase()
        return name.includes(query) || region.includes(query)
      })
      .filter((safehouse) => !selectedTerms.has(safehouse.name.toLowerCase()))
      .slice(0, 8)
  }, [safehouseSearchInput, safehouseSearchTerms, safehouses])

  const boards = useMemo(() => {
    const builtBoards = safehouses.map((safehouse) => buildBoard(safehouse, activePlacements, slotPreferences))
    if (activeSearchTerms.length === 0) return builtBoards
    return builtBoards.filter((board) => activeSearchTerms.some((term) => searchTermMatchesBoard(term, board)))
  }, [activePlacements, activeSearchTerms, safehouses, slotPreferences])

  const bedFilterCounts = useMemo(() => (
    boards.reduce<Record<BedFilter, number>>((counts, board) => {
      counts.all += board.slots.length
      counts.actionRequired += board.slots.filter((slot) => slotMatchesFilter(slot, 'actionRequired')).length
      counts.pending += board.slots.filter((slot) => slotMatchesFilter(slot, 'pending')).length
      counts.open += board.slots.filter((slot) => slotMatchesFilter(slot, 'open')).length
      counts.active += board.slots.filter((slot) => slotMatchesFilter(slot, 'active')).length
      return counts
    }, {
      all: 0,
      actionRequired: 0,
      pending: 0,
      open: 0,
      active: 0,
    })
  ), [boards])

  useEffect(() => {
    setSlotPreferences((prev) => {
      const activePlacementIds = new Set(activePlacements.map((placement) => placement.boardingPlacementId))
      const next: Record<number, SlotPreference> = {}
      let changed = false

      for (const placement of activePlacements) {
        const existing = prev[placement.boardingPlacementId]
        if (existing) next[placement.boardingPlacementId] = existing
      }

      for (const board of boards) {
        for (const slot of board.slots) {
          if (!slot.placement) continue

          const placementId = slot.placement.boardingPlacementId
          const preferred = {
            safehouseId: board.safehouse.safehouseId,
            slotNumber: slot.slotNumber,
          }

          next[placementId] = preferred
          const previous = prev[placementId]
          if (!previous || previous.safehouseId !== preferred.safehouseId || previous.slotNumber !== preferred.slotNumber) {
            changed = true
          }
        }
      }

      if (!changed) {
        for (const placementId of Object.keys(prev)) {
          if (!activePlacementIds.has(Number(placementId))) {
            changed = true
            break
          }
        }
      }

      return changed ? next : prev
    })
  }, [activePlacements, boards])

  useEffect(() => {
    if (boards.length === 0) {
      setExpandedSafehouses(new Set())
      return
    }

    setExpandedSafehouses((prev) => {
      if (activeSearchTerms.length > 0) {
        return new Set([boards[0].safehouse.safehouseId])
      }

      const boardIds = new Set(boards.map((board) => board.safehouse.safehouseId))
      const next = new Set([...prev].filter((id) => boardIds.has(id)))

      if (next.size === 0) {
        next.add(boards[0].safehouse.safehouseId)
      }

      return next
    })
  }, [activeSearchTerms.length, boards])

  useEffect(() => {
    setSelectedBed((prev) => {
      if (!prev) return prev

      const placementId = prev.slot.placement?.boardingPlacementId
      if (placementId != null) {
        for (const board of boards) {
          const slot = board.slots.find((candidate) => candidate.placement?.boardingPlacementId === placementId)
          if (slot) return { board, slot }
        }
        return null
      }

      const board = boards.find((candidate) => candidate.safehouse.safehouseId === prev.board.safehouse.safehouseId)
      if (!board) return null

      const slot = board.slots.find((candidate) => candidate.slotNumber === prev.slot.slotNumber)
      return slot ? { board, slot } : null
    })
  }, [boards])

  useEffect(() => {
    setIncidentListExpanded(false)
    setStaffPickerIncidentId(null)
    setResponsePickerIncidentId(null)
  }, [
    selectedBed?.board.safehouse.safehouseId,
    selectedBed?.slot.slotNumber,
    selectedBed?.slot.placement?.boardingPlacementId,
  ])

  useEffect(() => () => {
    if (autoExpandTimeoutRef.current != null) window.clearTimeout(autoExpandTimeoutRef.current)
  }, [])

  function addSafehouseSearchTerms(rawValue: string) {
    const term = normalizeSearchTerm(rawValue)
    if (!term) return

    setSafehouseSearchTerms((prev) => {
      if (prev.some((existing) => existing.toLowerCase() === term.toLowerCase())) return prev
      return [...prev, term]
    })
    setSafehouseSearchInput('')
  }

  function removeSafehouseSearchTerm(term: string) {
    setSafehouseSearchTerms((prev) => prev.filter((existing) => existing.toLowerCase() !== term.toLowerCase()))
  }

  function addSafehouseSuggestion(safehouse: ApiSafehouse) {
    addSafehouseSearchTerms(safehouse.name)
  }

  function openAddPlacement(prefill?: { safehouseId?: number; slotNumber?: number }) {
    setEditingPlacementId(null)
    setPlacementForm({
      ...blankPlacementForm,
      safehouseId: prefill?.safehouseId ? String(prefill.safehouseId) : '',
      bedLabel: prefill?.slotNumber ? `Bed ${prefill.slotNumber}` : '',
      placementStatus: 'Incoming',
    })
    setPlacementDialogOpen(true)
  }

  function openEditPlacement(placement: BoardingPlacement) {
    setEditingPlacementId(placement.boardingPlacementId)
    setPlacementForm({
      residentId: placement.residentId != null ? String(placement.residentId) : 'none',
      safehouseId: placement.safehouseId != null ? String(placement.safehouseId) : '',
      placementStatus: placement.placementStatus ?? 'Incoming',
      confidentialResidentName: placement.confidentialResidentName ?? '',
      bedLabel: placement.bedLabel ?? '',
      expectedCheckIn: placement.expectedCheckIn ? placement.expectedCheckIn.split('T')[0] : '',
      expectedCheckOut: placement.expectedCheckOut ? placement.expectedCheckOut.split('T')[0] : '',
      actualCheckIn: placement.actualCheckIn ? placement.actualCheckIn.split('T')[0] : '',
      actualCheckOut: placement.actualCheckOut ? placement.actualCheckOut.split('T')[0] : '',
      sensitivities: placement.sensitivities ?? '',
      specialConsiderations: placement.specialConsiderations ?? '',
      relationshipSummary: placement.relationshipSummary ?? '',
      childrenSummary: placement.childrenSummary ?? '',
      placementNotes: placement.placementNotes ?? '',
    })
    setPlacementDialogOpen(true)
  }

  async function handleSavePlacement() {
    if (!placementForm.safehouseId) return alert('Safehouse is required.')
    setSavingPlacement(true)
    try {
      const payload = {
        residentId: placementForm.residentId !== 'none' ? Number(placementForm.residentId) : undefined,
        safehouseId: Number(placementForm.safehouseId),
        placementStatus: placementForm.placementStatus,
        confidentialResidentName: placementForm.confidentialResidentName || undefined,
        bedLabel: placementForm.bedLabel || undefined,
        expectedCheckIn: placementForm.expectedCheckIn || undefined,
        expectedCheckOut: placementForm.expectedCheckOut || undefined,
        actualCheckIn: placementForm.actualCheckIn || undefined,
        actualCheckOut: placementForm.actualCheckOut || undefined,
        sensitivities: placementForm.sensitivities || undefined,
        specialConsiderations: placementForm.specialConsiderations || undefined,
        relationshipSummary: placementForm.relationshipSummary || undefined,
        childrenSummary: placementForm.childrenSummary || undefined,
        placementNotes: placementForm.placementNotes || undefined,
      }
      if (editingPlacementId) await api.put(`/api/boarding/placements/${editingPlacementId}`, { boardingPlacementId: editingPlacementId, ...payload })
      else await api.post('/api/boarding/placements', payload)
      setPlacementDialogOpen(false)
      setPlacementForm(blankPlacementForm)
      setEditingPlacementId(null)
      await fetchData()
    } catch (err) {
      console.error('Failed to save boarding placement', err)
    } finally {
      setSavingPlacement(false)
    }
  }

  async function handleDeletePlacement(id: number) {
    try {
      setPendingDeletePlacement(null)
      setSelectedBed(null)
      await api.delete(`/api/boarding/placements/${id}`)
      await fetchData()
    } catch (err) {
      console.error('Failed to delete boarding placement', err)
    }
  }

  async function openPlacementHistory(placement: BoardingPlacement) {
    if (placement.residentId == null) {
      toast({
        title: 'History unavailable',
        description: 'This placement is not linked to a resident yet.',
      })
      return
    }

    const residentLabel = residentTitleLabel(placement)
    setHistoryDialogResidentLabel(residentLabel)
    setHistoryPlacements([])
    setHistoryDialogOpen(true)
    setHistoryLoading(true)

    try {
      const residentPlacements = await api.get<BoardingPlacement[]>(`/api/boarding/placements?residentId=${placement.residentId}`)
      const sortedPlacements = [...residentPlacements].sort((a, b) => {
        const aDate = new Date(a.actualCheckIn ?? a.expectedCheckIn ?? 0).getTime()
        const bDate = new Date(b.actualCheckIn ?? b.expectedCheckIn ?? 0).getTime()
        return bDate - aDate
      })
      setHistoryPlacements(sortedPlacements)
    } catch (err) {
      console.error('Failed to load placement history', err)
      toast({
        title: 'Unable to load history',
        description: 'Please try again in a moment.',
      })
      setHistoryDialogOpen(false)
    } finally {
      setHistoryLoading(false)
    }
  }

  async function saveIncidentUpdate(
    incident: IncidentReportRecord,
    patch: Partial<IncidentReportRecord>,
    successToast: { title: string; description: string },
  ) {
    const today = toDateOnlyValue(new Date())
    const nextResolved = patch.resolved ?? incident.resolved ?? false
    const payload: IncidentReportRecord = {
      ...incident,
      ...patch,
      followUpRequired: nextResolved ? false : patch.followUpRequired ?? incident.followUpRequired,
      resolutionDate: nextResolved
        ? patch.resolutionDate ?? incident.resolutionDate ?? today
        : patch.resolutionDate ?? incident.resolutionDate ?? null,
    }

    setUpdatingIncidentId(incident.incidentId)
    try {
      await api.put(`/api/incidents/${incident.incidentId}`, payload)
      await fetchData({ showLoading: false })
      toast(successToast)
    } catch (err) {
      console.error('Failed to update incident', err)
      toast({
        title: 'Unable to update incident',
        description: 'Please try again in a moment.',
      })
    } finally {
      setUpdatingIncidentId(null)
    }
  }

  async function handleAssignIncidentStaff(incident: IncidentReportRecord, staffMember: StaffDirectoryEntry) {
    setStaffPickerIncidentId(null)
    await saveIncidentUpdate(incident, {
      assignedStaffUserId: staffMember.id,
      assignedStaffDisplayName: staffMember.displayName,
    }, {
      title: 'Incident assignment updated',
      description: `${staffMember.displayName} is now assigned to this incident.`,
    })
  }

  async function handleSelectIncidentResponse(incident: IncidentReportRecord, responseValue: string) {
    const response = responseOptionMeta(responseValue)
    setResponsePickerIncidentId(null)
    await saveIncidentUpdate(incident, {
      responseTaken: responseValue,
    }, {
      title: 'Incident response updated',
      description: response ? `${response.label} has been recorded.` : 'The response has been recorded.',
    })
  }

  async function markIncidentResolved(incident: IncidentReportRecord) {
    if (!canEdit) return

    await saveIncidentUpdate(incident, {
      resolved: true,
      followUpRequired: false,
    }, {
      title: 'Incident resolved',
      description: 'The action-required status has been updated.',
    })
  }

  function clearIncidentAssignment(incident: IncidentReportRecord) {
    void saveIncidentUpdate(incident, {
      assignedStaffUserId: null,
      assignedStaffDisplayName: null,
    }, {
      title: 'Incident assignment cleared',
      description: 'The incident is no longer assigned to a staff member.',
    })
  }

  function clearIncidentResponse(incident: IncidentReportRecord) {
    void saveIncidentUpdate(incident, {
      responseTaken: null,
    }, {
      title: 'Incident response cleared',
      description: 'The incident response has been removed.',
    })
  }

  function startIncidentUpdate(incidentId: number, mode: 'staff' | 'response') {
    if (mode === 'staff') {
      setStaffPickerIncidentId(incidentId)
      setResponsePickerIncidentId(null)
      return
    }

    setResponsePickerIncidentId(incidentId)
    setStaffPickerIncidentId(null)
  }

  function startMoveResident(placement: BoardingPlacement) {
    setSelectedBed(null)
    toast({
      title: `Move ${residentTitleLabel(placement)}`,
      description: 'Drag the bed card onto any open bedspace in this or another safehouse.',
    })
  }

  function toggleSafehouse(safehouseId: number) {
    setExpandedSafehouses((prev) => {
      const next = new Set(prev)
      if (next.has(safehouseId)) next.delete(safehouseId)
      else next.add(safehouseId)
      return next
    })
  }

  function clearAutoExpandTimer() {
    if (autoExpandTimeoutRef.current != null) {
      window.clearTimeout(autoExpandTimeoutRef.current)
      autoExpandTimeoutRef.current = null
    }
    autoExpandTargetRef.current = null
  }

  function scheduleAutoExpand(safehouseId: number, isExpanded: boolean) {
    if (!draggedPlacement || isExpanded) return
    if (autoExpandTargetRef.current === safehouseId) return

    clearAutoExpandTimer()
    autoExpandTargetRef.current = safehouseId
    autoExpandTimeoutRef.current = window.setTimeout(() => {
      setExpandedSafehouses((prev) => {
        const next = new Set(prev)
        next.add(safehouseId)
        return next
      })
      autoExpandTimeoutRef.current = null
      autoExpandTargetRef.current = null
    }, 300)
  }

  function releaseSuppressedClick() {
    window.setTimeout(() => {
      suppressBedClickRef.current = false
    }, 0)
  }

  function handleBedClick(board: SafehouseBoard, slot: BedSlot) {
    if (suppressBedClickRef.current) return
    setSelectedBed({ board, slot })
  }

  function slotIsDraggedSource(board: SafehouseBoard, slot: BedSlot) {
    if (!draggedPlacement) return false
    return draggedPlacement.placementId === slot.placement?.boardingPlacementId
      && draggedPlacement.sourceSafehouseId === board.safehouse.safehouseId
      && draggedPlacement.sourceSlotNumber === slot.slotNumber
  }

  function renderSlot(board: SafehouseBoard, slot: BedSlot): BedSlot {
    if (!slotIsDraggedSource(board, slot)) return slot
    return {
      ...slot,
      placement: null,
      status: 'empty',
      isOverflow: false,
    }
  }

  function handleDragStart(event: React.DragEvent<HTMLButtonElement>, board: SafehouseBoard, slot: BedSlot) {
    if (!canEdit || movingPlacementId != null || !slot.placement) return

    suppressBedClickRef.current = true
    setDraggedPlacement({
      placementId: slot.placement.boardingPlacementId,
      sourceSafehouseId: board.safehouse.safehouseId,
      sourceSlotNumber: slot.slotNumber,
    })

    if (dragPreviewLabelRef.current) {
      dragPreviewLabelRef.current.textContent = tileResidentLabel(slot.placement)
    }
    if (dragPreviewRef.current) {
      event.dataTransfer.setDragImage(dragPreviewRef.current, 18, 18)
    }

    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(slot.placement.boardingPlacementId))
  }

  function handleDragEnd() {
    clearAutoExpandTimer()
    setDraggedPlacement(null)
    releaseSuppressedClick()
  }

  async function handleDropOnBed(targetBoard: SafehouseBoard, targetSlot: BedSlot) {
    if (!draggedPlacement || movingPlacementId != null) return

    clearAutoExpandTimer()

    if (
      draggedPlacement.sourceSafehouseId === targetBoard.safehouse.safehouseId &&
      draggedPlacement.sourceSlotNumber === targetSlot.slotNumber
    ) {
      setDraggedPlacement(null)
      return
    }

    const originalPlacements = placements
    const placement = placements.find((item) => item.boardingPlacementId === draggedPlacement.placementId)
    if (!placement) {
      setDraggedPlacement(null)
      return
    }

    const targetSafehouse = safehouses.find((safehouse) => safehouse.safehouseId === targetBoard.safehouse.safehouseId)
    const updatedPlacement: BoardingPlacement = {
      ...placement,
      safehouseId: targetBoard.safehouse.safehouseId,
      safehouseName: targetSafehouse?.name ?? targetBoard.safehouse.name,
      safehouseRegion: targetSafehouse?.region ?? targetBoard.safehouse.region,
      safehouseCapacityGirls: targetSafehouse?.capacityGirls ?? targetBoard.capacity,
      bedLabel: targetSlot.label,
    }

    setDraggedPlacement(null)
    setMovingPlacementId(placement.boardingPlacementId)
    setPlacements((prev) => prev.map((item) => item.boardingPlacementId === placement.boardingPlacementId ? updatedPlacement : item))

    try {
      await api.put(`/api/boarding/placements/${placement.boardingPlacementId}`, placementUpdatePayload(updatedPlacement))
    } catch (err) {
      console.error('Failed to move boarding placement', err)
      setPlacements(originalPlacements)
    } finally {
      setMovingPlacementId(null)
      releaseSuppressedClick()
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-700" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Safehouse Operations</h1>
          <p className="mt-1 max-w-3xl text-sm text-zinc-500">
            Expand a safehouse to manage beds, review action items, and update placements.
          </p>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="relative max-w-2xl flex-1">
            <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                {safehouseSearchTerms.map((term) => (
                  <Badge key={term} variant="outline" className="gap-1 border-zinc-200 bg-zinc-50 text-zinc-700">
                    {term}
                    <button
                      type="button"
                      className="rounded-full text-zinc-500 transition hover:text-zinc-800"
                      onClick={() => removeSafehouseSearchTerm(term)}
                      aria-label={`Remove ${term} search term`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  value={safehouseSearchInput}
                  onChange={(event) => setSafehouseSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && pendingSearchTerm) {
                      event.preventDefault()
                      addSafehouseSearchTerms(safehouseSearchInput)
                      return
                    }

                    if (event.key === 'Backspace' && !safehouseSearchInput && safehouseSearchTerms.length > 0) {
                      removeSafehouseSearchTerm(safehouseSearchTerms[safehouseSearchTerms.length - 1])
                    }
                  }}
                  className="min-w-48 flex-1 border-0 bg-transparent py-1 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                  placeholder={safehouseSearchTerms.length > 0 ? 'Add another search term' : 'Search safehouses or regions'}
                  aria-label="Search safehouses by name or region"
                />
              </div>
            </div>
            {safehouseSuggestions.length > 0 && (
              <div className="absolute top-full right-0 left-0 z-20 mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
                {safehouseSuggestions.map((safehouse) => (
                  <button
                    key={safehouse.safehouseId}
                    type="button"
                    className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-zinc-50"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => addSafehouseSuggestion(safehouse)}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-zinc-900">{safehouse.name}</div>
                      <div className="truncate text-xs text-zinc-500">{safehouse.region ?? 'Region unavailable'}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'actionRequired', 'pending', 'open', 'active'] as BedFilter[]).map((filter) => (
              <Button
                key={filter}
                type="button"
                variant={selectedFilter === filter ? 'default' : 'outline'}
                className={cn(
                  'rounded-full border-zinc-200',
                  selectedFilter === filter
                    ? 'bg-violet-700 text-white hover:bg-violet-800'
                    : 'bg-white text-zinc-700 hover:bg-zinc-50',
                )}
                onClick={() => setSelectedFilter(filter)}
              >
                {BED_FILTER_LABELS[filter]}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                    selectedFilter === filter ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-600',
                  )}
                >
                  {bedFilterCounts[filter]}
                </span>
              </Button>
            ))}
          </div>
          {canEdit && (
            <div className="flex flex-wrap gap-2">
              <Button className="gap-2 bg-violet-700 hover:bg-violet-800" onClick={() => openAddPlacement()}>
                <Plus className="h-4 w-4" />
                New Placement
              </Button>
            </div>
          )}
        </div>
      </div>

      {boards.length === 0 ? (
        <Card className="border-zinc-200">
          <CardContent className="p-6 text-sm text-zinc-500">
            No safehouses match the current search.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {boards.map((board) => {
            const safehouseId = board.safehouse.safehouseId
            const isExpanded = expandedSafehouses.has(safehouseId)
            const displayCapacity = board.capacity || board.slots.length
            const visibleSlots = board.slots
              .map((slot) => renderSlot(board, slot))
              .filter((slot) => slotMatchesFilter(slot, selectedFilter))

            return (
              <Card
                key={safehouseId}
                className="overflow-hidden border-zinc-200"
                onDragOver={() => scheduleAutoExpand(safehouseId, isExpanded)}
              >
                <button
                  type="button"
                  onClick={() => toggleSafehouse(safehouseId)}
                  className="w-full text-left"
                  aria-expanded={isExpanded}
                >
                  <CardHeader className="border-b border-zinc-200 bg-white transition hover:bg-zinc-50/70">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex items-start gap-3">
                        {isExpanded ? (
                          <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-zinc-500" />
                        ) : (
                          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-zinc-500" />
                        )}
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <CardTitle className="text-lg text-zinc-900">{board.safehouse.name}</CardTitle>
                            {board.actionCount > 0 && (
                                <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
                                  {board.actionCount} action
                                </Badge>
                            )}
                            {board.pendingCount > 0 && (
                                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                                  {board.pendingCount} pending
                                </Badge>
                            )}
                          </div>
                          <CardDescription>
                            {board.safehouse.region ?? 'Region unavailable'}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-right">
                          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">Residents / Beds</div>
                          <div className="text-lg font-semibold text-zinc-900">{board.currentCount} / {displayCapacity}</div>
                        </div>
                        {board.incomingCount > 0 && (
                          <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                            {board.incomingCount} incoming
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {!isExpanded && visibleSlots.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-6 py-4">
                      {visibleSlots.map((previewSlot) => {
                        const previewLabel = previewSlot.placement
                          ? `${previewSlot.label}, ${tileResidentLabel(previewSlot.placement)}`
                          : `${previewSlot.label}, open`

                        return (
                          <span
                            key={`${board.safehouse.safehouseId}-${previewSlot.slotNumber}-preview`}
                            className={cn('h-3.5 w-3.5 rounded-full border shadow-sm', bedPreviewDotClass(previewSlot.status))}
                            title={previewLabel}
                            aria-hidden="true"
                          />
                        )
                      })}
                    </div>
                  )}
                </button>

                {isExpanded && (
                  <CardContent className="p-4">
                    {board.slots.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-500">
                        {emptyFilterMessage('all')}
                      </div>
                    ) : visibleSlots.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-500">
                        {emptyFilterMessage(selectedFilter)}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
                        {visibleSlots.map((visibleSlot) => {
                          const originalSlot = board.slots.find((slot) => slot.slotNumber === visibleSlot.slotNumber) ?? visibleSlot
                          const canDropHere = draggedPlacement != null && visibleSlot.placement == null
                          const openIncidents = visibleSlot.placement
                            ? unresolvedIncidents(visibleSlot.placement.incidents)
                            : []

                          return (
                            <button
                              key={`${board.safehouse.safehouseId}-${visibleSlot.slotNumber}`}
                              type="button"
                              draggable={canEdit && originalSlot.placement != null && movingPlacementId == null}
                              onClick={() => handleBedClick(board, visibleSlot)}
                              onDragStart={(event) => handleDragStart(event, board, originalSlot)}
                              onDragEnd={handleDragEnd}
                              onDragOver={(event) => {
                                if (!canEdit || !canDropHere) return
                                event.preventDefault()
                                event.dataTransfer.dropEffect = 'move'
                              }}
                              onDrop={async (event) => {
                                if (!canEdit || !canDropHere) return
                                event.preventDefault()
                                await handleDropOnBed(board, visibleSlot)
                              }}
                              aria-label={bedAriaLabel(visibleSlot)}
                              className={cn(
                                'group flex min-h-28 flex-col rounded-xl border px-3 py-2 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2',
                                bedTileClass(visibleSlot.status),
                                canEdit && originalSlot.placement != null && movingPlacementId == null && 'cursor-grab active:cursor-grabbing',
                                canDropHere && 'border-dashed',
                                movingPlacementId === originalSlot.placement?.boardingPlacementId && 'opacity-70',
                              )}
                            >
                              <div className="flex min-h-8 items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
                                <span className="flex min-h-8 min-w-0 flex-1 items-center truncate">
                                  {visibleSlot.slotNumber} | {tileResidentLabel(visibleSlot.placement)}
                                </span>
                                {openIncidents.length > 0 && (
                                  <div className="flex shrink-0 items-center gap-1.5">
                                    {openIncidents.map((incident) => {
                                      const meta = incidentTypeMeta(incident.incidentType)
                                      const Icon = meta.Icon

                                      return (
                                        <span
                                          key={incident.incidentId}
                                          title={meta.label}
                                          className={cn(
                                            'flex h-6 w-6 items-center justify-center rounded-full border',
                                            bedspaceIncidentBadgeClass(incident),
                                          )}
                                        >
                                          <Icon className="h-3.5 w-3.5" />
                                        </span>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                              <div className="mt-2 flex flex-1 flex-col items-center justify-center">
                                <div className="flex flex-1 items-center justify-center">
                                  <BedDouble className={cn('h-12 w-12 transition-transform group-hover:scale-105', bedIconClass(visibleSlot.status))} />
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <div
        ref={dragPreviewRef}
        className="pointer-events-none fixed -left-32 top-0 flex items-center gap-2 rounded-full border border-zinc-300 bg-white/95 px-3 py-2 text-xs font-medium text-zinc-800 shadow-lg"
        aria-hidden="true"
      >
        <UserRound className="h-4 w-4 text-violet-700" />
        <span ref={dragPreviewLabelRef}>Resident</span>
      </div>

      <Dialog open={selectedBed != null} onOpenChange={(open) => !open && setSelectedBed(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          {selectedBed && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedBed.slot.placement
                    ? `${selectedBed.slot.label} - ${residentTitleLabel(selectedBed.slot.placement)}`
                    : `Open ${selectedBed.slot.label}`}
                </DialogTitle>
                <DialogDescription>
                  {[selectedBed.board.safehouse.name, selectedBed.board.safehouse.region].filter(Boolean).join(' - ')}
                </DialogDescription>
              </DialogHeader>

              {selectedBed.slot.placement ? (
                <div className="space-y-5">
                  {(() => {
                    const placement = selectedBed.slot.placement
                    const hasOverflowAction = selectedBed.slot.isOverflow
                    const placementIncidents = sortIncidents(placement.incidents ?? [])
                    const unresolvedPlacementIncidents = unresolvedIncidents(placementIncidents)
                    const unresolvedIncidentCount = unresolvedPlacementIncidents.length
                    const placementIncidentWorkflow = incidentWorkflowState(placementIncidents)
                    const actionRequired = hasOverflowAction || placementIncidentWorkflow === 'action'
                    const pendingOnly = !hasOverflowAction && placementIncidentWorkflow === 'pending'
                    const placementWorkflowStatus: IncidentWorkflowStatus = actionRequired
                      ? 'action'
                      : pendingOnly
                        ? 'pending'
                        : 'clear'
                    const hasSensitivities = hasText(placement.sensitivities)
                    const hasSpecialConsiderations = hasText(placement.specialConsiderations)
                    const hasRelationshipSummary = hasText(placement.relationshipSummary)
                    const hasChildrenSummary = hasText(placement.childrenSummary)
                    const hasPlacementNotes = hasText(placement.placementNotes)
                    const hasIncidentHistory = placementIncidents.length > 0
                    const visibleIncidents = incidentListExpanded ? placementIncidents : placementIncidents.slice(0, 3)
                    const eighteenthBirthday = eighteenthBirthdayValue(placement)
                    const estimatedStayNote = eighteenthBirthday
                      ? `Protected stay window capped at age 18 on ${formatDate(eighteenthBirthday)}`
                      : 'Protected stay window based on current risk level'
                    const hasAdditionalDetails =
                      hasSensitivities
                      || hasSpecialConsiderations
                      || hasRelationshipSummary
                      || hasChildrenSummary
                      || hasPlacementNotes
                    const prioritySummary = hasOverflowAction
                      ? 'Capacity review needed'
                      : unresolvedIncidentCount > 0
                        ? placementIncidentWorkflow === 'action'
                          ? unresolvedIncidentCount === 1
                            ? '1 incident needs action'
                            : `${unresolvedIncidentCount} incidents need action`
                          : unresolvedIncidentCount === 1
                            ? '1 incident pending'
                            : `${unresolvedIncidentCount} incidents pending`
                        : null
                    const actionSectionTitle = actionRequired
                      ? 'Action required'
                      : pendingOnly
                        ? 'Pending incidents'
                        : 'Recent incidents'

                    return (
                      <>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={placementStatusClass(placement.placementStatus)}>
                            {placementDimensionLabel(placement.placementStatus)}
                          </Badge>
                          <Badge variant="outline" className={riskBadgeClass(placement.residentRiskLevel)}>
                            Risk: {placement.residentRiskLevel ?? 'Unassessed'}
                          </Badge>
                          <Badge variant="outline" className={incidentWorkflowBadgeClass(placementWorkflowStatus)}>
                            Action: {actionRequired ? 'Required' : pendingOnly ? 'Pending' : 'Clear'}
                          </Badge>
                        </div>

                        <div className="rounded-xl border border-zinc-200 p-4">
                          <div className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Placement summary</div>
                          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                            <div>
                              <div className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">Status</div>
                              <div className="mt-1 font-medium text-zinc-900">{placementDimensionLabel(placement.placementStatus).replace('Placement: ', '')}</div>
                            </div>
                            <div>
                              <div className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">Risk level</div>
                              <div className="mt-1 font-medium text-zinc-900">{placement.residentRiskLevel ?? 'Unassessed'}</div>
                            </div>
                            <div>
                              <div className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">Admittance</div>
                              <div className="mt-1 font-medium text-zinc-900">{placementAdmittanceLabel(placement)}</div>
                            </div>
                            <div>
                              <div className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">Estimated end date</div>
                              <div className="mt-1 font-medium text-zinc-900">{placementEstimatedEndLabel(placement)}</div>
                              <div className="mt-1 text-xs text-zinc-500">{estimatedStayNote}</div>
                            </div>
                            <div>
                              <div className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">Stay</div>
                              <div className="mt-1 font-medium text-zinc-900">{placementLengthLabel(placement)}</div>
                            </div>
                          </div>
                        </div>
                        {(hasOverflowAction || hasIncidentHistory) && (
                          <div className="rounded-xl border border-zinc-200 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">{actionSectionTitle}</div>
                                {prioritySummary && (
                                  <div className="mt-1 text-base font-semibold text-zinc-900">{prioritySummary}</div>
                                )}
                              </div>
                              {hasIncidentHistory && placementIncidents.length > 3 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setIncidentListExpanded((current) => !current)}
                                >
                                  {incidentListExpanded ? 'Show less' : 'See more'}
                                </Button>
                              )}
                            </div>

                            <div className="mt-4 space-y-3">
                              {hasOverflowAction && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                                  <div className="flex items-start gap-3">
                                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                                    <div>
                                      <div className="font-medium">Capacity review needed</div>
                                      <div className="mt-1 text-amber-900">
                                        {placement.safehouseCapacityGirls && placement.safehouseCapacityGirls > 0
                                          ? `This placement is currently beyond the configured ${placement.safehouseCapacityGirls}-bed safehouse limit.`
                                          : 'This safehouse does not have a configured bed capacity, so the placement should be reviewed.'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {visibleIncidents.map((incident) => {
                                const isResolved = incident.resolved ?? false
                                const incidentWorkflowStatus: IncidentWorkflowStatus = isResolved
                                  ? 'resolved'
                                  : incidentIsPending(incident)
                                    ? 'pending'
                                    : 'action'
                                const incidentMeta = incidentTypeMeta(incident.incidentType)
                                const responseMeta = responseOptionMeta(incident.responseTaken)
                                const IncidentIcon = incidentMeta.Icon
                                const ResponseIcon = responseMeta?.Icon ?? ClipboardList
                                const responseIconBadgeClass = responseMeta?.badgeClassName ?? 'border-zinc-200 bg-white text-zinc-500'
                                const isUpdating = updatingIncidentId === incident.incidentId

                                return (
                                  <div
                                    key={incident.incidentId}
                                    className={cn(
                                      'rounded-xl border p-4 transition',
                                      isResolved
                                        ? 'border-zinc-200 bg-zinc-50 text-zinc-500'
                                        : incidentWorkflowStatus === 'action'
                                          ? 'border-red-200 bg-red-50/70 text-zinc-800'
                                          : 'border-amber-200 bg-amber-50/80 text-zinc-800',
                                    )}
                                  >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                      <div className="space-y-3">
                                        <div className="flex flex-wrap gap-2">
                                          <Badge variant="outline" className={incidentMeta.className}>
                                            <IncidentIcon className="mr-1 h-3.5 w-3.5" />
                                            {incidentMeta.label}
                                          </Badge>
                                          {incident.severity && (
                                            <Badge variant="outline" className={riskBadgeClass(incident.severity)}>
                                              {incident.severity}
                                            </Badge>
                                          )}
                                          <Badge variant="outline" className={incidentWorkflowBadgeClass(incidentWorkflowStatus)}>
                                            {incidentWorkflowStatus === 'resolved'
                                              ? 'Resolved'
                                              : incidentWorkflowStatus === 'pending'
                                                ? 'Pending'
                                                : 'Action required'}
                                          </Badge>
                                        </div>

                                        <div className="text-sm font-medium text-zinc-900">{formatDate(incident.incidentDate)}</div>
                                        {hasText(incident.description) && (
                                          <div className={cn('text-sm', isResolved ? 'text-zinc-500' : 'text-zinc-600')}>
                                            {sanitize(incident.description)}
                                          </div>
                                        )}
                                        {responseMeta && (
                                          <div className={cn('flex items-center gap-2 text-sm', isResolved ? 'text-zinc-500' : 'text-zinc-600')}>
                                            <span className={cn('flex h-6 w-6 items-center justify-center rounded-full border', responseIconBadgeClass)}>
                                              <ResponseIcon className="h-3.5 w-3.5" />
                                            </span>
                                            <span>
                                              <span className="font-medium text-zinc-500">Response:</span> {responseMeta.label}
                                            </span>
                                          </div>
                                        )}
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                                          {incident.reportedBy && <span>Reported by {incident.reportedBy}</span>}
                                          {incident.assignedStaffDisplayName && <span>Assigned to {incident.assignedStaffDisplayName}</span>}
                                          {incident.resolutionDate && <span>Resolved {formatDate(incident.resolutionDate)}</span>}
                                        </div>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-2">
                                        <Popover
                                          open={staffPickerIncidentId === incident.incidentId}
                                          onOpenChange={(open) => setStaffPickerIncidentId(open ? incident.incidentId : null)}
                                        >
                                          <PopoverTrigger asChild>
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="icon-sm"
                                              disabled={isUpdating}
                                              className={incidentActionIconButtonClass()}
                                              onClick={() => startIncidentUpdate(incident.incidentId, 'staff')}
                                            >
                                              {incident.assignedStaffDisplayName ? (
                                                <Avatar className="size-6">
                                                  <AvatarFallback className="bg-sky-50 text-[11px] font-semibold text-sky-700">
                                                    {initialsForName(incident.assignedStaffDisplayName)}
                                                  </AvatarFallback>
                                                </Avatar>
                                              ) : (
                                                <UserSearch className="h-4 w-4" />
                                              )}
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-72 p-0" align="end">
                                            <Command>
                                              <CommandInput placeholder="Assign a staff member" />
                                              <CommandList>
                                                <CommandEmpty>No staff members match this search.</CommandEmpty>
                                                <CommandGroup>
                                                  {incident.assignedStaffDisplayName && (
                                                    <CommandItem onSelect={() => clearIncidentAssignment(incident)}>
                                                      <X className="h-4 w-4" />
                                                      Clear assignment
                                                    </CommandItem>
                                                  )}
                                                  {staffDirectory.map((staffMember) => (
                                                    <CommandItem
                                                      key={staffMember.id}
                                                      value={`${staffMember.displayName} ${staffMember.email ?? ''}`}
                                                      onSelect={() => void handleAssignIncidentStaff(incident, staffMember)}
                                                    >
                                                      <Avatar className="size-7 border border-zinc-200">
                                                        <AvatarFallback className="bg-sky-50 text-[11px] font-semibold text-sky-700">
                                                          {initialsForName(staffMember.displayName)}
                                                        </AvatarFallback>
                                                      </Avatar>
                                                      <div className="flex min-w-0 flex-col">
                                                        <span className="truncate font-medium text-zinc-900">{staffMember.displayName}</span>
                                                        <span className="truncate text-xs text-zinc-500">
                                                          {staffMember.email ?? staffMember.roles.join(', ')}
                                                        </span>
                                                      </div>
                                                    </CommandItem>
                                                  ))}
                                                </CommandGroup>
                                              </CommandList>
                                            </Command>
                                          </PopoverContent>
                                        </Popover>

                                        <Popover
                                          open={responsePickerIncidentId === incident.incidentId}
                                          onOpenChange={(open) => setResponsePickerIncidentId(open ? incident.incidentId : null)}
                                        >
                                          <PopoverTrigger asChild>
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="icon-sm"
                                              disabled={isUpdating}
                                              className={cn(
                                                incidentActionIconButtonClass(),
                                                responseMeta ? 'border-transparent' : null,
                                                responseMeta ? responseIconBadgeClass : null,
                                              )}
                                              onClick={() => startIncidentUpdate(incident.incidentId, 'response')}
                                            >
                                              <ResponseIcon className="h-4 w-4" />
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-72 p-0" align="end">
                                            <Command>
                                              <CommandInput placeholder="Search response options" />
                                              <CommandList>
                                                <CommandEmpty>No response options match this search.</CommandEmpty>
                                                <CommandGroup>
                                                  {responseMeta && (
                                                    <CommandItem onSelect={() => clearIncidentResponse(incident)}>
                                                      <X className="h-4 w-4" />
                                                      Clear response
                                                    </CommandItem>
                                                  )}
                                                  {INCIDENT_RESPONSE_OPTIONS.map((option) => {
                                                    const OptionIcon = option.Icon

                                                    return (
                                                      <CommandItem
                                                        key={option.value}
                                                        value={`${option.label} ${option.value}`}
                                                        onSelect={() => void handleSelectIncidentResponse(incident, option.value)}
                                                      >
                                                        <span className={cn('flex h-7 w-7 items-center justify-center rounded-full border', option.badgeClassName)}>
                                                          <OptionIcon className="h-4 w-4" />
                                                        </span>
                                                        <span className="font-medium text-zinc-900">{option.label}</span>
                                                      </CommandItem>
                                                    )
                                                  })}
                                                </CommandGroup>
                                              </CommandList>
                                            </Command>
                                          </PopoverContent>
                                        </Popover>

                                        {canEdit && !isResolved && (
                                          <Button
                                            size="sm"
                                            className="bg-violet-700 hover:bg-violet-800"
                                            onClick={() => void markIncidentResolved(incident)}
                                            disabled={isUpdating}
                                          >
                                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Mark resolved
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                        {hasAdditionalDetails && (
                          <div className="rounded-xl border border-zinc-200 p-4">
                            <div className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Additional details</div>
                            <div className="mt-4 space-y-3 text-sm text-zinc-700">
                              {hasSensitivities && (
                                <div>
                                  <div className="font-medium text-zinc-500">Sensitivities</div>
                                  <div className="mt-1">{sanitize(placement.sensitivities)}</div>
                                </div>
                              )}
                              {hasSpecialConsiderations && (
                                <div>
                                  <div className="font-medium text-zinc-500">Special considerations</div>
                                  <div className="mt-1">{sanitize(placement.specialConsiderations)}</div>
                                </div>
                              )}
                              {hasRelationshipSummary && (
                                <div>
                                  <div className="font-medium text-zinc-500">Relationship summary</div>
                                  <div className="mt-1">{sanitize(placement.relationshipSummary)}</div>
                                </div>
                              )}
                              {hasChildrenSummary && (
                                <div>
                                  <div className="font-medium text-zinc-500">Children summary</div>
                                  <div className="mt-1">{sanitize(placement.childrenSummary)}</div>
                                </div>
                              )}
                              {hasPlacementNotes && (
                                <div>
                                  <div className="font-medium text-zinc-500">Operational notes</div>
                                  <div className="mt-1">{sanitize(placement.placementNotes)}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {canEdit && (
                            <Button
                              className="bg-violet-700 hover:bg-violet-800"
                              onClick={() => {
                                setSelectedBed(null)
                                openEditPlacement(placement)
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit placement
                            </Button>
                          )}
                          <Button variant="outline" onClick={() => void openPlacementHistory(placement)}>
                            View history
                          </Button>
                          {canEdit && (
                            <Button variant="outline" onClick={() => startMoveResident(placement)}>
                              Move resident
                            </Button>
                          )}
                          {canEdit && (
                            <Button
                              variant="outline"
                              className="text-red-600"
                              onClick={() => setPendingDeletePlacement(placement)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </>
                    )
                  })()}
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">
                  This bed is currently open and can be used for a new placement.
                </div>
              )}

              {canEdit && (
                <DialogFooter>
                  {!selectedBed.slot.placement && (
                    <Button
                      className="bg-violet-700 hover:bg-violet-800"
                      onClick={() => {
                        const safehouseId = selectedBed.board.safehouse.safehouseId
                        const slotNumber = selectedBed.slot.slotNumber
                        setSelectedBed(null)
                        openAddPlacement({ safehouseId, slotNumber })
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Placement
                    </Button>
                  )}
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Placement history</DialogTitle>
            <DialogDescription>{historyDialogResidentLabel}</DialogDescription>
          </DialogHeader>

          {historyLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-violet-700" />
            </div>
          ) : historyPlacements.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">
              No prior placements are recorded for this resident.
            </div>
          ) : (
            <div className="space-y-3">
              {historyPlacements.map((placement) => (
                <div key={placement.boardingPlacementId} className="rounded-xl border border-zinc-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-medium text-zinc-900">
                        {placement.safehouseName ?? 'Safehouse unavailable'}
                        {placement.safehouseRegion ? ` • ${placement.safehouseRegion}` : ''}
                      </div>
                      <div className="text-sm text-zinc-600">
                        {placement.bedLabel ?? 'Bed not assigned'} • {stayWindowLabel(placement)}
                      </div>
                    </div>
                    <Badge variant="outline" className={placementStatusClass(placement.placementStatus)}>
                      {placement.placementStatus ?? 'Unknown'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={pendingDeletePlacement != null} onOpenChange={(open) => !open && setPendingDeletePlacement(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Placement</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeletePlacement
                ? `This will remove the placement for ${residentLabel(pendingDeletePlacement)}.`
                : 'This will remove the selected placement.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingDeletePlacement && handleDeletePlacement(pendingDeletePlacement.boardingPlacementId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete placement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={placementDialogOpen} onOpenChange={setPlacementDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingPlacementId ? 'Edit Boarding Placement' : 'New Boarding Placement'}</DialogTitle>
            <DialogDescription>Capture operational boarding details separately from the resident record.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Resident</Label>
                <Select value={placementForm.residentId} onValueChange={(value) => setPlacementForm({ ...placementForm, residentId: value })}>
                  <SelectTrigger><SelectValue placeholder="Select resident ID" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No linked resident yet</SelectItem>
                    {residents.map((resident) => (
                      <SelectItem key={resident.residentId} value={String(resident.residentId)}>
                        Resident ID {resident.residentId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Safehouse</Label>
                <Select value={placementForm.safehouseId} onValueChange={(value) => setPlacementForm({ ...placementForm, safehouseId: value })}>
                  <SelectTrigger><SelectValue placeholder="Select safehouse" /></SelectTrigger>
                  <SelectContent>
                    {safehouses.map((safehouse) => (
                      <SelectItem key={safehouse.safehouseId} value={String(safehouse.safehouseId)}>
                        {safehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Placement Status</Label>
                <Select value={placementForm.placementStatus} onValueChange={(value) => setPlacementForm({ ...placementForm, placementStatus: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLACEMENT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bedLabel">Bed Label</Label>
                <Input id="bedLabel" value={placementForm.bedLabel} onChange={(event) => setPlacementForm({ ...placementForm, bedLabel: event.target.value })} placeholder="e.g. Bed 4" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confidentialResidentName">Confidential Name</Label>
                <Input id="confidentialResidentName" value={placementForm.confidentialResidentName} onChange={(event) => setPlacementForm({ ...placementForm, confidentialResidentName: event.target.value })} placeholder="Shown masked by default" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expectedCheckIn">Expected Check-In</Label>
                <Input id="expectedCheckIn" type="date" value={placementForm.expectedCheckIn} onChange={(event) => setPlacementForm({ ...placementForm, expectedCheckIn: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedCheckOut">Expected Check-Out</Label>
                <Input id="expectedCheckOut" type="date" value={placementForm.expectedCheckOut} onChange={(event) => setPlacementForm({ ...placementForm, expectedCheckOut: event.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="actualCheckIn">Actual Check-In</Label>
                <Input id="actualCheckIn" type="date" value={placementForm.actualCheckIn} onChange={(event) => setPlacementForm({ ...placementForm, actualCheckIn: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actualCheckOut">Actual Check-Out</Label>
                <Input id="actualCheckOut" type="date" value={placementForm.actualCheckOut} onChange={(event) => setPlacementForm({ ...placementForm, actualCheckOut: event.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sensitivities">Sensitivities</Label>
              <Textarea id="sensitivities" rows={2} value={placementForm.sensitivities} onChange={(event) => setPlacementForm({ ...placementForm, sensitivities: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialConsiderations">Special Considerations</Label>
              <Textarea id="specialConsiderations" rows={2} value={placementForm.specialConsiderations} onChange={(event) => setPlacementForm({ ...placementForm, specialConsiderations: event.target.value })} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="relationshipSummary">Relationship Summary</Label>
                <Input id="relationshipSummary" value={placementForm.relationshipSummary} onChange={(event) => setPlacementForm({ ...placementForm, relationshipSummary: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="childrenSummary">Children Summary</Label>
                <Input id="childrenSummary" value={placementForm.childrenSummary} onChange={(event) => setPlacementForm({ ...placementForm, childrenSummary: event.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="placementNotes">Operational Notes</Label>
              <Textarea id="placementNotes" rows={2} value={placementForm.placementNotes} onChange={(event) => setPlacementForm({ ...placementForm, placementNotes: event.target.value })} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setPlacementDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePlacement} disabled={savingPlacement} className="bg-violet-700 hover:bg-violet-800">
              {savingPlacement && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Placement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
