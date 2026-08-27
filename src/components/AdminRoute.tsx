import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loader from './Loader';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: '/admin' }} />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
