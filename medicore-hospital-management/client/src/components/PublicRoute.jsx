import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <p className="route-status">Checking your session…</p>;
  }

  return isAuthenticated ? <Navigate to="/app" replace /> : children;
}

export default PublicRoute;
