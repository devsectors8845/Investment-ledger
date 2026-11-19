import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';
import { HOME_FOR_ROLE, LOGIN_FOR_ROLE } from './roles';

/** Renders child routes only when the signed-in profile has `role`. */
export default function ProtectedRoute({ role }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid h-full place-items-center">
        <Spinner />
      </div>
    );
  }
  if (!user || !profile) {
    return <Navigate to={LOGIN_FOR_ROLE[role]} replace state={{ from: location }} />;
  }
  if (profile.role !== role) {
    return <Navigate to={HOME_FOR_ROLE[profile.role] ?? '/login'} replace />;
  }
  return <Outlet />;
}
