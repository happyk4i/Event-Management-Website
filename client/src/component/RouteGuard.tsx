import { Navigate, Outlet } from 'react-router-dom';

interface RouteGuardProps {
  allowedRoles: ('Customer' | 'Organizer')[];
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ allowedRoles }) => {
  // 1. Ambil token dan data user dari localStorage browser
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');

  // 2. Jika tidak ada token atau data user, tendang langsung ke halaman Login
  if (!token || !userString) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userString);

    // 3. Jika peran (role) user tidak sesuai dengan izin halaman, lempar ke halaman unauthorized / landing page
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />;
    }

    // 4. Jika lolos semua pemeriksaan, izinkan masuk ke halaman tujuan (Outlet)
    return <Outlet />;
  } catch (error) {
    // Jika data JSON localStorage rusak/korup, bersihkan dan minta login ulang
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }
};
