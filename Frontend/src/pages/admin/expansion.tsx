import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  MapPin,
  Globe,
  Users,
  CheckCircle2,
  Star,
  ChevronDown,
  ChevronRight,
  Building2,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  HeartHandshake,
  Landmark,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePageTitle } from '@/hooks/usePageTitle'

// ─── Types ────────────────────────────────────────────────────────────────────

type NeedTier = 'covered' | 'critical' | 'high' | 'moderate' | 'low'
type ExpansionTier = 'immediate' | 'developing' | 'future'

interface PhilippineRegion {
  id: string
  name: string
  code: string
  island: 'Luzon' | 'Visayas' | 'Mindanao'
  needTier: NeedTier
  populationM: number
  povertyRate: number
  distanceKm: number
  existingNGOs: number
  hasLunas: boolean
  score: number
  primaryRisk: string
  rationale: string
  recommended?: number
}

interface GlobalTarget {
  id: string
  country: string
  subregion: string
  continent: string
  tier: ExpansionTier
  traffickingIndex: number
  populationM: number
  ngoEcosystem: 'strong' | 'developing' | 'weak'
  missionReadiness: number
  primaryRisk: string
  rationale: string
}

// ─── Static Data ──────────────────────────────────────────────────────────────
// Data sourced from PSA, DSWD, UNICEF Philippines, and IACAT annual reports.
// Replace with live PSA OpenSTAT / DSWD API calls to keep indicators current.

