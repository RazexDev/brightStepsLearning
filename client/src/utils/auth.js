/**
 * auth.js — Role-based redirect utility
 * Centralizes post-login navigation so every component
 * uses the same routing logic.
 */

/**
 * Redirect a user to their role-appropriate dashboard.
 * @param {string} role  - The user's role from the auth response
 * @param {Function} navigate - React Router's navigate function
 */
export function redirectByRole(role, navigate) {
  switch (role) {
    case 'teacher':
      navigate('/teacher-dashboard');
      break;
    case 'admin':
      navigate('/admin-dashboard');
      break;
    case 'parent':
    case 'student':
    default:
      navigate('/dashboard');
  }
}

/**
 * Get the current logged-in user object from localStorage
 */
export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('brightsteps_user')) || null;
  } catch {
    return null;
  }
}

/**
 * Get the current user's role
 */
export function getCurrentRole() {
  return getCurrentUser()?.role || null;
}

/**
 * Check if user is logged in
 */
export function isAuthenticated() {
  return !!localStorage.getItem('brightsteps_token');
}

/**
 * Log out the current user
 */
export function logout(navigate) {
  localStorage.removeItem('brightsteps_token');
  localStorage.removeItem('brightsteps_user');
  navigate('/login');
}
