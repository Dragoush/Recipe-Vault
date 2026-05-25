import { Navigate, Outlet, useLocation } from 'react-router-dom';
import StatusPanel from '../../components/StatusPanel';
import useAuth from './useAuth';

export default function RequireAuth() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.isBootstrapping) {
    return (
      <div className="stack-lg">
        <StatusPanel
          title="Restoring your session..."
          description="Checking whether you are still signed in."
        />
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <Navigate replace to="/login" state={{ from: location }} />;
  }

  return <Outlet />;
}
