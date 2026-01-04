import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

//Corrección con los campos username, lastname y bio
// Definimos qué forma tiene nuestro Usuario (coincide con lo que devuelve tu Backend)
interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  firstname?: string;
  lastname?: string;
  bio?: string;
  role: 'user' | 'admin';
}

// Definimos qué funciones y datos tendrá nuestro contexto
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
    // Nueva función mágica para hacer peticiones seguras
  authFetch: (url: string, options?: RequestInit) => Promise<Response>; 
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // EFECTO: Al cargar la página, verificamos si ya había una sesión guardada
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // FUNCIÓN LOGIN: El puente con tu Backend
  const login = async (email: string, password: string) => {
    try {
      // 1. Llamamos al endpoint que creaste en el servidor
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      // 2. Si todo sale bien, guardamos los datos en localStorage y en el Estado
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user)); // Guardamos el objeto usuario

      setToken(data.token);
      setUser(data.user);

      // Mensaje sencillo de éxito (como pediste)
      //alert(`¡Inicio de sesión exitoso! Bienvenido ${data.user.username}`);

    } catch (error: unknown) {
      console.error("Login error:", error);
      throw error; // Lanzamos el error para que LoginPage lo muestre en rojo
    }
  };

  // FUNCIÓN LOGOUT: Limpiar todo
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    // Usamos window.location para forzar una recarga limpia y borrar estados de memoria
    window.location.href = '/login'; // Redirigir al login
  };

  // --- NUEVA FUNCIÓN: FETCH AUTENTICADO ---
  // Envuelve al fetch normal para manejar tokens y errores de sesión automáticamente
  const authFetch = async (url: string, options: RequestInit = {}) => {
    // 1. Preparamos las cabeceras
    const headers = new Headers(options.headers || {});
    
    // Si tenemos token, lo inyectamos automáticamente (adiós a ponerlo manualmente en cada componente)
    if (token) {
      headers.append('Authorization', `Bearer ${token}`);
    }

    const config = { ...options, headers };

    // 2. Hacemos la petición
    const response = await fetch(url, config);

    // 3. INTERCEPTOR DE SEGURIDAD
    // Si el servidor dice 401 (No autorizado) o 403 (Prohibido/Token Expirado)
    if (response.status === 401 || response.status === 403) {
      console.warn("Sesión expirada o inválida. Cerrando sesión...");
      logout(); // ¡Saca al usuario inmediatamente!
      throw new Error('Sesión expirada'); // Detiene la ejecución del componente
    }

    return response;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isAuthenticated: !!user, // Es true si user existe
      login, 
      logout,
      authFetch, // Exponemos la función mágica
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto fácilmente
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
};