const PHILIPPINE_REGIONS: PhilippineRegion[] = [
  {
    id: 'ncr', name: 'Metro Manila', code: 'NCR', island: 'Luzon',
    needTier: 'high', populationM: 13.9, povertyRate: 8.9, distanceKm: 340,
    existingNGOs: 42, hasLunas: false, score: 74,
    primaryRisk: 'Online sexual exploitation, trafficking transit',
    rationale: 'Largest population center and primary OSEC and trafficking transit hub nationally. High NGO density partially offsets need, but case volume at scale remains severe. 13.9M population means small percentages represent thousands of children.',
  },
  {
    id: 'car', name: 'Cordillera', code: 'CAR', island: 'Luzon',
    needTier: 'moderate', populationM: 1.8, povertyRate: 19.3, distanceKm: 120,
    existingNGOs: 8, hasLunas: false, score: 52,
    primaryRisk: 'Indigenous community vulnerability, geographic isolation',
    rationale: 'Mountain terrain severely limits access to social services. Indigenous girls face compounded cultural and geographic barriers. Smaller population and proximity to Region I make joint programming feasible.',
  },
  {
    id: 'r1', name: 'Ilocos Region', code: 'Region I', island: 'Luzon',
    needTier: 'covered', populationM: 5.3, povertyRate: 13.7, distanceKm: 0,
    existingNGOs: 11, hasLunas: true, score: 0,
    primaryRisk: 'Covered — Lunas Safehouse 1 operational',
    rationale: 'Lunas Safehouse 1 has served this region for 8+ years. First safe home in Region I. Continued operations and capacity monitoring recommended ahead of any expansion elsewhere.',
  },
  {
    id: 'r2', name: 'Cagayan Valley', code: 'Region II', island: 'Luzon',
    needTier: 'moderate', populationM: 3.7, povertyRate: 16.1, distanceKm: 180,
    existingNGOs: 7, hasLunas: false, score: 54,
    primaryRisk: 'Cross-border trafficking from northern corridor',
    rationale: 'Agricultural poverty and proximity to northern border create vulnerability corridors. Moderate NGO presence with significant gaps in rural barangays. Reasonable proximity to Safehouse 1 allows some referral coverage.',
  },
  {
    id: 'r3', name: 'Central Luzon', code: 'Region III', island: 'Luzon',
    needTier: 'high', populationM: 12.4, povertyRate: 11.2, distanceKm: 290,
    existingNGOs: 19, hasLunas: false, score: 68,
    primaryRisk: 'Industrial zone exploitation, labor trafficking',
    rationale: 'Clark and other economic zones generate trafficking demand. Large migrant worker population with vulnerable dependents left behind. Urban–rural poverty divide creates service gaps in provincial areas.',
  },
  {
    id: 'r4a', name: 'CALABARZON', code: 'Region IV-A', island: 'Luzon',
    needTier: 'high', populationM: 16.2, povertyRate: 10.5, distanceKm: 400,
    existingNGOs: 23, hasLunas: false, score: 71,
    primaryRisk: 'OSEC, semi-urban poverty, industrial trafficking',
    rationale: 'Highest-population Luzon region outside NCR. High internet penetration combined with pockets of semi-urban poverty drive OSEC rates among the highest nationally. Proximity to NCR amplifies trafficking flow.',
  },
  {
    id: 'r4b', name: 'MIMAROPA', code: 'Region IV-B', island: 'Luzon',
    needTier: 'moderate', populationM: 3.2, povertyRate: 23.4, distanceKm: 520,
    existingNGOs: 5, hasLunas: false, score: 55,
    primaryRisk: 'Island isolation, high poverty, limited services',
    rationale: 'Archipelagic geography significantly limits service access and safehouse reach. High poverty rate but logistical complexity of island operations reduces operational feasibility in the near term.',
  },
  {
    id: 'r5', name: 'Bicol Region', code: 'Region V', island: 'Luzon',
    needTier: 'high', populationM: 6.1, povertyRate: 28.4, distanceKm: 550,
    existingNGOs: 9, hasLunas: false, score: 76,
    primaryRisk: 'Typhoon displacement, poverty-driven exploitation',
    rationale: 'Among the highest poverty rates in Luzon combined with repeated typhoon displacement creates acute and recurring vulnerability cycles. Limited NGO coverage outside Legazpi. Strong existing mission church network for partnership.',
    recommended: 3,
  },
  {
    id: 'r6', name: 'Western Visayas', code: 'Region VI', island: 'Visayas',
    needTier: 'high', populationM: 7.9, povertyRate: 22.1, distanceKm: 680,
    existingNGOs: 14, hasLunas: false, score: 73,
    primaryRisk: 'Trafficking transit routes, sugar industry exploitation',
    rationale: 'Iloilo and Bacolod are established trafficking transit points. Sugar plantation economy generates labor exploitation patterns affecting minors. Growing mission church network offers sustainable partnership potential.',
  },
  {
    id: 'r7', name: 'Central Visayas', code: 'Region VII', island: 'Visayas',
    needTier: 'critical', populationM: 8.1, povertyRate: 24.3, distanceKm: 780,
    existingNGOs: 18, hasLunas: false, score: 84,
    primaryRisk: 'OSEC epicenter, sex tourism, trafficking hub',
    rationale: 'Cebu City is one of the Philippines\' primary documented OSEC and sex trafficking hotspots. Tourism industry exploitation, high internet penetration, and concentrated poverty create a severe risk environment. Two active mission partners with safehouse capacity already identified.',
    recommended: 1,
  },
  {
    id: 'r8', name: 'Eastern Visayas', code: 'Region VIII', island: 'Visayas',
    needTier: 'covered', populationM: 4.5, povertyRate: 34.2, distanceKm: 0,
    existingNGOs: 6, hasLunas: true, score: 0,
    primaryRisk: 'Covered — Lunas Safehouse 2 operational',
    rationale: 'Lunas Safehouse 2 operational for 3+ years. Highest poverty rate in Visayas. Continued capacity expansion within the existing safehouse is recommended before opening new locations in this region.',
  },
  {
    id: 'r9', name: 'Zamboanga Peninsula', code: 'Region IX', island: 'Mindanao',
    needTier: 'critical', populationM: 3.9, povertyRate: 31.6, distanceKm: 1100,
    existingNGOs: 6, hasLunas: false, score: 81,
    primaryRisk: 'Conflict displacement, maritime cross-border trafficking',
    rationale: 'Proximity to BARMM conflict zone drives displacement and acute vulnerability. Maritime routes into Malaysia and Indonesia create cross-border trafficking pathways. Severe shortage of safe housing services despite documented high need.',
    recommended: 2,
  },
  {
    id: 'r10', name: 'Northern Mindanao', code: 'Region X', island: 'Mindanao',
    needTier: 'high', populationM: 5.0, povertyRate: 26.3, distanceKm: 1000,
    existingNGOs: 11, hasLunas: false, score: 67,
    primaryRisk: 'Urban trafficking, agricultural exploitation',
    rationale: 'Cagayan de Oro is a fast-growing urban center with rising trafficking activity. Agricultural hinterlands create rural exploitation patterns. Emerging mission church network provides a foundation for partnership.',
  },
  {
    id: 'r11', name: 'Davao Region', code: 'Region XI', island: 'Mindanao',
    needTier: 'high', populationM: 5.2, povertyRate: 22.9, distanceKm: 1150,
    existingNGOs: 15, hasLunas: false, score: 69,
    primaryRisk: 'Trafficking hub, OSEC, agricultural labor exploitation',
    rationale: 'Davao City is Mindanao\'s largest urban center and a secondary trafficking hub. Established NGO presence offers partnership potential but leaves significant gaps in rural provincial areas.',
  },
  {
    id: 'r12', name: 'SOCCSKSARGEN', code: 'Region XII', island: 'Mindanao',
    needTier: 'moderate', populationM: 4.8, povertyRate: 26.1, distanceKm: 1050,
    existingNGOs: 7, hasLunas: false, score: 61,
    primaryRisk: 'Conflict spillover, agricultural poverty',
    rationale: 'Conflict proximity and agricultural poverty create moderate vulnerability. Lower trafficking case documentation may reflect reporting gaps rather than lower incidence. Staff operational security assessment required.',
  },
  {
    id: 'r13', name: 'CARAGA', code: 'Region XIII', island: 'Mindanao',
    needTier: 'high', populationM: 2.8, povertyRate: 34.7, distanceKm: 980,
    existingNGOs: 4, hasLunas: false, score: 72,
    primaryRisk: 'Mining industry exploitation, highest poverty in Mindanao',
    rationale: 'Highest poverty rate in Mindanao combined with mining industry dynamics creates acute child exploitation risk. Severely under-resourced in social services and NGO coverage. Small but deeply vulnerable population with very few safe housing alternatives.',
  },
  {
    id: 'barmm', name: 'Bangsamoro', code: 'BARMM', island: 'Mindanao',
    needTier: 'critical', populationM: 4.1, povertyRate: 61.8, distanceKm: 1200,
    existingNGOs: 3, hasLunas: false, score: 88,
    primaryRisk: 'Active conflict zone, highest poverty nationally, severe service gap',
    rationale: 'Highest poverty rate in the Philippines at 61.8%. Ongoing conflict significantly limits NGO access and creates the most acute child vulnerability nationally. Staff safety assessment required before operational planning. Designated as a long-term strategic priority pending security stabilization.',
  },
]

