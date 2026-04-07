const API = import.meta.env.VITE_API_BASE_URL as string;

export interface AuthSession {
  isAuthenticated: boolean;
  userName: string | null;
  email: string | null;
  roles: string[];
}

export async function getAuthSession(): Promise<AuthSession> {
  const res = await fetch(`${API}/api/auth/me`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch session.');
  return res.json() as Promise<AuthSession>;
}

export async function login(email: string, password: string): Promise<void> {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Login failed.');
  }
}

export async function register(email: string, password: string): Promise<void> {
  const res = await fetch(`${API}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Registration failed.');
  }
}

export async function logout(): Promise<void> {
  await fetch(`${API}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export function getGoogleLoginUrl(returnPath = '/admin'): string {
  return `${API}/api/auth/external-login?provider=Google&returnPath=${encodeURIComponent(returnPath)}`;
}
