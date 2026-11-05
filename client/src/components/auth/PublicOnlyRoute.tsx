import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { PageLoader } from '../ui/PageLoader';
import { getRedirectPath } from './redirect';

/** For login/register pages: signed-in farmers are sent on to where they were going. */
export function PublicOnlyRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  if (user) {
    return <Navigate to={getRedirectPath(location.state)} replace />;
  }

  return <Outlet />;
}
