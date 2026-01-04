import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 1. Mientras verificamos si hay sesión, mostramos un spinner para no rebotar al usuario por error
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream dark:bg-brand-dark">
        <Loader2 className="w-10 h-10 text-brand-brick animate-spin" />
      </div>
    );
  }

  // 2. Si terminó de cargar y NO está autenticado, lo mandamos al Login
  if (!isAuthenticated) {
    // 'state={{ from: location }}' nos sirve para que, tras loguearse, 
    // lo regresemos a la página que intentó visitar (UX Pro)
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Si está autenticado, le dejamos pasar
  return <>{children}</>;
};

export default ProtectedRoute;