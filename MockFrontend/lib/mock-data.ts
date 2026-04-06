export const residents = [
  {
    id: "1",
    firstName: "Maria",
    lastName: "Santos",
    dateOfBirth: "2010-03-15",
    dateEnrolled: "2024-06-12",
    riskLevel: "Low",
    urgencyScore: 2,
    imageUrl: "/placeholder-resident.jpg",
  },
  {
    id: "2",
    firstName: "Sofia",
    lastName: "Rodriguez",
    dateOfBirth: "2011-08-22",
    dateEnrolled: "2024-01-08",
    riskLevel: "Medium",
    urgencyScore: 5,
    imageUrl: "/placeholder-resident.jpg",
  },
  {
    id: "3",
    firstName: "Isabella",
    lastName: "Garcia",
    dateOfBirth: "2009-11-30",
    dateEnrolled: "2023-09-15",
    riskLevel: "High",
    urgencyScore: 8,
    imageUrl: "/placeholder-resident.jpg",
  },
  {
    id: "4",
    firstName: "Camila",
    lastName: "Martinez",
    dateOfBirth: "2012-05-18",
    dateEnrolled: "2024-03-22",
    riskLevel: "Low",
    urgencyScore: 1,
    imageUrl: "/placeholder-resident.jpg",
  },
  {
    id: "5",
    firstName: "Valentina",
    lastName: "Lopez",
    dateOfBirth: "2010-09-07",
    dateEnrolled: "2024-02-14",
    riskLevel: "Medium",
    urgencyScore: 4,
    imageUrl: "/placeholder-resident.jpg",
  },
];

// Mock donors with login credentials
export const donors = [
  {
    id: "d1",
    email: "sarah@example.com",
    password: "donor123",
    firstName: "Sarah",
    lastName: "Mitchell",
    memberSince: "2023-05-15",
    totalDonated: 4850,
    livesImpacted: 18,
    monthsActive: 14,
    impactScore: 94,
    donationHistory: [
      { month: "Jan", amount: 200 },
      { month: "Feb", amount: 350 },
      { month: "Mar", amount: 200 },
      { month: "Apr", amount: 500 },
      { month: "May", amount: 350 },
      { month: "Jun", amount: 400 },
      { month: "Jul", amount: 600 },
      { month: "Aug", amount: 350 },
      { month: "Sep", amount: 500 },
      { month: "Oct", amount: 450 },
      { month: "Nov", amount: 500 },
      { month: "Dec", amount: 450 },
    ],
    impactByCategory: [
      { name: "Housing", value: 1800 },
      { name: "Education", value: 1200 },
      { name: "Counseling", value: 1100 },
      { name: "Healthcare", value: 500 },
      { name: "Nutrition", value: 250 },
    ],
    recentDonations: [
      { date: "2026-03-15", amount: 450, type: "Monthly" },
      { date: "2026-02-15", amount: 450, type: "Monthly" },
      { date: "2026-01-20", amount: 200, type: "One-time" },
      { date: "2026-01-15", amount: 450, type: "Monthly" },
    ],
  },
  {
    id: "d2",
    email: "james@example.com",
    password: "donor123",
    firstName: "James",
    lastName: "Chen",
    memberSince: "2024-01-10",
    totalDonated: 1250,
    livesImpacted: 6,
    monthsActive: 5,
    impactScore: 78,
    donationHistory: [
      { month: "Jan", amount: 0 },
      { month: "Feb", amount: 0 },
      { month: "Mar", amount: 0 },
      { month: "Apr", amount: 0 },
      { month: "May", amount: 0 },
      { month: "Jun", amount: 0 },
      { month: "Jul", amount: 0 },
      { month: "Aug", amount: 150 },
      { month: "Sep", amount: 200 },
      { month: "Oct", amount: 300 },
      { month: "Nov", amount: 250 },
      { month: "Dec", amount: 350 },
    ],
    impactByCategory: [
      { name: "Housing", value: 450 },
      { name: "Education", value: 350 },
      { name: "Counseling", value: 250 },
      { name: "Healthcare", value: 150 },
      { name: "Nutrition", value: 50 },
    ],
    recentDonations: [
      { date: "2026-03-01", amount: 350, type: "Monthly" },
      { date: "2026-02-01", amount: 350, type: "Monthly" },
      { date: "2026-01-01", amount: 350, type: "Monthly" },
    ],
  },
];

// Admin credentials
export const admins = [
  {
    id: "a1",
    email: "admin@lunas.org",
    password: "admin123",
    firstName: "Admin",
    lastName: "User",
    role: "Administrator",
  },
];

export const donationTrends = [
  { month: "Jan", amount: 12500 },
  { month: "Feb", amount: 15800 },
  { month: "Mar", amount: 14200 },
  { month: "Apr", amount: 18900 },
  { month: "May", amount: 22100 },
  { month: "Jun", amount: 19500 },
  { month: "Jul", amount: 24800 },
  { month: "Aug", amount: 21300 },
  { month: "Sep", amount: 26700 },
  { month: "Oct", amount: 28400 },
  { month: "Nov", amount: 32100 },
  { month: "Dec", amount: 38500 },
];

export const impactMetrics = [
  { name: "Housing", value: 45000 },
  { name: "Education", value: 28000 },
  { name: "Counseling", value: 35000 },
  { name: "Healthcare", value: 22000 },
  { name: "Nutrition", value: 15000 },
];

export const fundAllocation = [
  { name: "Direct Care", value: 55, fill: "var(--chart-1)" },
  { name: "Education", value: 20, fill: "var(--chart-2)" },
  { name: "Counseling", value: 15, fill: "var(--chart-3)" },
  { name: "Administration", value: 10, fill: "var(--chart-4)" },
];

export const adminStats = [
  { label: "Total Residents", value: "48" },
  { label: "Active Donors", value: "324" },
  { label: "Monthly Donations", value: "$38,500" },
  { label: "Success Stories", value: "127" },
];
