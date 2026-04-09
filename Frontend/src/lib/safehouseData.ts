import { api } from '@/lib/api'

/* ── Static presentation data (layout, images, narratives) ── */
/* Operational data (capacity, occupancy, status) is fetched from the API */

export interface SafehousePresentation {
  code: string
  markerPosition: { top: string; left: string }
  coordinates: { lat: number; lng: number }
  photoPath: string
  narrative: string
  programs: string[]
}

export interface SafehouseData {
  id: number
  name: string
  code: string
  city: string
  province: string
  region: string
  capacity: number
  occupancy: number
  openDate: string
  coordinates: { lat: number; lng: number }
  markerPosition: { top: string; left: string }
  photoPath: string
  narrative: string
  programs: string[]
}

interface SafehouseApiResponse {
  safehouseId: number
  safehouseCode: string
  name: string
  region: string
  city: string
  province: string
  status: string
  capacityGirls: number
  currentOccupancy: number
  openDate: string
  notes: string
}

// Static presentation data keyed by safehouse code
const presentationData: Record<string, SafehousePresentation> = {
  SH01: {
    code: 'SH01',
    coordinates: { lat: 14.676, lng: 121.044 },
    markerPosition: { top: '34%', left: '42%' },
    photoPath: '/images/otherImages/GirlStandingInHouseYard.png',
    narrative:
      'The first Lunas safehouse, opening its doors in Quezon City in January 2022. Nestled in a quiet residential neighborhood in Metro Manila, it provides a home for girls recovering from trafficking and abuse.',
    programs: ['Trauma-informed counseling', 'School partnership program', 'Life skills workshops'],
  },
  SH02: {
    code: 'SH02',
    coordinates: { lat: 10.316, lng: 123.885 },
    markerPosition: { top: '56%', left: '55%' },
    photoPath: '/images/otherImages/GroupTalking.png',
    narrative:
      'Located in the heart of Cebu City, this safehouse has become a model for community-integrated care in the Visayas region with a strong education focus.',
    programs: ['Secondary equivalency studies', 'Group therapy sessions', 'Peer mentorship'],
  },
  SH03: {
    code: 'SH03',
    coordinates: { lat: 7.191, lng: 125.455 },
    markerPosition: { top: '72%', left: '60%' },
    photoPath: '/images/otherImages/ComfortingYoungChild.png',
    narrative:
      'Brought Lunas to Mindanao, opening in Davao City. The safehouse focuses on family reunification and reintegration planning with dedicated social workers.',
    programs: ['Family reunification coordination', 'Supervised visitation', 'Social worker case management'],
  },
  SH04: {
    code: 'SH04',
    coordinates: { lat: 10.720, lng: 122.562 },
    markerPosition: { top: '55%', left: '44%' },
    photoPath: '/images/otherImages/GirlPaperCraft.png',
    narrative:
      'The largest Lunas safehouse in Iloilo City, with a strong health and wellness program including coordinated medical care and nutritional planning.',
    programs: ['Coordinated medical care', 'Nutrition & wellness program', 'Sleep health monitoring'],
  },
  SH05: {
    code: 'SH05',
    coordinates: { lat: 16.402, lng: 120.596 },
    markerPosition: { top: '22%', left: '36%' },
    photoPath: '/images/otherImages/GirlStudyingOnWall1.png',
    narrative:
      'Set in the cool highlands of Baguio City, this is Lunas\u2019 vocational training hub where residents learn practical skills for economic independence.',
    programs: ['Sewing & textile arts', 'Computer literacy', 'Peer mentorship training'],
  },
  SH06: {
    code: 'SH06',
    coordinates: { lat: 8.454, lng: 124.632 },
    markerPosition: { top: '63%', left: '53%' },
    photoPath: '/images/otherImages/3GirlsSittingOnAWall.png',
    narrative:
      'Known for its art therapy program in Cagayan de Oro, where residents explore painting and mixed media as a path to emotional expression and healing.',
    programs: ['Art therapy', 'Creative expression workshops', 'Community exhibition program'],
  },
  SH07: {
    code: 'SH07',
    coordinates: { lat: 10.684, lng: 122.956 },
    markerPosition: { top: '57%', left: '47%' },
    photoPath: '/images/otherImages/GirlWithSquash1.png',
    narrative:
      'In Bacolod, runs the most comprehensive literacy program. Residents who arrive with limited reading ability typically reach independent reading level within eight months.',
    programs: ['Intensive literacy program', 'Urban gardening & nutrition', 'Daily reading instruction'],
  },
  SH08: {
    code: 'SH08',
    coordinates: { lat: 11.254, lng: 124.960 },
    markerPosition: { top: '51%', left: '62%' },
    photoPath: '/images/otherImages/GirlSunset2.png',
    narrative:
      'Serves a community in Tacloban with emphasis on community leadership, encouraging residents to take active roles in house governance and peer support.',
    programs: ['Peer mentor selection program', 'Community leadership training', 'Disaster resilience education'],
  },
  SH09: {
    code: 'SH09',
    coordinates: { lat: 6.116, lng: 125.172 },
    markerPosition: { top: '78%', left: '55%' },
    photoPath: '/images/otherImages/GirlStudyingOnWall2.png',
    narrative:
      'The newest safehouse in General Santos, focused on preparing older residents for independent living with budgeting, cooking, and job readiness training.',
    programs: ['Independent living skills', 'Job readiness training', 'Financial literacy & budgeting'],
  },
}

const defaultPresentation: SafehousePresentation = {
  code: '',
  coordinates: { lat: 12.0, lng: 123.0 },
  markerPosition: { top: '50%', left: '50%' },
  photoPath: '/images/otherImages/GirlStandingInHouseYard.png',
  narrative: '',
  programs: [],
}

// Merge API data with static presentation data
function mergeWithPresentation(apiData: SafehouseApiResponse): SafehouseData {
  const presentation = presentationData[apiData.safehouseCode] ?? defaultPresentation
  return {
    id: apiData.safehouseId,
    name: apiData.name,
    code: apiData.safehouseCode ?? '',
    city: apiData.city ?? '',
    province: apiData.province ?? '',
    region: apiData.region ?? '',
    capacity: apiData.capacityGirls ?? 0,
    occupancy: apiData.currentOccupancy ?? 0,
    openDate: apiData.openDate ?? '',
    coordinates: presentation.coordinates,
    markerPosition: presentation.markerPosition,
    photoPath: presentation.photoPath,
    narrative: apiData.notes || presentation.narrative,
    programs: presentation.programs,
  }
}

// Fetch safehouses from API and merge with presentation data
let cachedSafehouses: SafehouseData[] | null = null

export async function fetchSafehouses(): Promise<SafehouseData[]> {
  if (cachedSafehouses) return cachedSafehouses
  try {
    const data = await api.get<SafehouseApiResponse[]>('/api/safehouses')
    cachedSafehouses = data.map(mergeWithPresentation)
    return cachedSafehouses
  } catch {
    console.warn('Failed to fetch safehouses from API')
    return []
  }
}

export async function getSafehouseById(id: number): Promise<SafehouseData | undefined> {
  const all = await fetchSafehouses()
  return all.find((s) => s.id === id)
}

// Invalidate cache (call after mutations)
export function invalidateSafehouseCache() {
  cachedSafehouses = null
}
