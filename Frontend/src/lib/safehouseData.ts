export interface SafehouseData {
  id: number
  name: string
  code: string
  city: string
  province: string
  region: 'Luzon' | 'Visayas' | 'Mindanao'
  capacity: number
  occupancy: number
  openDate: string
  coordinates: { lat: number; lng: number }
  markerPosition: { top: string; left: string }
  photoPath: string
  residentStoryIds: number[]
  narrative: string
  programs: string[]
}

export const safehouses: SafehouseData[] = [
  {
    id: 1,
    name: 'Lighthouse Safehouse 1',
    code: 'SH01',
    city: 'Quezon City',
    province: 'Metro Manila',
    region: 'Luzon',
    capacity: 8,
    occupancy: 8,
    openDate: '2022-01-01',
    coordinates: { lat: 14.676, lng: 121.044 },
    markerPosition: { top: '34%', left: '42%' },
    photoPath: '/images/otherImages/GirlStandingInHouseYard.png',
    residentStoryIds: [1],
    narrative:
      'Lighthouse 1 was the first Lunas safehouse, opening its doors in Quezon City in January 2022. Nestled in a quiet residential neighborhood in Metro Manila, it provides a home for eight girls recovering from trafficking and abuse. The house specializes in trauma-informed counseling and runs a partnership with a local school so residents can continue their education without interruption.',
    programs: ['Trauma-informed counseling', 'School partnership program', 'Life skills workshops'],
  },
  {
    id: 2,
    name: 'Lighthouse Safehouse 2',
    code: 'SH02',
    city: 'Cebu City',
    province: 'Cebu',
    region: 'Visayas',
    capacity: 10,
    occupancy: 8,
    openDate: '2022-02-15',
    coordinates: { lat: 10.316, lng: 123.885 },
    markerPosition: { top: '56%', left: '55%' },
    photoPath: '/images/otherImages/GroupTalking.png',
    residentStoryIds: [3],
    narrative:
      'Located in the heart of Cebu City, Lighthouse 2 opened just weeks after the first safehouse. It serves ten girls and has become a model for community-integrated care in the Visayas region. The house is known for its strong education focus, with most residents enrolled in secondary equivalency studies at a nearby learning center.',
    programs: ['Secondary equivalency studies', 'Group therapy sessions', 'Peer mentorship'],
  },
  {
    id: 3,
    name: 'Lighthouse Safehouse 3',
    code: 'SH03',
    city: 'Davao City',
    province: 'Davao del Sur',
    region: 'Mindanao',
    capacity: 9,
    occupancy: 9,
    openDate: '2022-04-01',
    coordinates: { lat: 7.191, lng: 125.455 },
    markerPosition: { top: '72%', left: '60%' },
    photoPath: '/images/otherImages/ComfortingYoungChild.png',
    residentStoryIds: [7],
    narrative:
      'Lighthouse 3 brought Lunas to Mindanao, opening in Davao City in April 2022. With nine girls at full capacity, the safehouse focuses on family reunification and reintegration planning. A dedicated social worker coordinates supervised family visitation and works with local agencies to prepare girls for life beyond the safehouse.',
    programs: ['Family reunification coordination', 'Supervised visitation', 'Social worker case management'],
  },
  {
    id: 4,
    name: 'Lighthouse Safehouse 4',
    code: 'SH04',
    city: 'Iloilo City',
    province: 'Iloilo',
    region: 'Visayas',
    capacity: 12,
    occupancy: 12,
    openDate: '2022-05-16',
    coordinates: { lat: 10.720, lng: 122.562 },
    markerPosition: { top: '55%', left: '44%' },
    photoPath: '/images/otherImages/GirlPaperCraft.png',
    residentStoryIds: [2],
    narrative:
      'The largest Lunas safehouse, Lighthouse 4 in Iloilo City cares for twelve girls and has a strong health and wellness program. Coordinated medical care, nutritional planning, and sleep monitoring help residents recover physically alongside their emotional healing. The house partners with a local clinic for regular health checkups.',
    programs: ['Coordinated medical care', 'Nutrition & wellness program', 'Sleep health monitoring'],
  },
  {
    id: 5,
    name: 'Lighthouse Safehouse 5',
    code: 'SH05',
    city: 'Baguio City',
    province: 'Benguet',
    region: 'Luzon',
    capacity: 11,
    occupancy: 9,
    openDate: '2022-06-30',
    coordinates: { lat: 16.402, lng: 120.596 },
    markerPosition: { top: '22%', left: '36%' },
    photoPath: '/images/otherImages/GirlStudyingOnWall1.png',
    residentStoryIds: [5],
    narrative:
      'Set in the cool highlands of Baguio City, Lighthouse 5 is Lunas\u2019 vocational training hub. Residents learn practical skills like sewing, textile arts, and basic computer literacy, preparing them for economic independence. Older residents who complete programs often stay on as peer mentors, teaching younger girls the same skills.',
    programs: ['Sewing & textile arts', 'Computer literacy', 'Peer mentorship training'],
  },
  {
    id: 6,
    name: 'Lighthouse Safehouse 6',
    code: 'SH06',
    city: 'Cagayan de Oro',
    province: 'Misamis Oriental',
    region: 'Mindanao',
    capacity: 8,
    occupancy: 6,
    openDate: '2022-08-14',
    coordinates: { lat: 8.454, lng: 124.632 },
    markerPosition: { top: '63%', left: '53%' },
    photoPath: '/images/otherImages/3GirlsSittingOnAWall.png',
    residentStoryIds: [6],
    narrative:
      'Lighthouse 6 in Cagayan de Oro is known for its award-winning art therapy program. Guided by a trained art therapist, residents explore painting, drawing, and mixed media as a path to emotional expression and healing. Several girls have presented their work at local community exhibitions, building confidence and public speaking skills.',
    programs: ['Art therapy', 'Creative expression workshops', 'Community exhibition program'],
  },
  {
    id: 7,
    name: 'Lighthouse Safehouse 7',
    code: 'SH07',
    city: 'Bacolod',
    province: 'Negros Occidental',
    region: 'Visayas',
    capacity: 12,
    occupancy: 12,
    openDate: '2022-09-28',
    coordinates: { lat: 10.684, lng: 122.956 },
    markerPosition: { top: '57%', left: '47%' },
    photoPath: '/images/otherImages/GirlWithSquash1.png',
    residentStoryIds: [8],
    narrative:
      'At full capacity with twelve girls, Lighthouse 7 in Bacolod runs Lunas\u2019 most comprehensive literacy program. Residents who arrive with limited reading ability receive intensive daily instruction and typically reach independent reading level within eight months. The safehouse also maintains a small garden where girls learn basic agriculture and nutrition.',
    programs: ['Intensive literacy program', 'Urban gardening & nutrition', 'Daily reading instruction'],
  },
  {
    id: 8,
    name: 'Lighthouse Safehouse 8',
    code: 'SH08',
    city: 'Tacloban',
    province: 'Leyte',
    region: 'Visayas',
    capacity: 9,
    occupancy: 7,
    openDate: '2022-11-12',
    coordinates: { lat: 11.254, lng: 124.960 },
    markerPosition: { top: '51%', left: '62%' },
    photoPath: '/images/otherImages/GirlSunset2.png',
    residentStoryIds: [9],
    narrative:
      'Lighthouse 8 in Tacloban serves a community still rebuilding after years of natural disasters. The safehouse places special emphasis on community leadership, encouraging residents to take active roles in house governance and peer support. Girls who show readiness are selected as peer mentors, helping newly arrived residents adjust to safehouse life.',
    programs: ['Peer mentor selection program', 'Community leadership training', 'Disaster resilience education'],
  },
  {
    id: 9,
    name: 'Lighthouse Safehouse 9',
    code: 'SH09',
    city: 'General Santos',
    province: 'South Cotabato',
    region: 'Mindanao',
    capacity: 6,
    occupancy: 6,
    openDate: '2022-12-27',
    coordinates: { lat: 6.116, lng: 125.172 },
    markerPosition: { top: '78%', left: '55%' },
    photoPath: '/images/otherImages/GirlStudyingOnWall2.png',
    residentStoryIds: [10],
    narrative:
      'The newest and most intimate Lunas safehouse, Lighthouse 9 in General Santos focuses on preparing older residents for independent living. Girls learn budgeting, cooking, job interview skills, and workplace readiness. The small size of the house creates a close-knit family atmosphere that helps residents build lasting trust and support networks.',
    programs: ['Independent living skills', 'Job readiness training', 'Financial literacy & budgeting'],
  },
]

export const totalCapacity = safehouses.reduce((sum, s) => sum + s.capacity, 0)
export const totalOccupancy = safehouses.reduce((sum, s) => sum + s.occupancy, 0)

export function getSafehouseById(id: number): SafehouseData | undefined {
  return safehouses.find((s) => s.id === id)
}
