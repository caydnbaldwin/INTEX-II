import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  MapPin,
  Globe,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Brain,
  RefreshCw,
  Info,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePageTitle } from '@/hooks/usePageTitle'
import { api } from '@/lib/api'

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

// ─── ML Pipeline Types ───────────────────────────────────────────────────────

interface SegmentRate {
  segment: string
  count: number
  successCount: number
  successRate: number
  liftOverBaseline: number
}

interface SuccessProfileApi {
  totalResidentsAnalyzed: number
  totalSuccessful: number
  overallSuccessRate: number
  byCaseSubcategory: SegmentRate[]
  byAgeGroup: SegmentRate[]
  byFamilyProfile: SegmentRate[]
  byInitialRisk: SegmentRate[]
  byReferralSource: SegmentRate[]
}

interface RegionRecommendationApi {
  regionCode: string
  regionName: string
  islandGroup: string
  needScore: number
  successMatchScore: number
  finalScore: number
  rank: number
  safetyFlag: boolean
  topMatchingSegments: string[]
  aiRationale: string | null
}

interface ExpansionRecommendation {
  generatedAt: string
  successProfile: SuccessProfileApi
  rankedRegions: RegionRecommendationApi[]
  overallInsight: string | null
}

// ─── Static Data ──────────────────────────────────────────────────────────────
// Data sourced from PSA, DSWD, UNICEF Philippines, and IACAT annual reports.
// Replace with live PSA OpenSTAT / DSWD API calls to keep indicators current.

