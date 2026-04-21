import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute — guards a route behind auth + optional role check.
 *
 * Props:
 *   children     — the page component to render
 *   allowedRoles — optional string[] of roles that may access this route
 *                  if omitted, any authenticated user may access it
 *
 * Behaviour:
 *   1. No token → redirect to /login
 *   2. Role not in allowedRoles → redirect to /unauthorized
 *   3. All good → render children
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('brightsteps_token');

  // 1. Not logged in at all
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Role check (only when allowedRoles is specified)
  if (allowedRoles && allowedRoles.length > 0) {
    try {
      const user = JSON.parse(localStorage.getItem('brightsteps_user'));
      const isParentUnlocked = sessionStorage.getItem('parent_unlocked') === 'true';

      // Allow access if user has the correct role OR if they have unlocked parent mode via PIN
      const hasPermission = user && (allowedRoles.includes(user.role) || (user.role === 'student' && isParentUnlocked));

      if (!hasPermission) {
        return <Navigate to="/unauthorized" replace />;
      }
    } catch {
      return <Navigate to="/login" replace />;
    }
  }

  // 3. All good
  return children;
}