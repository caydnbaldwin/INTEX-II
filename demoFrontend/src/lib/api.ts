// API Service Layer
// Replace BASE_URL with your .NET backend URL when ready to connect

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Types for authentication
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: 'Admin' | 'Staff' | 'Donor' | 'Visitor'
  }
}

// Generic fetch wrapper with error handling
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('authToken')
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error(error.message || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// Authentication endpoints
export const authApi = {
  login: (credentials: LoginCredentials) =>
    fetchApi<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (data: RegisterData) =>
    fetchApi<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => fetchApi<AuthResponse['user']>('/auth/me'),

  logout: () => {
    localStorage.removeItem('authToken')
  },
}

// Public endpoints (no auth required)
export const publicApi = {
  getImpactSnapshots: () =>
    fetchApi<unknown[]>('/public/impact-snapshots'),

  getSafehouseMetrics: () =>
    fetchApi<unknown[]>('/public/safehouse-metrics'),

  getDonationSummary: () =>
    fetchApi<unknown>('/public/donation-summary'),
}

// Admin endpoints (requires Admin role)
export const adminApi = {
  // Residents
  getResidents: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return fetchApi<unknown[]>(`/admin/residents${query}`)
  },
  
  getResident: (id: string) =>
    fetchApi<unknown>(`/admin/residents/${id}`),
  
  createResident: (data: unknown) =>
    fetchApi<unknown>('/admin/residents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateResident: (id: string, data: unknown) =>
    fetchApi<unknown>(`/admin/residents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  deleteResident: (id: string) =>
    fetchApi<void>(`/admin/residents/${id}`, {
      method: 'DELETE',
    }),

  // Donors
  getDonors: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return fetchApi<unknown[]>(`/admin/donors${query}`)
  },
  
  getDonor: (id: string) =>
    fetchApi<unknown>(`/admin/donors/${id}`),

  // Dashboard stats
  getDashboardStats: () =>
    fetchApi<unknown>('/admin/dashboard/stats'),

  // Reports
  getReports: (type: string, params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return fetchApi<unknown>(`/admin/reports/${type}${query}`)
  },
}

// Donor endpoints (requires Donor role)
export const donorApi = {
  getMyDonations: () =>
    fetchApi<unknown[]>('/donor/donations'),

  getMyImpact: () =>
    fetchApi<unknown>('/donor/impact'),
}
