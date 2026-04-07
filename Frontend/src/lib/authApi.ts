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

export async function logout(): Promise<void> {
  await fetch(`${API}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}
