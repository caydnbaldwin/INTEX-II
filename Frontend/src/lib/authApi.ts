const API = import.meta.env.VITE_API_BASE_URL as string;

export interface AuthSession {
  isAuthenticated: boolean;
  userName: string | null;
  email: string | null;
  roles: string[];
}

export type LoginResult =
  | { status: 'ok' }
  | { status: 'requiresTwoFactor' }
  | { status: 'error'; message: string };

export async function getAuthSession(): Promise<AuthSession> {
  const res = await fetch(`${API}/api/auth/me`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch session.');
  return res.json() as Promise<AuthSession>;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const res = await fetch(`${API}/api/auth/login?useCookies=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  if (res.ok) return { status: 'ok' };

  const data = await res.json().catch(() => ({})) as { detail?: string };

  if (res.status === 401 && data.detail === 'requiresTwoFactor') {
    return { status: 'requiresTwoFactor' };
  }

  return { status: 'error', message: data.detail || 'Login failed.' };
}

export async function loginWithTwoFactor(
  email: string,
  password: string,
  twoFactorCode: string,
): Promise<LoginResult> {
  const res = await fetch(`${API}/api/auth/login?useCookies=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, twoFactorCode }),
  });

  if (res.ok) return { status: 'ok' };

  const data = await res.json().catch(() => ({})) as { detail?: string };
  return { status: 'error', message: data.detail || 'Invalid verification code.' };
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

// ── MFA management ────────────────────────────────────────────────────────────

export async function getMfaStatus(): Promise<boolean> {
  const res = await fetch(`${API}/api/mfa/status`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch MFA status.');
  const data = await res.json() as { isMfaEnabled: boolean };
  return data.isMfaEnabled;
}

export async function getMfaSetup(): Promise<{ sharedKey: string; qrCodeUri: string }> {
  const res = await fetch(`${API}/api/mfa/setup`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch MFA setup.');
  return res.json() as Promise<{ sharedKey: string; qrCodeUri: string }>;
}

export async function enableMfa(code: string): Promise<void> {
  const res = await fetch(`${API}/api/mfa/enable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(data.message || 'Failed to enable MFA.');
  }
}

export async function disableMfa(): Promise<void> {
  const res = await fetch(`${API}/api/mfa/disable`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to disable MFA.');
}

export async function completeMfaChallenge(code: string): Promise<void> {
  const res = await fetch(`${API}/api/auth/mfa-challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(data.message || 'Invalid verification code.');
  }
}
