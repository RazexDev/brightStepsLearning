import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  // 1. Check the browser's memory for the VIP wristband
  const token = localStorage.getItem('brightsteps_token');

  // 2. If the wristband is missing, instantly teleport them to the login screen
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 3. If they have the token, open the door and render whatever page they asked for
  return children;
}