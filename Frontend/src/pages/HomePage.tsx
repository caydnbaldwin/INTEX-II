import { Link } from 'react-router-dom';
import { useState } from 'react';

const pages = [
  { to: '/', label: 'Home' },
  { to: '/login', label: 'Login' },
  { to: '/register', label: 'Register' },
  { to: '/logout', label: 'Logout' },
  { to: '/impact', label: 'Impact Dashboard' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/dashboard', label: 'Dashboard (Admin)' },
  { to: '/donors', label: 'Donors (Admin)' },
  { to: '/mfa', label: 'Manage MFA (Authenticated)' },
];

export default function HomePage() {
  const API = import.meta.env.VITE_API_BASE_URL as string;
  const [backendStatus, setBackendStatus] = useState('');
  const [dbStatus, setDbStatus] = useState('');
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);
  const [isCheckingDb, setIsCheckingDb] = useState(false);

  async function verifyBackend() {
    setBackendStatus('Checking backend...');
    setIsCheckingBackend(true);

    try {
      const response = await fetch(`${API}/api/health`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        setBackendStatus(`Backend check failed (${response.status}).`);
        return;
      }

      const data = await response.json() as { message?: string };
      setBackendStatus(data.message ?? 'Backend reachable.');
    } catch {
      setBackendStatus('Unable to reach backend.');
    } finally {
      setIsCheckingBackend(false);
    }
  }

  async function verifyDatabase() {
    setDbStatus('Checking database...');
    setIsCheckingDb(true);

    try {
      const response = await fetch(`${API}/api/dbcheck`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        setDbStatus(`Database check failed (${response.status}).`);
        return;
      }

      const data = await response.json() as Record<string, unknown>;
      const tableCount = Object.keys(data).length;
      setDbStatus(`Database check succeeded (${tableCount} tables verified).`);
    } catch {
      setDbStatus('Unable to reach database check endpoint.');
    } finally {
      setIsCheckingDb(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-headline-large text-on-surface mb-6">HomePage</h1>

      <div className="mb-8 flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={verifyBackend}
            disabled={isCheckingBackend}
            className="h-10 px-4 rounded-shape-full bg-primary text-on-primary text-label-large hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isCheckingBackend ? 'Verifying Backend...' : 'Verify Backend'}
          </button>

          <button
            type="button"
            onClick={verifyDatabase}
            disabled={isCheckingDb}
            className="h-10 px-4 rounded-shape-full border border-outline text-on-surface text-label-large hover:bg-surface-container active:bg-surface-container-high transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isCheckingDb ? 'Verifying Database...' : 'Verify Database'}
          </button>
        </div>

        {backendStatus && (
          <p className="text-body-medium text-on-surface">Backend: {backendStatus}</p>
        )}

        {dbStatus && (
          <p className="text-body-medium text-on-surface">Database: {dbStatus}</p>
        )}
      </div>

      <ul className="flex flex-col gap-2">
        {pages.map((page) => (
          <li key={page.to}>
            <Link
              to={page.to}
              className="text-body-large text-primary hover:underline"
            >
              {page.label} <span className="text-on-surface-variant">({page.to})</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
