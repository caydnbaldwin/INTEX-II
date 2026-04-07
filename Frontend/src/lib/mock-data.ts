// Mock data based on PRD specifications
// This data will be replaced with API calls to your .NET backend

export interface PublicImpactSnapshot {
  id: number
  snapshotMonth: string
  totalResidentsServed: number
  activeResidents: number
  residentsReintegrated: number
  educationCompletions: number
  avgHealthScore: number
  counselingSessions: number
  homeVisitations: number
}

export interface SafehouseMetric {
  id: number
  safehouseName: string
  region: string
  capacity: number
  currentOccupancy: number
  avgEducationProgress: number
  avgHealthScore: number
  incidentCount: number
}

export interface DonationSummary {
  totalDonations: number
  totalAmount: number
  recurringDonors: number
  newDonorsThisMonth: number
  topCampaign: string
  topCampaignAmount: number
}

// Public Impact Snapshots (anonymized data for public dashboard)
export const publicImpactSnapshots: PublicImpactSnapshot[] = [
  { id: 1, snapshotMonth: '2025-01', totalResidentsServed: 42, activeResidents: 28, residentsReintegrated: 2, educationCompletions: 3, avgHealthScore: 78, counselingSessions: 186, homeVisitations: 45 },
  { id: 2, snapshotMonth: '2025-02', totalResidentsServed: 44, activeResidents: 29, residentsReintegrated: 1, educationCompletions: 2, avgHealthScore: 79, counselingSessions: 198, homeVisitations: 52 },
  { id: 3, snapshotMonth: '2025-03', totalResidentsServed: 46, activeResidents: 30, residentsReintegrated: 2, educationCompletions: 4, avgHealthScore: 81, counselingSessions: 212, homeVisitations: 48 },
  { id: 4, snapshotMonth: '2025-04', totalResidentsServed: 48, activeResidents: 30, residentsReintegrated: 3, educationCompletions: 2, avgHealthScore: 80, counselingSessions: 225, homeVisitations: 56 },
  { id: 5, snapshotMonth: '2025-05', totalResidentsServed: 50, activeResidents: 29, residentsReintegrated: 2, educationCompletions: 3, avgHealthScore: 82, counselingSessions: 238, homeVisitations: 61 },
  { id: 6, snapshotMonth: '2025-06', totalResidentsServed: 52, activeResidents: 30, residentsReintegrated: 2, educationCompletions: 5, avgHealthScore: 83, counselingSessions: 245, homeVisitations: 58 },
  { id: 7, snapshotMonth: '2025-07', totalResidentsServed: 54, activeResidents: 30, residentsReintegrated: 1, educationCompletions: 2, avgHealthScore: 82, counselingSessions: 252, homeVisitations: 64 },
  { id: 8, snapshotMonth: '2025-08', totalResidentsServed: 55, activeResidents: 30, residentsReintegrated: 3, educationCompletions: 4, avgHealthScore: 84, counselingSessions: 268, homeVisitations: 67 },
  { id: 9, snapshotMonth: '2025-09', totalResidentsServed: 57, activeResidents: 30, residentsReintegrated: 2, educationCompletions: 3, avgHealthScore: 85, counselingSessions: 275, homeVisitations: 62 },
  { id: 10, snapshotMonth: '2025-10', totalResidentsServed: 58, activeResidents: 30, residentsReintegrated: 2, educationCompletions: 2, avgHealthScore: 84, counselingSessions: 281, homeVisitations: 70 },
  { id: 11, snapshotMonth: '2025-11', totalResidentsServed: 59, activeResidents: 30, residentsReintegrated: 1, educationCompletions: 3, avgHealthScore: 85, counselingSessions: 290, homeVisitations: 68 },
  { id: 12, snapshotMonth: '2025-12', totalResidentsServed: 60, activeResidents: 30, residentsReintegrated: 2, educationCompletions: 4, avgHealthScore: 86, counselingSessions: 298, homeVisitations: 72 },
]

// Safehouse metrics (aggregated, anonymized)
export const safehouseMetrics: SafehouseMetric[] = [
  { id: 1, safehouseName: 'Haven of Hope', region: 'Luzon', capacity: 10, currentOccupancy: 8, avgEducationProgress: 78, avgHealthScore: 84, incidentCount: 3 },
  { id: 2, safehouseName: 'Light House', region: 'Luzon', capacity: 8, currentOccupancy: 7, avgEducationProgress: 82, avgHealthScore: 86, incidentCount: 2 },
  { id: 3, safehouseName: 'New Dawn', region: 'Visayas', capacity: 12, currentOccupancy: 10, avgEducationProgress: 75, avgHealthScore: 82, incidentCount: 4 },
  { id: 4, safehouseName: 'Safe Harbor', region: 'Visayas', capacity: 10, currentOccupancy: 9, avgEducationProgress: 80, avgHealthScore: 85, incidentCount: 2 },
  { id: 5, safehouseName: 'Sunrise Home', region: 'Visayas', capacity: 8, currentOccupancy: 6, avgEducationProgress: 77, avgHealthScore: 83, incidentCount: 1 },
  { id: 6, safehouseName: 'Grace House', region: 'Visayas', capacity: 10, currentOccupancy: 8, avgEducationProgress: 79, avgHealthScore: 84, incidentCount: 3 },
  { id: 7, safehouseName: 'Peaceful Valley', region: 'Mindanao', capacity: 10, currentOccupancy: 7, avgEducationProgress: 81, avgHealthScore: 85, incidentCount: 2 },
  { id: 8, safehouseName: 'Mountain Refuge', region: 'Mindanao', capacity: 9, currentOccupancy: 8, avgEducationProgress: 76, avgHealthScore: 82, incidentCount: 4 },
  { id: 9, safehouseName: 'Coastal Sanctuary', region: 'Mindanao', capacity: 8, currentOccupancy: 7, avgEducationProgress: 83, avgHealthScore: 87, incidentCount: 1 },
]

// Donation summary for public display
export const donationSummary: DonationSummary = {
  totalDonations: 420,
  totalAmount: 2850000, // in PHP
  recurringDonors: 211,
  newDonorsThisMonth: 8,
  topCampaign: 'Year-End Hope',
  topCampaignAmount: 680000,
}

// Aggregated statistics for landing page
export const impactStatistics = {
  girlsServed: 150,
  safehousesOperating: 9,
  counselingSessions: 2819,
  reintegrationRate: 63, // percentage
  regionsServed: 3,
  yearsOperating: 5,
}

// Education program breakdown
export const educationPrograms = [
  { name: 'Secondary Education', enrolled: 24, completed: 15 },
  { name: 'Bridge Program', enrolled: 18, completed: 12 },
  { name: 'Vocational Training', enrolled: 12, completed: 8 },
  { name: 'Literacy Program', enrolled: 6, completed: 4 },
]

// Reintegration outcomes
export const reintegrationOutcomes = [
  { type: 'Family Reunification', count: 12, percentage: 63 },
  { type: 'Foster Care', count: 4, percentage: 21 },
  { type: 'Independent Living', count: 2, percentage: 11 },
  { type: 'Adoption', count: 1, percentage: 5 },
]

// Risk level distribution (anonymized for admin overview)
export const riskDistribution = {
  low: 34,
  medium: 20,
  high: 5,
  critical: 1,
}

// Case status distribution
export const caseStatusDistribution = {
  active: 30,
  closed: 19,
  transferred: 11,
}
