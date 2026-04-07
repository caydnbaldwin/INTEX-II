import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { logout } from '@/lib/authApi';

export default function LogoutPage() {
  const navigate = useNavigate();
  const { refreshAuthState } = useAuth();

  useEffect(() => {
    async function doLogout() {
      await logout();
      await refreshAuthState();
      navigate('/', { replace: true });
    }
    void doLogout();
  }, [navigate, refreshAuthState]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary-container border-t-primary animate-spin" />
        <p className="text-body-medium text-on-surface-variant">Signing out...</p>
      </div>
    </div>
  );
}
