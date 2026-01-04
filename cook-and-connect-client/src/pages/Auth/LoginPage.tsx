/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { ChefHat, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext'; //Hook Importado

const LoginPage: React.FC = () => {
  // // Estados temporales solo para la vista (luego conectaremos la lógica real)
  // const [email, setEmail] = useState('');
  // const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth(); // Sacamos la función de login del contexto
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   console.log('Intentando iniciar sesión con:', { email, password });
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // TRUCO DE UX: Agregamos un pequeño retraso artificial (800ms)
      // para que el usuario alcance a ver la animación de carga.
      await new Promise(resolve => setTimeout(resolve, 800));

      // Llamamos a la función login del contexto AuthContext
      await login(email, password);

      // Si no lanza error, redirigimos al usuario a la página principal
      navigate('/feed');

    } catch (err: any) {
      // Si hay un error (usuario baneado o contraseñas incorrectas), lo mostramos en rojo
      setError(err.message || 'Error al iniciar sesión, ha ocurrido un problema inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream dark:bg-brand-dark transition-colors duration-300 p-4 relative overflow-hidden">
      
      {/* --- FONDO DECORATIVO --- */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-brick/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-brand-amber/20 rounded-full blur-3xl pointer-events-none" />

      {/* --- BOTÓN REGRESAR --- */}
      <a className="absolute top-6 left-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-brand-dark dark:text-brand-cream"
      onClick={() => navigate('/')}>
        <ArrowLeft className="w-6 h-6" />
      </a>

      {/* --- TARJETA CENTRAL --- */}
      <div className="w-full max-w-md bg-white/60 dark:bg-brand-warmGray/30 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 dark:border-brand-warmGray p-8 md:p-10 relative z-10 animate-fade-in-up">
        
        {/* Encabezado de la tarjeta */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-peach/50 dark:bg-brand-brick/20 mb-4 text-brand-brick dark:text-brand-amber">
            <ChefHat className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold font-serif text-brand-dark dark:text-brand-cream">
            Inicio de Sesión
          </h1>
          <p className="text-sm text-brand-dark/60 dark:text-brand-cream/60 mt-2 font-sans">
            ¡Ingresa para compartir tus experiencias cocinando!
          </p>
        </div>

        {/* Mensaje de Error Global */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-600 rounded-md text-sm text-center font-medium animate-pulse">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Correo Electrónico"
            type="email"
            placeholder="ejemplo@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            //Pasamos el error para que se pinte rojo
            error={error ? " " : undefined} 
          />
          
          <div className="space-y-1">
            <Input 
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              //Pasamos el error para que se pinte rojo
              error={error ? " " : undefined}
            />
            <div className="flex justify-end">
              <button type="button" className="text-xs text-brand-brick hover:underline dark:text-brand-amber font-medium">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full shadow-lg" size="lg">
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Accediendo...
              </span>
            ) : (
              'Iniciar Sesión'
            )}
          </Button>
        </form>

        {/* Pie de la tarjeta */}
        <div className="mt-8 text-center pt-6 border-t border-gray-200 dark:border-white/10">
          <p className="text-sm text-brand-dark/70 dark:text-brand-cream/70">
            ¿Aún no tienes cuenta?{' '}
            <button className="text-brand-brick font-bold hover:underline dark:text-brand-amber cursor-pointer"
            onClick={() => navigate('/register')}>
              Regístrate aquí
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;