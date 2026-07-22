import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PageLoader from '../ui/PageLoader';

export default function AdminRoute() {
  const { user, role, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (role !== 'admin' && role !== 'super_admin') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