const PHILIPPINE_REGIONS: PhilippineRegion[] = [
  {
    id: 'ncr', name: 'Metro Manila', code: 'NCR', island: 'Luzon',
    needTier: 'covered', populationM: 13.9, povertyRate: 8.9, distanceKm: 0,
    existingNGOs: 42, hasLunas: true, score: 0,
    primaryRisk: 'Covered — Lunas Safehouse 1 (Quezon City) operational',
    rationale: 'Safehouse 1 operates in Quezon City, the largest population center nationally. High NGO density supports a strong referral network. Ongoing capacity monitoring is recommended given the scale of case volume across the metro region.',
  },
  {
    id: 'car', name: 'Cordillera', code: 'CAR', island: 'Luzon',
    needTier: 'covered', populationM: 1.8, povertyRate: 19.3, distanceKm: 0,
    existingNGOs: 8, hasLunas: true, score: 0,
    primaryRisk: 'Covered — Lunas Safehouse 5 (Baguio City) operational',
    rationale: 'Safehouse 5 operates in Baguio City. Mountain terrain limits outside access, making the local safehouse critical for reaching indigenous communities and geographically isolated girls. Outreach programming into rural barangays is a recommended complement.',
  },
  {
    id: 'r1', name: 'Ilocos Region', code: 'Region I', island: 'Luzon',
    needTier: 'low', populationM: 5.3, povertyRate: 13.7, distanceKm: 120,
    existingNGOs: 11, hasLunas: false, score: 43,
    primaryRisk: 'Lower relative need — referral coverage from CAR safehouse available',
    rationale: 'Region I holds historical significance as the first region served by Lighthouse Sanctuary (the organization that inspired Lunas), but Lunas has not yet established a presence here. The relatively lower poverty rate (13.7%) and proximity to Safehouse 5 in Baguio City (CAR, ~120km) make this a lower-urgency expansion target compared to higher-need regions. A future satellite program or outreach partnership may be more appropriate than a full safehouse in the near term.',
  },
  {
    id: 'r2', name: 'Cagayan Valley', code: 'Region II', island: 'Luzon',
    needTier: 'moderate', populationM: 3.7, povertyRate: 16.1, distanceKm: 200,
    existingNGOs: 7, hasLunas: false, score: 54,
    primaryRisk: 'Cross-border trafficking from northern corridor',
    rationale: 'Agricultural poverty and proximity to the northern border create vulnerability corridors. Moderate NGO presence with significant gaps in rural barangays. Baguio Safehouse (CAR, ~200km) provides some referral coverage for southern sub-provinces.',
  },
  {
    id: 'r3', name: 'Central Luzon', code: 'Region III', island: 'Luzon',
    needTier: 'high', populationM: 12.4, povertyRate: 11.2, distanceKm: 80,
    existingNGOs: 19, hasLunas: false, score: 68,
    primaryRisk: 'Industrial zone exploitation, labor trafficking',
    rationale: 'Clark and other economic zones generate trafficking demand. Large migrant worker population with vulnerable dependents left behind. Urban–rural poverty divide creates service gaps in provincial areas. NCR Safehouse provides some referral capacity for southern portions of the region.',
  },
  {
    id: 'r4a', name: 'CALABARZON', code: 'Region IV-A', island: 'Luzon',
    needTier: 'high', populationM: 16.2, povertyRate: 10.5, distanceKm: 60,
    existingNGOs: 23, hasLunas: false, score: 71,
    primaryRisk: 'OSEC, semi-urban poverty, industrial trafficking',
    rationale: 'Highest-population Luzon region outside NCR. High internet penetration combined with pockets of semi-urban poverty drive OSEC rates among the highest nationally. NCR Safehouse is nearby (~60km) but insufficient given the scale — a dedicated presence is warranted.',
  },
  {
    id: 'r4b', name: 'MIMAROPA', code: 'Region IV-B', island: 'Luzon',
    needTier: 'moderate', populationM: 3.2, povertyRate: 23.4, distanceKm: 300,
    existingNGOs: 5, hasLunas: false, score: 55,
    primaryRisk: 'Island isolation, high poverty, limited services',
    rationale: 'Archipelagic geography significantly limits service access. High poverty rate but logistical complexity of island operations reduces operational feasibility in the near term. NCR Safehouse (~300km by sea) is the nearest option but accessibility is limited.',
  },
  {
    id: 'r5', name: 'Bicol Region', code: 'Region V', island: 'Luzon',
    needTier: 'high', populationM: 6.1, povertyRate: 28.4, distanceKm: 320,
    existingNGOs: 9, hasLunas: false, score: 76,
    primaryRisk: 'Typhoon displacement, poverty-driven exploitation',
    rationale: 'Among the highest poverty rates in Luzon combined with repeated typhoon displacement creates acute and recurring vulnerability cycles. Limited NGO coverage outside Legazpi. Nearest Lunas safehouse is Tacloban (Region VIII, ~320km by sea). Strong existing mission church network for partnership.',
    recommended: 2,
  },
  {
    id: 'r6', name: 'Western Visayas', code: 'Region VI', island: 'Visayas',
    needTier: 'covered', populationM: 7.9, povertyRate: 22.1, distanceKm: 0,
    existingNGOs: 14, hasLunas: true, score: 0,
    primaryRisk: 'Covered — Lunas Safehouses 4 & 7 (Iloilo City & Bacolod) operational',
    rationale: 'The only region with dual safehouse coverage: Safehouse 4 in Iloilo City and Safehouse 7 in Bacolod. This reflects the severity of trafficking transit activity and sugar industry exploitation patterns here. Coordination between both sites and ongoing capacity monitoring are recommended.',
  },
  {
    id: 'r7', name: 'Central Visayas', code: 'Region VII', island: 'Visayas',
    needTier: 'covered', populationM: 8.1, povertyRate: 24.3, distanceKm: 0,
    existingNGOs: 18, hasLunas: true, score: 0,
    primaryRisk: 'Covered — Lunas Safehouse 2 (Cebu City) operational',
    rationale: 'Safehouse 2 operates in Cebu City, one of the Philippines\' primary documented OSEC and sex trafficking hotspots. Given the severity and ongoing scale of need in this region, capacity expansion and close inter-agency partner coordination are strongly recommended.',
  },
  {
    id: 'r8', name: 'Eastern Visayas', code: 'Region VIII', island: 'Visayas',
    needTier: 'covered', populationM: 4.5, povertyRate: 34.2, distanceKm: 0,
    existingNGOs: 6, hasLunas: true, score: 0,
    primaryRisk: 'Covered — Lunas Safehouse 8 (Tacloban) operational',
    rationale: 'Safehouse 8 operates in Tacloban, Leyte — the highest poverty rate in the Visayas. This safehouse also serves as the nearest Lunas referral point for Bicol Region to the north. Continued capacity expansion within the existing safehouse is recommended.',
  },
  {
    id: 'r9', name: 'Zamboanga Peninsula', code: 'Region IX', island: 'Mindanao',
    needTier: 'critical', populationM: 3.9, povertyRate: 31.6, distanceKm: 380,
    existingNGOs: 6, hasLunas: false, score: 81,
    primaryRisk: 'Conflict displacement, maritime cross-border trafficking',
    rationale: 'Proximity to BARMM conflict zone drives displacement and acute vulnerability. Maritime routes into Malaysia and Indonesia create cross-border trafficking pathways. Severe shortage of safe housing services despite documented high need. Nearest Lunas safehouse is Cagayan de Oro (Region X, ~380km).',
    recommended: 1,
  },
  {
    id: 'r10', name: 'Northern Mindanao', code: 'Region X', island: 'Mindanao',
    needTier: 'covered', populationM: 5.0, povertyRate: 26.3, distanceKm: 0,
    existingNGOs: 11, hasLunas: true, score: 0,
    primaryRisk: 'Covered — Lunas Safehouse 6 (Cagayan de Oro) operational',
    rationale: 'Safehouse 6 operates in Cagayan de Oro. Rapid urban growth means ongoing capacity monitoring is important. This safehouse also serves as a strategic referral hub for Zamboanga Peninsula (Region IX) and CARAGA (Region XIII).',
  },
  {
    id: 'r11', name: 'Davao Region', code: 'Region XI', island: 'Mindanao',
    needTier: 'covered', populationM: 5.2, povertyRate: 22.9, distanceKm: 0,
    existingNGOs: 15, hasLunas: true, score: 0,
    primaryRisk: 'Covered — Lunas Safehouse 3 (Davao City) operational',
    rationale: 'Safehouse 3 operates in Davao City, Mindanao\'s largest urban center. The established NGO ecosystem in this region supports strong inter-agency referral partnerships alongside the safehouse.',
  },
  {
    id: 'r12', name: 'SOCCSKSARGEN', code: 'Region XII', island: 'Mindanao',
    needTier: 'covered', populationM: 4.8, povertyRate: 26.1, distanceKm: 0,
    existingNGOs: 7, hasLunas: true, score: 0,
    primaryRisk: 'Covered — Lunas Safehouse 9 (General Santos) operational',
    rationale: 'Safehouse 9 operates in General Santos City, providing a strategic foothold in southern Mindanao. Its proximity to BARMM (~120km) positions it as a future staging point for BARMM outreach when security conditions allow.',
  },
  {
    id: 'r13', name: 'CARAGA', code: 'Region XIII', island: 'Mindanao',
    needTier: 'high', populationM: 2.8, povertyRate: 34.7, distanceKm: 160,
    existingNGOs: 4, hasLunas: false, score: 72,
    primaryRisk: 'Mining industry exploitation, highest poverty in Mindanao',
    rationale: 'Highest poverty rate in Mindanao combined with mining industry dynamics creates acute child exploitation risk. Severely under-resourced in social services and NGO coverage. Nearest Lunas safehouse is Cagayan de Oro (Region X, ~160km). Small but deeply vulnerable population with very few safe housing alternatives.',
    recommended: 3,
  },
  {
    id: 'barmm', name: 'Bangsamoro', code: 'BARMM', island: 'Mindanao',
    needTier: 'critical', populationM: 4.1, povertyRate: 61.8, distanceKm: 120,
    existingNGOs: 3, hasLunas: false, score: 88,
    primaryRisk: 'Active conflict zone, highest poverty nationally, severe service gap',
    rationale: 'Highest poverty rate in the Philippines at 61.8%. Ongoing conflict significantly limits NGO access and creates the most acute child vulnerability nationally. Nearest Lunas presence is General Santos (Region XII, ~120km). Staff safety assessment required before operational planning. Designated as a long-term strategic priority pending security stabilization.',
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

// Approximate geographic center of each region (lat, lng)
const REGION_COORDS: Record<string, [number, number]> = {
  ncr:   [14.599, 120.984],
  car:   [16.412, 120.593],
  r1:    [16.080, 120.320],
  r2:    [17.613, 121.727],
  r3:    [15.479, 120.962],
  r4a:   [14.100, 121.080],
  r4b:   [10.490, 121.000],
  r5:    [13.139, 123.734],
  r6:    [10.720, 122.562],
  r7:    [10.318, 123.899],
  r8:    [11.244, 125.004],
  r9:    [ 6.920, 122.076],
  r10:   [ 8.487, 124.646],
  r11:   [ 7.073, 125.613],
  r12:   [ 6.284, 124.847],
  r13:   [ 8.949, 125.543],
  barmm: [ 6.950, 124.240],
}

const PHILIPPINES_CENTER: L.LatLngExpression = [11.5, 122.5]
const PHILIPPINES_BOUNDS: L.LatLngBoundsExpression = [[2.0, 114.0], [22.0, 130.0]]

// Approximate geographic centers for international expansion targets
const COUNTRY_COORDS: Record<string, [number, number]> = {
  cambodia:   [12.565, 104.991],
  indonesia:  [-0.789, 113.921],
  myanmar:    [21.916,  95.956],
  png:        [-6.315, 143.956],
  vietnam:    [14.058, 108.277],
  bangladesh: [23.685,  90.356],
  india:      [20.594,  78.963],
  thailand:   [15.870, 100.993],
  ethiopia:   [ 9.145,  40.490],
  kenya:      [-0.024,  37.906],
}
const WORLD_CENTER: L.LatLngExpression = [10.0, 90.0]
const WORLD_BOUNDS: L.LatLngBoundsExpression = [[-50.0, 20.0], [60.0, 170.0]]
const EXPANSION_TIER_HEX: Record<ExpansionTier, string> = {
  immediate: '#f43f5e',
  developing: '#f59e0b',
  future:    '#38bdf8',
}

// ─── Sub-components ───────────────────────────────────────────────────────────


function IslandDot({ island }: { island: PhilippineRegion['island'] }) {
  const colors = {
    Luzon: 'bg-sky-400',
    Visayas: 'bg-violet-400',
    Mindanao: 'bg-teal-400',
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
      <span className={cn('inline-block size-2 rounded-full', colors[island])} />
      {island}
    </span>
  )
}

// ─── Map sub-components ───────────────────────────────────────────────────────

function MapController({
  regions,
  activeIndex,
  markerRefs,
}: {
  regions: PhilippineRegion[]
  activeIndex: number
  markerRefs: React.RefObject<Map<string, L.CircleMarker>>
}) {
  const map = useMap()

  useEffect(() => {
    const region = regions[activeIndex]
    if (!region) return
    const coords = REGION_COORDS[region.id]
    if (!coords) return

    map.flyTo(coords, 8, { duration: 0.5 })

    const marker = markerRefs.current?.get(region.id)
    const onMoveEnd = () => {
      // Guard: if user clicked the dot directly, Leaflet already opened the popup
      if (marker && !marker.isPopupOpen()) marker.openPopup()
      map.off('moveend', onMoveEnd)
    }
    map.on('moveend', onMoveEnd)
    return () => { map.off('moveend', onMoveEnd) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex])

  return null
}

function ExpansionMap({
  candidates,
  covered,
  activeIndex,
  onSelect,
}: {
  candidates: PhilippineRegion[]
  covered: PhilippineRegion[]
  activeIndex: number
  onSelect: (i: number) => void
}) {
  const markerRefs = useRef<Map<string, L.CircleMarker>>(new Map())
  const total = candidates.length

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl overflow-hidden border border-border shadow-sm" style={{ height: 520 }}>
        <MapContainer
          center={PHILIPPINES_CENTER}
          zoom={6}
          minZoom={5}
          maxZoom={12}
          scrollWheelZoom={false}
          maxBounds={PHILIPPINES_BOUNDS}
          maxBoundsViscosity={1.0}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          <MapController regions={candidates} activeIndex={activeIndex} markerRefs={markerRefs} />

          {/* Covered safehouses — small emerald context dots, no popup */}
          {covered.map((region) => {
            const coords = REGION_COORDS[region.id]
            if (!coords) return null
            return (
              <CircleMarker
                key={region.id}
                center={coords}
                radius={6}
                pathOptions={{ color: '#fff', weight: 1.5, fillColor: '#10b981', fillOpacity: 0.85 }}
              />
            )
          })}

          {/* Expansion candidates — color-coded by need tier */}
          {candidates.map((region, idx) => {
            const coords = REGION_COORDS[region.id]
            if (!coords) return null
            const isActive = idx === activeIndex
            return (
              <CircleMarker
                key={region.id}
                ref={(m: L.CircleMarker | null) => {
                  if (m) markerRefs.current.set(region.id, m)
                }}
                center={coords}
                radius={isActive ? 14 : 10}
                pathOptions={{
                  color: '#fff',
                  weight: isActive ? 3 : 1.5,
                  fillColor: NEED_TIER[region.needTier].hex,
                  fillOpacity: 0.9,
                }}
                eventHandlers={{ click: () => onSelect(idx) }}
              >
                <Popup minWidth={260} maxWidth={300}>
                  <div className="p-1 select-none">
                    {/* Navigation row */}
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelect((idx - 1 + total) % total) }}
                        className="flex items-center justify-center size-6 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                        {idx + 1} / {total}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelect((idx + 1) % total) }}
                        className="flex items-center justify-center size-6 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>

                    {/* Region identity */}
                    <p className="text-xs text-muted-foreground font-medium mb-0.5">{region.code}</p>
                    <p className="text-base font-semibold leading-tight mb-1.5">{region.name}</p>
                    <IslandDot island={region.island} />

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-1.5 mt-2.5 text-center">
                      <div className="rounded-md bg-muted/60 py-1.5">
                        <p className="text-sm font-bold tabular-nums">{region.populationM.toFixed(1)}M</p>
                        <p className="text-[11px] text-muted-foreground">Population</p>
                      </div>
                      <div className="rounded-md bg-muted/60 py-1.5">
                        <p className="text-sm font-bold tabular-nums">{region.povertyRate}%</p>
                        <p className="text-[11px] text-muted-foreground">Poverty</p>
                      </div>
                      <div className="rounded-md bg-muted/60 py-1.5">
                        <p className="text-sm font-bold tabular-nums">{region.distanceKm} km</p>
                        <p className="text-[11px] text-muted-foreground">Distance</p>
                      </div>
                    </div>

                    {/* Primary risk */}
                    <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">{region.primaryRisk}</p>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
        {(['critical', 'high', 'moderate', 'low'] as NeedTier[]).map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full" style={{ backgroundColor: NEED_TIER[t].hex }} />
            {NEED_TIER[t].label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 ml-auto">
          <span className="inline-block size-2 rounded-full bg-emerald-500" />
          Active safehouse
        </span>
      </div>
    </div>
  )
}

function WorldMapController({
  countries,
  activeIndex,
  markerRefs,
}: {
  countries: GlobalTarget[]
  activeIndex: number
  markerRefs: React.RefObject<Map<string, L.CircleMarker>>
}) {
  const map = useMap()
  useEffect(() => {
    const country = countries[activeIndex]
    if (!country) return
    const coords = COUNTRY_COORDS[country.id]
    if (!coords) return
    map.flyTo(coords, 5, { duration: 0.5 })
    const marker = markerRefs.current?.get(country.id)
    const onMoveEnd = () => {
      if (marker && !marker.isPopupOpen()) marker.openPopup()
      map.off('moveend', onMoveEnd)
    }
    map.on('moveend', onMoveEnd)
    return () => { map.off('moveend', onMoveEnd) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex])
  return null
}

function InternationalMap({
  countries,
  activeIndex,
  onSelect,
}: {
  countries: GlobalTarget[]
  activeIndex: number
  onSelect: (i: number) => void
}) {
  const markerRefs = useRef<Map<string, L.CircleMarker>>(new Map())
  const total = countries.length

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl overflow-hidden border border-border shadow-sm" style={{ height: 520 }}>
        <MapContainer
          center={WORLD_CENTER}
          zoom={3}
          minZoom={2}
          maxZoom={10}
          scrollWheelZoom={false}
          maxBounds={WORLD_BOUNDS}
          maxBoundsViscosity={1.0}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <WorldMapController countries={countries} activeIndex={activeIndex} markerRefs={markerRefs} />
          {countries.map((country, idx) => {
            const coords = COUNTRY_COORDS[country.id]
            if (!coords) return null
            const isActive = idx === activeIndex
            const tierHex = EXPANSION_TIER_HEX[country.tier]
            return (
              <CircleMarker
                key={country.id}
                ref={(m: L.CircleMarker | null) => {
                  if (m) markerRefs.current.set(country.id, m)
                }}
                center={coords}
                radius={isActive ? 14 : 10}
                pathOptions={{
                  color: '#fff',
                  weight: isActive ? 3 : 1.5,
                  fillColor: tierHex,
                  fillOpacity: 0.9,
                }}
                eventHandlers={{ click: () => onSelect(idx) }}
              >
                <Popup minWidth={260} maxWidth={300}>
                  <div className="p-1 select-none">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelect((idx - 1 + total) % total) }}
                        className="flex items-center justify-center size-6 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                        {idx + 1} / {total}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelect((idx + 1) % total) }}
                        className="flex items-center justify-center size-6 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mb-0.5">{country.subregion} · {country.continent}</p>
                    <p className="text-base font-semibold leading-tight mb-1.5">{country.country}</p>
                    <div className="grid grid-cols-3 gap-1.5 mt-2.5 text-center">
                      <div className="rounded-md bg-muted/60 py-1.5">
                        <p className="text-sm font-bold tabular-nums">{country.traffickingIndex}/10</p>
                        <p className="text-[11px] text-muted-foreground">TI Index</p>
                      </div>
                      <div className="rounded-md bg-muted/60 py-1.5">
                        <p className="text-sm font-bold tabular-nums">{country.missionReadiness}</p>
                        <p className="text-[11px] text-muted-foreground">Readiness</p>
                      </div>
                      <div className="rounded-md bg-muted/60 py-1.5">
                        <p className="text-sm font-bold tabular-nums">
                          {country.populationM >= 100 ? `${(country.populationM / 1000).toFixed(2)}B` : `${country.populationM}M`}
                        </p>
                        <p className="text-[11px] text-muted-foreground">Population</p>
                      </div>
                    </div>
                    <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">{country.primaryRisk}</p>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
        {(['immediate', 'developing', 'future'] as ExpansionTier[]).map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full" style={{ backgroundColor: EXPANSION_TIER_HEX[t] }} />
            {t === 'immediate' ? 'Tier 1 — Immediate' : t === 'developing' ? 'Tier 2 — Developing' : 'Tier 3 — Future'}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ExpansionPlanning() {
  usePageTitle('Expansion Planning')

  const [aiData, setAiData] = useState<ExpansionRecommendation | null>(null)
  const [aiLoading, setAiLoading] = useState(true)
  const [aiError, setAiError] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeCountryIndex, setActiveCountryIndex] = useState(0)
  const [expandedRanks, setExpandedRanks] = useState<Set<number>>(new Set([1]))
  const [expandedCountries, setExpandedCountries] = useState<Set<number>>(new Set([1]))

  const fetchAi = async (forceRefresh = false) => {
    try {
      setAiError(false)
      if (forceRefresh) setRefreshing(true)
      else setAiLoading(true)
      const endpoint = forceRefresh
        ? '/api/expansion/recommendation/refresh'
        : '/api/expansion/recommendation'
      const data = forceRefresh
        ? await api.post<ExpansionRecommendation>(endpoint, {})
        : await api.get<ExpansionRecommendation>(endpoint)
      setAiData(data)
    } catch {
      setAiError(true)
    } finally {
      setAiLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchAi() }, [])

  const covered = PHILIPPINE_REGIONS.filter((r) => r.hasLunas)
  const totalRegions = PHILIPPINE_REGIONS.length
  const coveragePct = Math.round((covered.length / totalRegions) * 100)

  // Expansion candidates sorted highest need score → lowest
  const uncoveredByScore = PHILIPPINE_REGIONS
    .filter((r) => !r.hasLunas)
    .sort((a, b) => b.score - a.score)

  const islandGroups: Array<{ label: PhilippineRegion['island']; color: string }> = [
    { label: 'Luzon', color: 'bg-sky-400' },
    { label: 'Visayas', color: 'bg-violet-400' },
    { label: 'Mindanao', color: 'bg-teal-400' },
  ]

  const globalByTier = (tier: ExpansionTier) => GLOBAL_TARGETS.filter((t) => t.tier === tier)

  const tierOrder: Record<ExpansionTier, number> = { immediate: 0, developing: 1, future: 2 }
  const globalRanked = [...GLOBAL_TARGETS].sort((a, b) => {
    const tierDiff = tierOrder[a.tier] - tierOrder[b.tier]
    if (tierDiff !== 0) return tierDiff
    const tiDiff = b.traffickingIndex - a.traffickingIndex
    if (tiDiff !== 0) return tiDiff
    return b.missionReadiness - a.missionReadiness
  })

  const needScoreColor = (score: number): string => {
    if (score >= 80) return NEED_TIER.critical.hex
    if (score >= 65) return NEED_TIER.high.hex
    if (score >= 50) return NEED_TIER.moderate.hex
    return NEED_TIER.low.hex
  }

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
        <TabsContent value="short-term" className="mt-6 space-y-5">

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
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700"
                  style={{ width: `${coveragePct}%` }}
                />
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                {islandGroups.map((g) => (
                  <span key={g.label} className="flex items-center gap-1.5">
                    <span className={cn('inline-block size-2 rounded-full', g.color)} />
                    {g.label}
                  </span>
                ))}
                <span className="ml-auto">Goal: {covered.length}/17 regions</span>
              </div>
            </CardContent>
          </Card>

          {/* Main layout: map + AI recommendations */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

            {/* Left — expansion map (half width) */}
            <div>
              <h2 className="text-base font-semibold mb-3">Expansion Candidates</h2>
              <ExpansionMap
                candidates={uncoveredByScore}
                covered={covered}
                activeIndex={activeIndex}
                onSelect={setActiveIndex}
              />
            </div>

            {/* Right — AI recommendations (half width) */}
            <div>
              <Card className="sticky top-4">
                <CardHeader className="pb-3 pt-4 px-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Brain className="size-4 text-violet-500 flex-shrink-0" />
                      <CardTitle className="text-base truncate">Expansion Recommendations</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-[9px] text-violet-600 border-violet-300 dark:text-violet-400 dark:border-violet-700">
                        AI
                      </Badge>
                      {aiData && !aiLoading && (
                        <button
                          onClick={() => fetchAi(true)}
                          disabled={refreshing}
                          title="Re-run analysis"
                          className="text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
                        >
                          <RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} />
                        </button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-4 pb-4">

                  {/* Loading */}
                  {aiLoading && (
                    <div className="space-y-3 animate-pulse">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div className="size-6 rounded-full bg-muted flex-shrink-0" />
                            <div className="h-3.5 rounded bg-muted w-3/4" />
                          </div>
                          <div className="h-2 rounded bg-muted w-full" />
                          <div className="h-2 rounded bg-muted w-5/6" />
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground text-center pt-1">Analyzing resident outcomes…</p>
                    </div>
                  )}

                  {/* Error */}
                  {!aiLoading && aiError && (
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 p-3">
                        <AlertTriangle className="size-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1 flex-1 min-w-0">
                          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Analysis unavailable</p>
                          <p className="text-xs text-muted-foreground">Region scores are based on static need data.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => fetchAi(true)}
                        disabled={refreshing}
                        className="w-full flex items-center justify-center gap-1.5 rounded-md border border-border py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-50 transition-colors"
                      >
                        <RefreshCw className={cn('size-3', refreshing && 'animate-spin')} />
                        Retry
                      </button>
                    </div>
                  )}

                  {/* Loaded */}
                  {!aiLoading && !aiError && aiData && (
                    <div className="space-y-4">

                      {/* Overall insight */}
                      {aiData.overallInsight && (
                        <div className="rounded-lg border border-violet-200 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-900/10 p-3">
                          <p className="text-sm text-violet-700 dark:text-violet-400 leading-relaxed italic">
                            {aiData.overallInsight}
                          </p>
                        </div>
                      )}

                      {/* Ranked regions */}
                      <div className="space-y-3">
                        {aiData.rankedRegions.map((r) => {
                          const isExpanded = expandedRanks.has(r.rank)
                          return (
                            <div key={r.regionCode} className="space-y-2">
                              {/* Clickable header row */}
                              <button
                                className="w-full flex items-center gap-3 text-left hover:bg-muted/30 rounded-md px-1 py-0.5 -mx-1 transition-colors"
                                onClick={() => setExpandedRanks((prev) => {
                                  const next = new Set(prev)
                                  if (next.has(r.rank)) next.delete(r.rank)
                                  else next.add(r.rank)
                                  return next
                                })}
                              >
                                <span className="text-base font-bold tabular-nums flex-shrink-0 w-6 text-center text-foreground">
                                  {r.rank}
                                </span>
                                <span className="text-base font-semibold flex-1 min-w-0 truncate">{r.regionName}</span>
                                <span className="text-base font-bold tabular-nums flex-shrink-0" style={{ color: needScoreColor(r.needScore) }}>
                                  {r.finalScore.toFixed(0)}
                                </span>
                                <ChevronDown className={cn('size-4 text-muted-foreground flex-shrink-0 transition-transform', isExpanded && 'rotate-180')} />
                              </button>

                              {/* Expanded content */}
                              {isExpanded && (
                                <div className="pl-9 space-y-3">
                                  {/* Score bars */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Need</span><span>{r.needScore}</span>
                                      </div>
                                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                                        <div className="h-full rounded-full bg-rose-400 transition-all" style={{ width: `${r.needScore}%` }} />
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Match</span><span>{r.successMatchScore.toFixed(0)}</span>
                                      </div>
                                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                                        <div className="h-full rounded-full bg-violet-400 transition-all" style={{ width: `${r.successMatchScore}%` }} />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Safety flag */}
                                  {r.safetyFlag && (
                                    <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                                      <AlertTriangle className="size-4 flex-shrink-0" />
                                      <span>Staff safety assessment required</span>
                                    </div>
                                  )}

                                  {/* AI rationale */}
                                  {r.aiRationale && (
                                    <p className="text-sm text-muted-foreground leading-relaxed">{r.aiRationale}</p>
                                  )}
                                </div>
                              )}

                              {r.rank < aiData.rankedRegions.length && <Separator />}
                            </div>
                          )
                        })}
                      </div>

                      {/* Footer */}
                      <div className="pt-1 space-y-2">
                        <div className="flex items-start gap-1.5 rounded-md bg-muted/40 p-2.5">
                          <Info className="size-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Based on <strong>{aiData.successProfile.totalResidentsAnalyzed}</strong> resolved cases.
                            Results are directional — reliability improves as more cases close.
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
                          <div className="flex items-center gap-1">
                            <Clock className="size-3" />
                            <span>{new Date(aiData.generatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <button
                            onClick={() => fetchAi(true)}
                            disabled={refreshing}
                            className="flex items-center gap-1 hover:text-foreground disabled:opacity-50 transition-colors"
                          >
                            <RefreshCw className={cn('size-3', refreshing && 'animate-spin')} />
                            Re-run
                          </button>
                        </div>
                      </div>

                    </div>
                  )}

                </CardContent>
              </Card>
            </div>

          </div>
        </TabsContent>

        {/* ── LONG-TERM TAB ───────────────────────────────────── */}
        <TabsContent value="long-term" className="mt-6 space-y-5">

          {/* International Expansion Vision card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold">International Expansion Vision</p>
                  <p className="text-xs text-muted-foreground">Countries assessed for future Lunas safehouse deployment</p>
                </div>
                <span className="text-lg font-bold tabular-nums text-violet-600 dark:text-violet-400">{GLOBAL_TARGETS.length}</span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden flex">
                <div
                  className="h-full rounded-l-full bg-rose-400 transition-all duration-700"
                  style={{ width: `${(globalByTier('immediate').length / GLOBAL_TARGETS.length) * 100}%` }}
                />
                <div
                  className="h-full bg-amber-400 transition-all duration-700"
                  style={{ width: `${(globalByTier('developing').length / GLOBAL_TARGETS.length) * 100}%` }}
                />
                <div
                  className="h-full rounded-r-full bg-sky-400 transition-all duration-700"
                  style={{ width: `${(globalByTier('future').length / GLOBAL_TARGETS.length) * 100}%` }}
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2 rounded-full bg-rose-400" />
                  Tier 1 — Immediate ({globalByTier('immediate').length})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2 rounded-full bg-amber-400" />
                  Tier 2 — Developing ({globalByTier('developing').length})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2 rounded-full bg-sky-400" />
                  Tier 3 — Future ({globalByTier('future').length})
                </span>
                <span className="ml-auto">Goal: {GLOBAL_TARGETS.length} countries assessed</span>
              </div>
            </CardContent>
          </Card>

          {/* Main layout: world map + AI recommendations */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

            {/* Left — international map */}
            <div>
              <h2 className="text-base font-semibold mb-3">Expansion Candidates</h2>
              <InternationalMap
                countries={globalRanked}
                activeIndex={activeCountryIndex}
                onSelect={setActiveCountryIndex}
              />
            </div>

            {/* Right — ranked recommendations */}
            <div>
              <Card className="sticky top-4">
                <CardHeader className="pb-3 pt-4 px-4">
                  <div className="flex items-center gap-2">
                    <Brain className="size-4 text-violet-500 flex-shrink-0" />
                    <CardTitle className="text-base truncate">Expansion Recommendations</CardTitle>
                    <Badge variant="outline" className="ml-auto text-[9px] text-violet-600 border-violet-300 dark:text-violet-400 dark:border-violet-700">
                      AI
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-3">
                    {globalRanked.map((country, idx) => {
                      const rank = idx + 1
                      const isExpanded = expandedCountries.has(rank)
                      const tierHex = EXPANSION_TIER_HEX[country.tier]
                      return (
                        <div key={country.id} className="space-y-2">
                          <button
                            className="w-full flex items-center gap-3 text-left hover:bg-muted/30 rounded-md px-1 py-0.5 -mx-1 transition-colors"
                            onClick={() => setExpandedCountries((prev) => {
                              const next = new Set(prev)
                              if (next.has(rank)) next.delete(rank)
                              else next.add(rank)
                              return next
                            })}
                          >
                            <span className="text-base font-bold tabular-nums flex-shrink-0 w-6 text-center text-foreground">
                              {rank}
                            </span>
                            <span className="text-base font-semibold flex-1 min-w-0 truncate">{country.country}</span>
                            <span className="text-sm font-bold tabular-nums flex-shrink-0" style={{ color: tierHex }}>
                              {country.tier === 'immediate' ? 'T1' : country.tier === 'developing' ? 'T2' : 'T3'}
                            </span>
                            <ChevronDown className={cn('size-4 text-muted-foreground flex-shrink-0 transition-transform', isExpanded && 'rotate-180')} />
                          </button>

                          {isExpanded && (
                            <div className="pl-9 space-y-3">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>TI Index</span><span>{country.traffickingIndex}/10</span>
                                  </div>
                                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                                    <div className="h-full rounded-full bg-rose-400 transition-all" style={{ width: `${country.traffickingIndex * 10}%` }} />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Readiness</span><span>{country.missionReadiness}</span>
                                  </div>
                                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                                    <div className="h-full rounded-full bg-violet-400 transition-all" style={{ width: `${country.missionReadiness}%` }} />
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">{country.rationale}</p>
                            </div>
                          )}

                          {rank < globalRanked.length && <Separator />}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
