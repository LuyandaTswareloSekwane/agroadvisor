import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { PageLoader } from '../ui/PageLoader';
import type { RedirectState } from './redirect';

/** Renders child routes only for signed-in farmers; others are sent to the login page. */
export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user) {
    const state: RedirectState = { from: location.pathname };
    return <Navigate to="/login" replace state={state} />;
  }

  return <Outlet />;
}