const GLOBAL_TARGETS: GlobalTarget[] = [
  {
    id: 'cambodia', country: 'Cambodia', subregion: 'Southeast Asia', continent: 'Asia',
    tier: 'immediate', traffickingIndex: 9, populationM: 17,
    ngoEcosystem: 'developing', missionReadiness: 72,
    primaryRisk: 'Sex trafficking, CSEC, post-conflict poverty',
    rationale: 'Among the highest per-capita trafficking rates globally. Strong existing Christian mission presence and experienced local partners. Philippine operational model is directly transferable. Government cooperation improving.',
  },
  {
    id: 'indonesia', country: 'Indonesia', subregion: 'Southeast Asia', continent: 'Asia',
    tier: 'immediate', traffickingIndex: 8, populationM: 277,
    ngoEcosystem: 'developing', missionReadiness: 65,
    primaryRisk: 'Labor trafficking, child exploitation in outer islands',
    rationale: 'Vast archipelago with severe service gaps in outer islands directly mirrors the Philippines context. Large Christian population in eastern regions offers partnership foundation. Complex logistics require strong local partnership model.',
  },
  {
    id: 'myanmar', country: 'Myanmar', subregion: 'Southeast Asia', continent: 'Asia',
    tier: 'immediate', traffickingIndex: 9, populationM: 54,
    ngoEcosystem: 'weak', missionReadiness: 41,
    primaryRisk: 'Conflict displacement, trafficking, military-linked exploitation',
    rationale: 'Ongoing conflict has dramatically increased child vulnerability. Operational challenges are severe but need is acute. Strategic partnership with border-region NGOs in Thailand is recommended as a precursor step before direct deployment.',
  },
  {
    id: 'png', country: 'Papua New Guinea', subregion: 'Pacific', continent: 'Oceania',
    tier: 'immediate', traffickingIndex: 8, populationM: 10,
    ngoEcosystem: 'weak', missionReadiness: 58,
    primaryRisk: 'Gender-based violence, trafficking, geographic isolation',
    rationale: 'Extreme geographic isolation, very high GBV rates, and almost no safe housing services create acute need. Geographic and cultural proximity to Philippines facilitates model transfer. Existing mission church network provides a viable partnership entry point.',
  },
  {
    id: 'vietnam', country: 'Vietnam', subregion: 'Southeast Asia', continent: 'Asia',
    tier: 'developing', traffickingIndex: 7, populationM: 97,
    ngoEcosystem: 'developing', missionReadiness: 54,
    primaryRisk: 'Cross-border trafficking to China, OSEC',
    rationale: 'Significant trafficking from rural northern Vietnam into China. Government restrictions on religious organizations require a careful partnership strategy. Growing local Christian network offers long-term potential pending operational groundwork.',
  },
  {
    id: 'bangladesh', country: 'Bangladesh', subregion: 'South Asia', continent: 'Asia',
    tier: 'developing', traffickingIndex: 8, populationM: 170,
    ngoEcosystem: 'developing', missionReadiness: 48,
    primaryRisk: 'Child marriage, trafficking, garment industry exploitation',
    rationale: 'High population density, climate displacement from flooding, and garment industry create systematic child exploitation. Operational model requires careful contextual adaptation. Partnership strategy requires sensitivity to local religious and cultural context.',
  },
  {
    id: 'india', country: 'India', subregion: 'South Asia', continent: 'Asia',
    tier: 'developing', traffickingIndex: 8, populationM: 1400,
    ngoEcosystem: 'strong', missionReadiness: 61,
    primaryRisk: 'Scale of trafficking, OSEC, caste-based exploitation',
    rationale: 'Sheer scale of need is unmatched globally. Strong existing NGO ecosystem offers partnership pathways. Recommended entry point: high-need states (Rajasthan, Bihar, UP) with established local partners before broader national expansion.',
  },
  {
    id: 'thailand', country: 'Thailand', subregion: 'Southeast Asia', continent: 'Asia',
    tier: 'developing', traffickingIndex: 7, populationM: 72,
    ngoEcosystem: 'strong', missionReadiness: 67,
    primaryRisk: 'Sex tourism destination, cross-border trafficking flows',
    rationale: 'Primarily a destination country, requiring a different service model than origin-country operations. Strong NGO ecosystem and existing partner relationships make this a viable developing-stage target for survivor reintegration services.',
  },
  {
    id: 'ethiopia', country: 'Ethiopia', subregion: 'East Africa', continent: 'Africa',
    tier: 'future', traffickingIndex: 7, populationM: 126,
    ngoEcosystem: 'developing', missionReadiness: 44,
    primaryRisk: 'Conflict displacement, labor trafficking, early marriage',
    rationale: 'Fast-growing crisis driven by conflict and climate displacement. Very large Christian population creates a mission partnership foundation. Significant capacity building required before operational deployment.',
  },
  {
    id: 'kenya', country: 'Kenya', subregion: 'East Africa', continent: 'Africa',
    tier: 'future', traffickingIndex: 7, populationM: 54,
    ngoEcosystem: 'developing', missionReadiness: 52,
    primaryRisk: 'East Africa trafficking hub, refugee population exploitation',
    rationale: 'Nairobi is the primary East Africa NGO hub, offering significant partnership leverage. Large refugee populations from neighboring countries create acute need. Infrastructure is relatively stronger than regional neighbors, making this the most feasible East Africa entry point.',
  },
]

