import { Navigate, Outlet } from 'react-router-dom';

interface RouteGuardProps {
  allowedRoles: ('Customer' | 'Organizer')[];
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ allowedRoles }) => {
  // Read the same session object saved by the login and registration pages.
  const sessionString = localStorage.getItem('ephemeral_user');
  let session: { token?: string; role?: string } | null = null;
  try {
    session = sessionString ? JSON.parse(sessionString) : null;
  } catch {
    localStorage.removeItem('ephemeral_user');
  }
  const token = session?.token;

  // Redirect unauthenticated users to login.
  if (!token || !session) {
    return <Navigate to="/login" replace />;
  }

  // Redirect users whose role cannot access this route.
  if (!session.role || !allowedRoles.includes(session.role as 'Customer' | 'Organizer')) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
