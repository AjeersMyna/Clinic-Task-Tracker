// frontend/src/components/PrivateRoute.js

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function PrivateRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="text-center my-5">Loading authentication...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />; // Redirect to login if not authenticated
  }

  // Optional: Check for required role if provided
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />; // Or to an unauthorized page
  }

  return children;
}

export default PrivateRoute;