// ─── Config ───────────────────────────────────────────────────────────────────

const NEED_TIER: Record<NeedTier, {
  label: string
  badge: string
  card: string
  ring: string
  hex: string
}> = {
  covered: {
    label: 'Covered',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    card: 'border-emerald-300 dark:border-emerald-800/60',
    ring: 'text-emerald-500',
    hex: '#10b981',
  },
  critical: {
    label: 'Critical Need',
    badge: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
    card: 'border-rose-300 dark:border-rose-800/60',
    ring: 'text-rose-500',
    hex: '#f43f5e',
  },
  high: {
    label: 'High Need',
    badge: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
    card: 'border-orange-300 dark:border-orange-800/60',
    ring: 'text-orange-500',
    hex: '#f97316',
  },
  moderate: {
    label: 'Moderate',
    badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    card: 'border-amber-300 dark:border-amber-800/60',
    ring: 'text-amber-500',
    hex: '#f59e0b',
  },
  low: {
    label: 'Low Priority',
    badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    card: 'border-slate-200 dark:border-slate-700',
    ring: 'text-slate-400',
    hex: '#94a3b8',
  },
}

const EXPANSION_TIER: Record<ExpansionTier, {
  label: string
  description: string
  badge: string
  border: string
}> = {
  immediate: {
    label: 'Tier 1 — Immediate Priority',
    description: 'Conditions aligned for near-term deployment with the right partner relationships',
    badge: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
    border: 'border-rose-200 dark:border-rose-800/50',
  },
  developing: {
    label: 'Tier 2 — Developing Readiness',
    description: 'High need but requiring capacity building, partnership development, or contextual adaptation',
    badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    border: 'border-amber-200 dark:border-amber-800/50',
  },
  future: {
    label: 'Tier 3 — Future Horizon',
    description: 'Strategic long-term targets requiring groundwork before active expansion planning',
    badge: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800',
    border: 'border-sky-200 dark:border-sky-800/50',
  },
}

const NGO_ECOSYSTEM_LABEL: Record<GlobalTarget['ngoEcosystem'], string> = {
  strong: 'Strong NGO network',
  developing: 'Developing network',
  weak: 'Limited NGO presence',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreRing({ score, tier, size = 56 }: { score: number; tier: NeedTier; size?: number }) {
  const strokeWidth = 5
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 absolute inset-0">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor"
          className="text-muted-foreground/15"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={NEED_TIER[tier].hex}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="relative text-[11px] font-bold tabular-nums text-foreground">{score}</span>
    </div>
  )
}

function IslandDot({ island }: { island: PhilippineRegion['island'] }) {
  const colors = {
    Luzon: 'bg-sky-400',
    Visayas: 'bg-violet-400',
    Mindanao: 'bg-teal-400',
  }
  return (
    <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
      <span className={cn('inline-block size-1.5 rounded-full', colors[island])} />
      {island}
    </span>
  )
}

function RegionCard({ region }: { region: PhilippineRegion }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = NEED_TIER[region.needTier]

  return (
    <Card
      className={cn(
        'border transition-all duration-150 hover:shadow-md cursor-pointer select-none',
        cfg.card,
        region.recommended ? 'ring-1 ring-offset-1 ring-offset-background' : '',
        region.recommended === 1 ? 'ring-amber-400' :
        region.recommended === 2 ? 'ring-slate-400' :
        region.recommended === 3 ? 'ring-orange-300' : '',
      )}
      onClick={() => !region.hasLunas && setExpanded((v) => !v)}
    >
      <CardContent className="p-3.5">
        {/* Header row */}
        <div className="flex items-start gap-2.5">
          {region.hasLunas ? (
            <div className="flex-shrink-0 flex items-center justify-center size-14 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="size-6 text-emerald-500" />
            </div>
          ) : (
            <ScoreRing score={region.score} tier={region.needTier} size={56} />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground leading-none mb-0.5">{region.code}</p>
                <p className="text-sm font-semibold leading-snug truncate">{region.name}</p>
              </div>
              {region.recommended && (
                <div className={cn(
                  'flex-shrink-0 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                  region.recommended === 1 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  region.recommended === 2 ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' :
                  'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                )}>
                  <Star className="size-2.5 fill-current" />
                  #{region.recommended}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <IslandDot island={region.island} />
              <Badge variant="outline" className={cn('text-[9px] font-semibold tracking-wide uppercase px-1.5 py-0', cfg.badge)}>
                {cfg.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats row */}
        {!region.hasLunas && (
          <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
            <div className="rounded-md bg-muted/50 px-1.5 py-1.5">
              <p className="text-[11px] font-bold tabular-nums">{region.populationM.toFixed(1)}M</p>
              <p className="text-[9px] text-muted-foreground leading-tight">Population</p>
            </div>
            <div className="rounded-md bg-muted/50 px-1.5 py-1.5">
              <p className="text-[11px] font-bold tabular-nums">{region.povertyRate}%</p>
              <p className="text-[9px] text-muted-foreground leading-tight">Poverty Rate</p>
            </div>
            <div className="rounded-md bg-muted/50 px-1.5 py-1.5">
              <p className="text-[11px] font-bold tabular-nums">{region.distanceKm >= 1000 ? `${(region.distanceKm / 1000).toFixed(1)}k` : region.distanceKm} km</p>
              <p className="text-[9px] text-muted-foreground leading-tight">Distance</p>
            </div>
          </div>
        )}

        {/* Covered state */}
        {region.hasLunas && (
          <div className="mt-2.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 px-2.5 py-2">
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium leading-snug">
              {region.primaryRisk}
            </p>
          </div>
        )}

        {/* Expand toggle */}
        {!region.hasLunas && (
          <button
            className="mt-2.5 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full"
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v) }}
          >
            {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
            <span className="truncate">{region.primaryRisk}</span>
          </button>
        )}

        {/* Expanded rationale */}
        {expanded && !region.hasLunas && (
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-[11px] text-muted-foreground leading-relaxed">{region.rationale}</p>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
              <Building2 className="size-3 flex-shrink-0" />
              <span>{region.existingNGOs} existing NGOs in region</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RecommendationCard({ region, rank }: { region: PhilippineRegion; rank: number }) {
  const medalColors = [
    'from-amber-400 to-amber-600',
    'from-slate-300 to-slate-500',
    'from-orange-400 to-orange-600',
  ]
  const cfg = NEED_TIER[region.needTier]

  return (
    <Card className={cn('border', cfg.card)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn('size-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 bg-gradient-to-b shadow-sm', medalColors[rank - 1])}>
            {rank}
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">{region.name}</p>
            <p className="text-[11px] text-muted-foreground">{region.code} · {region.island}</p>
          </div>
          <div className="ml-auto">
            <ScoreRing score={region.score} tier={region.needTier} size={48} />
          </div>
        </div>

        <Badge variant="outline" className={cn('text-[9px] font-semibold tracking-wide uppercase mb-2', cfg.badge)}>
          {cfg.label}
        </Badge>

        <p className="text-[11px] text-muted-foreground leading-relaxed">{region.rationale}</p>

        <div className="mt-3 grid grid-cols-2 gap-1.5 text-[10px]">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="size-3 flex-shrink-0" />
            <span>{region.populationM.toFixed(1)}M population</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <TrendingUp className="size-3 flex-shrink-0" />
            <span>{region.povertyRate}% poverty rate</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="size-3 flex-shrink-0" />
            <span>{region.distanceKm} km from nearest safehouse</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Building2 className="size-3 flex-shrink-0" />
            <span>{region.existingNGOs} existing NGO partners</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function GlobalTargetCard({ target }: { target: GlobalTarget }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = EXPANSION_TIER[target.tier]

  const ngoColor = target.ngoEcosystem === 'strong'
    ? 'text-emerald-600 dark:text-emerald-400'
    : target.ngoEcosystem === 'developing'
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-rose-600 dark:text-rose-400'

  return (
    <Card className={cn('border transition-all hover:shadow-md cursor-pointer', cfg.border)}
      onClick={() => setExpanded((v) => !v)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Readiness ring */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1">
            <div className="relative flex items-center justify-center" style={{ width: 52, height: 52 }}>
              <svg width={52} height={52} className="-rotate-90 absolute inset-0">
                <circle cx={26} cy={26} r={21} fill="none" stroke="currentColor" className="text-muted-foreground/15" strokeWidth={5} />
                <circle cx={26} cy={26} r={21} fill="none" stroke={
                  target.tier === 'immediate' ? '#f43f5e' :
                  target.tier === 'developing' ? '#f59e0b' : '#38bdf8'
                } strokeWidth={5}
                  strokeDasharray={2 * Math.PI * 21}
                  strokeDashoffset={2 * Math.PI * 21 - (target.missionReadiness / 100) * 2 * Math.PI * 21}
                  strokeLinecap="round"
                />
              </svg>
              <span className="relative text-[11px] font-bold tabular-nums">{target.missionReadiness}</span>
            </div>
            <span className="text-[9px] text-muted-foreground text-center leading-tight">Mission<br/>Ready</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm leading-tight">{target.country}</p>
                <p className="text-[11px] text-muted-foreground">{target.subregion} · {target.continent}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1 text-[10px] font-semibold">
                  <AlertTriangle className="size-3 text-rose-500" />
                  <span className="tabular-nums">{target.traffickingIndex}/10</span>
                </div>
              </div>
            </div>

            <div className="mt-1.5 flex flex-wrap gap-1">
              <Badge variant="outline" className={cn('text-[9px] font-semibold tracking-wide uppercase px-1.5 py-0', cfg.badge)}>
                {target.tier === 'immediate' ? 'Tier 1' : target.tier === 'developing' ? 'Tier 2' : 'Tier 3'}
              </Badge>
              <span className={cn('text-[10px] font-medium', ngoColor)}>
                {NGO_ECOSYSTEM_LABEL[target.ngoEcosystem]}
              </span>
            </div>

            <p className="mt-2 text-[10px] text-muted-foreground font-medium leading-snug">{target.primaryRisk}</p>
          </div>
        </div>

        <button
          className="mt-2.5 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v) }}
        >
          {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          <span>{expanded ? 'Hide analysis' : 'View analysis'}</span>
        </button>

        {expanded && (
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-[11px] text-muted-foreground leading-relaxed">{target.rationale}</p>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
              <Users className="size-3 flex-shrink-0" />
              <span>{target.populationM >= 100 ? `${(target.populationM / 1000).toFixed(2)}B` : `${target.populationM}M`} population</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ExpansionPlanning() {
  usePageTitle('Expansion Planning')

  const covered = PHILIPPINE_REGIONS.filter((r) => r.hasLunas)
  const totalRegions = PHILIPPINE_REGIONS.length
  const criticalCount = PHILIPPINE_REGIONS.filter((r) => r.needTier === 'critical').length
  const highCount = PHILIPPINE_REGIONS.filter((r) => r.needTier === 'high').length
  const unreachedPopM = PHILIPPINE_REGIONS
    .filter((r) => !r.hasLunas)
    .reduce((sum, r) => sum + r.populationM, 0)
  const coveragePct = Math.round((covered.length / totalRegions) * 100)

  const topRecommendations = PHILIPPINE_REGIONS
    .filter((r) => r.recommended)
    .sort((a, b) => (a.recommended ?? 9) - (b.recommended ?? 9))

  const islandGroups: Array<{ label: PhilippineRegion['island']; color: string }> = [
    { label: 'Luzon', color: 'bg-sky-400' },
    { label: 'Visayas', color: 'bg-violet-400' },
    { label: 'Mindanao', color: 'bg-teal-400' },
  ]

  const globalByTier = (tier: ExpansionTier) => GLOBAL_TARGETS.filter((t) => t.tier === tier)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Expansion Planning</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Strategic analysis for growing Lunas safehouse operations across new regions and countries.
        </p>
      </div>

      <Tabs defaultValue="short-term">
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="short-term" className="gap-1.5">
            <MapPin className="size-3.5" />
            Short-term
          </TabsTrigger>
          <TabsTrigger value="long-term" className="gap-1.5">
            <Globe className="size-3.5" />
            Long-term
          </TabsTrigger>
        </TabsList>

        {/* ── SHORT-TERM TAB ──────────────────────────────────── */}
        <TabsContent value="short-term" className="mt-6 space-y-6">

          {/* Context banner */}
          <Card className="border-sky-200 dark:border-sky-800/50 bg-sky-50/50 dark:bg-sky-900/10">
            <CardContent className="p-4 flex items-start gap-3">
              <Landmark className="size-4 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-sky-800 dark:text-sky-300">Philippines Expansion Strategy</p>
                <p className="text-xs text-sky-700 dark:text-sky-400 mt-0.5 leading-relaxed">
                  The Philippines has 17 administrative regions. Lunas currently operates 2 safehouses.
                  The founder's stated vision is <span className="font-semibold">one safehouse in every region</span>.
                  Need scores are derived from poverty incidence (PSA), trafficking case volume (DSWD/IACAT),
                  population size, distance to nearest safehouse, and existing NGO coverage.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Metric stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="p-4">
              <div className="text-2xl font-bold tabular-nums">{totalRegions}</div>
              <div className="text-xs font-medium text-muted-foreground mt-0.5">Total Regions</div>
              <div className="text-[10px] text-muted-foreground/70 mt-1">Philippines nationwide</div>
            </Card>
            <Card className="p-4 border-emerald-200 dark:border-emerald-800/50">
              <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{covered.length}</div>
              <div className="text-xs font-medium text-muted-foreground mt-0.5">Regions Covered</div>
              <div className="text-[10px] text-muted-foreground/70 mt-1">Active Lunas safehouses</div>
            </Card>
            <Card className="p-4 border-rose-200 dark:border-rose-800/50">
              <div className="text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">{criticalCount}</div>
              <div className="text-xs font-medium text-muted-foreground mt-0.5">Critical Priority</div>
              <div className="text-[10px] text-muted-foreground/70 mt-1">{highCount} more high need</div>
            </Card>
            <Card className="p-4 border-amber-200 dark:border-amber-800/50">
              <div className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{unreachedPopM.toFixed(0)}M</div>
              <div className="text-xs font-medium text-muted-foreground mt-0.5">Unreached Population</div>
              <div className="text-[10px] text-muted-foreground/70 mt-1">Across uncovered regions</div>
            </Card>
          </div>

          {/* Mission progress bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold">Mission Coverage Progress</p>
                  <p className="text-xs text-muted-foreground">Regions with an active Lunas safehouse</p>
                </div>
                <span className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{coveragePct}%</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700"
                  style={{ width: `${coveragePct}%` }}
                />
              </div>
              <div className="mt-2 flex items-center gap-4 text-[10px] text-muted-foreground">
                {islandGroups.map((g) => (
                  <span key={g.label} className="flex items-center gap-1">
                    <span className={cn('inline-block size-1.5 rounded-full', g.color)} />
                    {g.label}
                  </span>
                ))}
                <span className="ml-auto">Goal: 17/17 regions</span>
              </div>
            </CardContent>
          </Card>

          {/* Main two-column layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* Region grid — left 2/3 */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">All Regions</h2>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  {(['covered', 'critical', 'high', 'moderate'] as NeedTier[]).map((t) => (
                    <span key={t} className="flex items-center gap-1">
                      <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: NEED_TIER[t].hex }} />
                      {NEED_TIER[t].label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {PHILIPPINE_REGIONS.map((region) => (
                  <RegionCard key={region.id} region={region} />
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground pt-1">
                Click any region card to expand analysis. Need scores integrate poverty incidence (PSA),
                trafficking case volume (DSWD/IACAT), population, distance to nearest safehouse, and NGO
                coverage density. Enrich with live PSA OpenSTAT API data for real-time updates.
              </p>
            </div>

            {/* Recommendations — right 1/3 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Star className="size-4 text-amber-500 fill-amber-500" />
                <h2 className="text-sm font-semibold">Strategic Recommendations</h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Top regions where a new Lunas safehouse would have the highest impact per the need score model.
                Final decisions should integrate mission leader input and partner readiness.
              </p>
              <div className="space-y-3">
                {topRecommendations.map((r) => (
                  <RecommendationCard key={r.id} region={r} rank={r.recommended!} />
                ))}
              </div>

              <Separator />

              {/* Decision criteria card */}
              <Card className="border-dashed">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Expansion Criteria
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  {[
                    { icon: AlertTriangle, label: 'Case volume & severity', color: 'text-rose-500' },
                    { icon: TrendingUp, label: 'Poverty incidence rate', color: 'text-amber-500' },
                    { icon: MapPin, label: 'Distance from nearest safehouse', color: 'text-sky-500' },
                    { icon: Building2, label: 'Local partner availability', color: 'text-violet-500' },
                    { icon: ShieldCheck, label: 'Staff operational safety', color: 'text-emerald-500' },
                    { icon: HeartHandshake, label: 'Mission leader readiness', color: 'text-pink-500' },
                  ].map(({ icon: Icon, label, color }) => (
                    <div key={label} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Icon className={cn('size-3 flex-shrink-0', color)} />
                      <span>{label}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── LONG-TERM TAB ───────────────────────────────────── */}
        <TabsContent value="long-term" className="mt-6 space-y-6">

          {/* Context banner */}
          <Card className="border-violet-200 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-900/10">
            <CardContent className="p-4 flex items-start gap-3">
              <Globe className="size-4 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-violet-800 dark:text-violet-300">International Expansion Vision</p>
                <p className="text-xs text-violet-700 dark:text-violet-400 mt-0.5 leading-relaxed">
                  Countries are scored on trafficking severity (UNODC/TIP Report), mission readiness
                  (existing partner network, Christian mission presence, government cooperation), and
                  operational feasibility. Mission Readiness scores indicate how prepared the ground
                  conditions are for deployment — <span className="font-semibold">not</span> how urgent the need is.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Global stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="p-4">
              <div className="text-2xl font-bold tabular-nums">{GLOBAL_TARGETS.length}</div>
              <div className="text-xs font-medium text-muted-foreground mt-0.5">Countries Assessed</div>
            </Card>
            <Card className="p-4 border-rose-200 dark:border-rose-800/50">
              <div className="text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
                {globalByTier('immediate').length}
              </div>
              <div className="text-xs font-medium text-muted-foreground mt-0.5">Tier 1 — Immediate</div>
            </Card>
            <Card className="p-4 border-amber-200 dark:border-amber-800/50">
              <div className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                {globalByTier('developing').length}
              </div>
              <div className="text-xs font-medium text-muted-foreground mt-0.5">Tier 2 — Developing</div>
            </Card>
            <Card className="p-4 border-sky-200 dark:border-sky-800/50">
              <div className="text-2xl font-bold tabular-nums text-sky-600 dark:text-sky-400">
                {globalByTier('future').length}
              </div>
              <div className="text-xs font-medium text-muted-foreground mt-0.5">Tier 3 — Future</div>
            </Card>
          </div>

          {/* Tier sections */}
          {(['immediate', 'developing', 'future'] as ExpansionTier[]).map((tier) => {
            const cfg = EXPANSION_TIER[tier]
            const countries = globalByTier(tier)
            return (
              <div key={tier} className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="outline" className={cn('text-[10px] font-semibold tracking-wide uppercase', cfg.badge)}>
                      {cfg.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{cfg.description}</p>
                </div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                  {countries.map((target) => (
                    <GlobalTargetCard key={target.id} target={target} />
                  ))}
                </div>
              </div>
            )
          })}

          <p className="text-[10px] text-muted-foreground pt-2">
            Trafficking index sourced from UNODC Global Report on Trafficking in Persons and U.S. State Department
            TIP Report tier classifications. Enrich with live World Bank Open Data and UNODC APIs for
            real-time socioeconomic indicators. Mission Readiness scores reflect current network assessments
            and should be reviewed annually as partner relationships develop.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
